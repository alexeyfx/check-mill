defmodule CheckMill.GridStore do
  @moduledoc """
  Owns the board: a `CheckMill.GridConfig.grid_bits/0`-bit bitmap in ETS.

  The bitmap is split into chunks of `CheckMill.GridConfig.chunk_bits/0`, one ETS
  row each, so a toggle rewrites a few kilobytes rather than the whole board.
  Bit order is msb0 — bit 0 of the grid is the most significant bit of byte 0 —
  matching how Erlang lays out a bitstring, and the wire format follows suit.

  Writes are serialised through this process; reads (`window_snapshot/1`) go
  straight to the `:public` table and never queue behind a write.

  A periodic maintenance tick refreshes the cached global snapshot and writes the
  on-disk dump. It deliberately leaves the global snapshot up to one tick stale:
  the alternative is gzipping the whole board on every join. Clients are not
  harmed by this because `CheckMillWeb.GridChannel` pushes an authoritative
  window snapshot for whatever region they are actually looking at.
  """

  use GenServer

  import Bitwise
  require Logger

  alias CheckMill.GridConfig, as: Config
  alias CheckMill.GridDump

  @table :checkmill_grid

  @grid_bits Config.grid_bits()
  @grid_mask Config.grid_mask()

  @seg_bits Config.seg_bits()
  @seg_bytes Config.seg_bytes()

  @chunk_bits Config.chunk_bits()
  @chunk_bytes Config.chunk_bytes()
  @chunk_shift Config.chunk_shift()
  @chunk_mask @chunk_bits - 1

  @num_chunks Config.num_chunks()

  @global_chunk_bytes Config.global_chunk_bytes()

  @zero_chunk :binary.copy(<<0>>, @chunk_bytes)

  @default_dump_path "data/grid.dump"
  @default_maintenance_interval_ms 5_000

  @typep state :: %{
           snapshot_cache: {pos_integer(), [binary()]} | nil,
           version: non_neg_integer(),
           maintained_version: non_neg_integer()
         }

  @doc "Starts the store and loads any dump found on disk."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok, name: __MODULE__)

  @doc """
  Flips the bit at `idx` and returns its new value.

  Out-of-range indices are masked into the grid rather than rejected.
  """
  @spec toggle(integer()) :: 0 | 1
  def toggle(idx) when is_integer(idx) do
    GenServer.call(__MODULE__, {:toggle, idx &&& @grid_mask})
  end

  @doc """
  Flips every index in `idxs` and returns one `[idx, new_value]` patch each.

  Patches are returned in the order given, so a repeated index reports both
  edges of the flip.
  """
  @spec toggle_many([integer()]) :: [[non_neg_integer()]]
  def toggle_many(idxs) when is_list(idxs) do
    GenServer.call(__MODULE__, {:toggle_many, idxs})
  end

  @doc """
  Returns the gzipped board split into pieces of at most `bytes_per_chunk`.

  Chunked here rather than in the channel because the result is identical for
  every joining client. The pieces tile a single gzip stream, so the client
  concatenates them in arrival order and inflates once.

  Served from a cache refreshed by the maintenance tick, so the result may be up
  to one tick behind the live board.
  """
  @spec global_snapshot_chunks(pos_integer()) :: [binary()]
  def global_snapshot_chunks(bytes_per_chunk) do
    GenServer.call(__MODULE__, {:global_snapshot_chunks, bytes_per_chunk})
  end

  @doc """
  Refreshes the cached global snapshot and writes the dump.

  Called on a timer; exposed so tests can drive it deterministically. Returns
  `:ok` without doing work when nothing has changed since the last run.
  """
  @spec maintain() :: :ok | {:error, File.posix()}
  def maintain do
    GenServer.call(__MODULE__, :maintain)
  end

  @doc """
  Returns one segment of live bits starting at `position`.

  Reads ETS directly rather than going through this process, so it does not
  queue behind writes. The window wraps around the end of the grid.
  """
  @spec window_snapshot(integer()) :: binary()
  def window_snapshot(position) when is_integer(position) do
    position = position &&& @grid_mask
    stop = position + (@seg_bits - 1) &&& @grid_mask

    bits =
      if position <= stop do
        slice_bits(position, @seg_bits)
      else
        left_bits = @grid_bits - position
        right_bits = @seg_bits - left_bits
        <<slice_bits(position, left_bits)::bitstring, slice_bits(0, right_bits)::bitstring>>
      end

    if bit_size(bits) != @seg_bits do
      raise "window_snapshot invalid bit size: expected #{@seg_bits}, got #{bit_size(bits)}"
    end

    if not is_binary(bits) or byte_size(bits) != @seg_bytes do
      raise "window_snapshot invalid byte size: expected #{@seg_bytes}, got #{byte_size(bits)}"
    end

    bits
  end

  @impl GenServer
  @spec init(:ok) :: {:ok, state()}
  def init(:ok) do
    Process.flag(:trap_exit, true)

    :ets.new(@table, [
      :named_table,
      :public,
      :set,
      read_concurrency: true,
      write_concurrency: true
    ])

    load_dump()
    schedule_maintenance()

    {:ok, %{snapshot_cache: nil, version: 0, maintained_version: 0}}
  end

  @impl GenServer
  def handle_call({:toggle, idx}, _from, state) do
    {:reply, do_toggle(idx), bump(state)}
  end

  def handle_call({:toggle_many, idxs}, _from, state) do
    patches =
      for idx <- idxs do
        idx = idx &&& @grid_mask
        [idx, do_toggle(idx)]
      end

    {:reply, patches, bump(state)}
  end

  def handle_call({:global_snapshot_chunks, bytes_per_chunk}, _from, state) do
    case state.snapshot_cache do
      {^bytes_per_chunk, chunks} ->
        {:reply, chunks, state}

      _ ->
        chunks = encode_chunks(full_bitmap(), bytes_per_chunk)
        {:reply, chunks, %{state | snapshot_cache: {bytes_per_chunk, chunks}}}
    end
  end

  def handle_call(:maintain, _from, state) do
    {result, state} = run_maintenance(state)
    {:reply, result, state}
  end

  @impl GenServer
  def handle_info(:maintain, state) do
    {_result, state} = run_maintenance(state)
    schedule_maintenance()
    {:noreply, state}
  end

  @impl GenServer
  def terminate(_reason, state) do
    run_maintenance(state)
    :ok
  end

  @spec bump(state()) :: state()
  defp bump(state), do: %{state | version: state.version + 1}

  @spec run_maintenance(state()) :: {:ok | {:error, File.posix()}, state()}
  defp run_maintenance(%{version: version, maintained_version: version} = state) do
    {:ok, state}
  end

  defp run_maintenance(state) do
    bitmap = full_bitmap()
    chunks = encode_chunks(bitmap, @global_chunk_bytes)
    state = %{state | snapshot_cache: {@global_chunk_bytes, chunks}}

    case GridDump.write(dump_path(), bitmap, @grid_bits) do
      :ok ->
        {:ok, %{state | maintained_version: state.version}}

      {:error, reason} = error ->
        Logger.error("[GridStore] could not write dump to #{dump_path()}: #{inspect(reason)}")
        {error, state}
    end
  end

  @spec load_dump() :: :ok
  defp load_dump do
    path = dump_path()

    case GridDump.read(path, @grid_bits) do
      {:ok, bitmap} ->
        populate(bitmap)
        Logger.info("[GridStore] loaded grid from #{path}")

      {:error, :enoent} ->
        Logger.info("[GridStore] no dump at #{path}, starting from an empty grid")

      {:error, reason} ->
        Logger.error("[GridStore] ignoring unusable dump at #{path}: #{inspect(reason)}")
    end

    :ok
  end

  @spec populate(binary()) :: :ok
  defp populate(bitmap) do
    for chunk_id <- 0..(@num_chunks - 1) do
      chunk = binary_part(bitmap, chunk_id * @chunk_bytes, @chunk_bytes)
      if chunk != @zero_chunk, do: :ets.insert(@table, {chunk_id, chunk})
    end

    :ok
  end

  @spec schedule_maintenance() :: reference()
  defp schedule_maintenance do
    Process.send_after(self(), :maintain, maintenance_interval_ms())
  end

  @spec dump_path() :: Path.t()
  defp dump_path, do: Application.get_env(:check_mill, :grid_dump_path, @default_dump_path)

  @spec maintenance_interval_ms() :: pos_integer()
  defp maintenance_interval_ms do
    Application.get_env(
      :check_mill,
      :grid_maintenance_interval_ms,
      @default_maintenance_interval_ms
    )
  end

  @spec do_toggle(non_neg_integer()) :: 0 | 1
  defp do_toggle(idx) do
    {chunk_id, bit_in_chunk} = chunk_pos(idx)

    new_bin = get_chunk(chunk_id) |> flip_bit(bit_in_chunk)
    :ets.insert(@table, {chunk_id, new_bin})

    bit_value(new_bin, bit_in_chunk)
  end

  @spec encode_chunks(binary(), pos_integer()) :: [binary()]
  defp encode_chunks(bitmap, bytes_per_chunk) do
    bitmap
    |> :zlib.gzip()
    |> chunk_binary(bytes_per_chunk)
  end

  @spec full_bitmap() :: binary()
  defp full_bitmap do
    0..(@num_chunks - 1)
    |> Stream.map(&get_chunk/1)
    |> Enum.into(<<>>)
  end

  @spec chunk_pos(non_neg_integer()) :: {non_neg_integer(), non_neg_integer()}
  defp chunk_pos(idx), do: {idx >>> @chunk_shift, idx &&& @chunk_mask}

  @spec get_chunk(non_neg_integer()) :: binary()
  defp get_chunk(chunk_id) when is_integer(chunk_id) and chunk_id >= 0 do
    case :ets.lookup(@table, chunk_id) do
      [{^chunk_id, bin}] -> bin
      [] -> @zero_chunk
    end
  end

  @spec slice_bits(non_neg_integer(), non_neg_integer()) :: bitstring()
  defp slice_bits(start_idx, bit_len) when bit_len >= 0 do
    chunk_id = start_idx >>> @chunk_shift
    bit_off = start_idx &&& @chunk_mask

    if bit_off + bit_len <= @chunk_bits do
      extract_bits(get_chunk(chunk_id), bit_off, bit_len)
    else
      left = @chunk_bits - bit_off

      <<extract_bits(get_chunk(chunk_id), bit_off, left)::bitstring,
        extract_bits(get_chunk(chunk_id + 1), 0, bit_len - left)::bitstring>>
    end
  end

  @spec extract_bits(bitstring(), non_neg_integer(), non_neg_integer()) :: bitstring()
  defp extract_bits(bin, bit_off, bit_len) do
    <<_::size(^bit_off), bits::bitstring-size(^bit_len), _::bitstring>> = bin
    bits
  end

  @spec flip_bit(bitstring(), non_neg_integer()) :: bitstring()
  defp flip_bit(bin, bit_index) do
    <<prefix::bitstring-size(^bit_index), b::1, rest::bitstring>> = bin
    <<prefix::bitstring, bxor(b, 1)::1, rest::bitstring>>
  end

  @spec bit_value(bitstring(), non_neg_integer()) :: 0 | 1
  defp bit_value(bin, bit_index) do
    <<_::bitstring-size(^bit_index), b::1, _::bitstring>> = bin
    b
  end

  @spec chunk_binary(binary(), pos_integer()) :: [binary()]
  defp chunk_binary(bin, bytes_per_chunk) do
    total = byte_size(bin)

    Stream.unfold(0, fn
      offset when offset >= total ->
        nil

      offset ->
        len = min(bytes_per_chunk, total - offset)
        {binary_part(bin, offset, len), offset + len}
    end)
    |> Enum.to_list()
  end
end
