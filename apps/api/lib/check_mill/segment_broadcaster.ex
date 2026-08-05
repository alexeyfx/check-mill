defmodule CheckMill.SegmentBroadcaster do
  @moduledoc """
  Coalesces toggles per grid segment and broadcasts them on a flush interval.

  Toggles arrive as casts and accumulate in a per-segment buffer keyed by grid
  index, so repeated flips of the same checkbox collapse to its final value. Each
  segment schedules its own flush, so a quiet segment costs nothing.

  Batches are published through `Phoenix.Channel.Server` as the PubSub
  dispatcher, which honours the fastlane metadata `CheckMillWeb.GridChannel`
  subscribes with: the payload is encoded once and written straight to each
  subscriber's transport. Broadcasting a plain term instead would wake every
  subscribed channel process to serialise an identical payload, making delivery
  cost scale with the audience.
  """

  use GenServer

  import Bitwise

  alias CheckMill.{GridConfig, GridStore}
  alias Phoenix.Socket.Broadcast

  @broadcast_flush_ms GridConfig.broadcast_flush_ms()

  @seg_bits GridConfig.seg_bits()
  @seg_bytes GridConfig.seg_bytes()
  @seg_mask @seg_bits - 1

  @packed_header_bytes 7
  @bitmap_bytes 5 + @seg_bytes
  @max_packed_patches div((@bitmap_bytes - @packed_header_bytes) * 8, 12)

  # Frames carry the topic clients joined, not the segment topic they are
  # published on; phoenix.js routes on the former.
  @client_topic "grid:main"

  defmodule Segment do
    @moduledoc false

    defstruct timer_ref: nil, buf: %{}, seq: 0

    @type t :: %__MODULE__{
            timer_ref: reference() | nil,
            buf: %{non_neg_integer() => 0 | 1},
            seq: non_neg_integer()
          }
  end

  @doc "Starts the broadcaster."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(_opts), do: GenServer.start_link(__MODULE__, %{}, name: __MODULE__)

  @doc """
  Records that `idx` in `seg_id` now holds `val`.

  Asynchronous. The patch goes out with the segment's next flush.
  """
  @spec enqueue(non_neg_integer(), non_neg_integer(), 0 | 1) :: :ok
  def enqueue(seg_id, idx, val) do
    GenServer.cast(__MODULE__, {:enqueue, seg_id, idx, val})
  end

  @doc """
  Encodes a segment's pending patches into a `patch_batch` payload.

  Two shapes behind a leading kind byte, whichever is smaller:

      0  seg::16, seq::16, count::16, (offset::11, val::1) * count, padding
      1  seg::16, seq::16, bits::2048

  A segment holds 2^11 bits, so 11 bits locate any index within it and the
  twelfth carries the value — 1.5 bytes per patch. Past #{@max_packed_patches}
  patches the whole segment is cheaper, which caps a batch at #{@bitmap_bytes}
  bytes however hot the segment gets.

  Kind 1 is absolute state rather than a delta, so it is idempotent and needs no
  gap detection; kind 0 carries `seq` for that. Bit order is msb0 throughout.
  """
  @spec encode_patch_batch(non_neg_integer(), non_neg_integer(), %{non_neg_integer() => 0 | 1}) ::
          binary()
  def encode_patch_batch(seg_id, seq, buf) when map_size(buf) <= @max_packed_patches do
    bits =
      Enum.reduce(buf, <<>>, fn {idx, val}, acc ->
        <<acc::bitstring, idx &&& @seg_mask::11, val::1>>
      end)

    pad = rem(8 - rem(bit_size(bits), 8), 8)

    <<0::8, seg_id::16, seq::16, map_size(buf)::16, bits::bitstring, 0::size(pad)>>
  end

  def encode_patch_batch(seg_id, seq, _buf) do
    <<1::8, seg_id::16, seq::16, GridStore.window_snapshot(seg_id * @seg_bits)::binary>>
  end

  @doc "The largest batch that still encodes more cheaply as a delta than as a bitmap."
  @spec max_packed_patches() :: pos_integer()
  def max_packed_patches, do: @max_packed_patches

  @impl GenServer
  @spec init(map()) :: {:ok, map()}
  def init(state), do: {:ok, state}

  @impl GenServer
  def handle_cast({:enqueue, seg_id, idx, val}, segments) do
    segments =
      Map.update(
        segments,
        seg_id,
        %Segment{} |> put_patch(idx, val) |> ensure_timer(seg_id),
        &(&1 |> put_patch(idx, val) |> ensure_timer(seg_id))
      )

    {:noreply, segments}
  end

  @impl GenServer
  def handle_info({:flush, seg_id}, segments) do
    case Map.pop(segments, seg_id) do
      {nil, segments} ->
        {:noreply, segments}

      {%Segment{} = seg, rest} ->
        broadcast_updates(seg_id, seg)
        {:noreply, Map.put(rest, seg_id, %Segment{seq: seg.seq + 1})}
    end
  end

  # The buffer is keyed by grid index and every index belongs to this one
  # segment, so it cannot exceed the segment size however hard it is hammered.
  @spec put_patch(Segment.t(), non_neg_integer(), 0 | 1) :: Segment.t()
  defp put_patch(%Segment{buf: buf} = seg, idx, val), do: %{seg | buf: Map.put(buf, idx, val)}

  @spec ensure_timer(Segment.t(), non_neg_integer()) :: Segment.t()
  defp ensure_timer(%Segment{timer_ref: nil} = seg, seg_id) do
    %{seg | timer_ref: Process.send_after(self(), {:flush, seg_id}, @broadcast_flush_ms)}
  end

  defp ensure_timer(seg, _seg_id), do: seg

  @spec broadcast_updates(non_neg_integer(), Segment.t()) :: :ok
  defp broadcast_updates(_seg_id, %Segment{buf: buf}) when map_size(buf) == 0, do: :ok

  defp broadcast_updates(seg_id, %Segment{buf: buf, seq: seq}) do
    message = %Broadcast{
      topic: @client_topic,
      event: "patch_batch",
      payload: {:binary, encode_patch_batch(seg_id, seq, buf)}
    }

    Phoenix.PubSub.broadcast(
      CheckMill.PubSub,
      "grid:seg:#{seg_id}",
      message,
      Phoenix.Channel.Server
    )
  end
end
