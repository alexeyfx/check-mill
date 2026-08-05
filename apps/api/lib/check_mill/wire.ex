defmodule CheckMill.Wire do
  @moduledoc """
  Binary codec for the `grid:main` channel, both directions.

  Every channel payload is raw bytes; nothing on this socket is JSON except the
  Phoenix envelope and the join handshake. The TypeScript client implements the
  same layouts in `src/core/utils/protocol.ts`.

  ## Client to server

      cursor        pos::24
      toggle        idx::24
      toggle_many   idx::24, ...

  ## Server to client

      global_snapshot_begin  chunks::16
      global_snapshot_chunk  gzip bytes
      global_snapshot_done   (empty)
      window_snapshot        pos::24, bits::binary
      patch_batch            see `CheckMill.SegmentBroadcaster.encode_patch_batch/3`

  ## Replies

      toggle ok        idx::24, val::8
      toggle_many ok   count::16, (idx::24, val::8), ...
      error            reason::8

  Indices are 24-bit: the grid is 2^20 bits, so 20 would suffice and three bytes
  keep every field byte-aligned. Error reasons are numeric codes so the client
  can switch on them without string comparison.
  """

  @index_bits 24

  @reason_codes %{
    slow_down: 1,
    batch_limit: 2,
    bad_request: 3,
    rate_limit: 4
  }

  @type reason :: :slow_down | :batch_limit | :bad_request | :rate_limit
  @type payload :: {:binary, binary()}
  @type patch :: [non_neg_integer()]

  @doc """
  Returns the numeric code for an error reason.

  Raises if the reason is not part of the protocol.
  """
  @spec reason_code(reason()) :: pos_integer()
  def reason_code(reason) when is_map_key(@reason_codes, reason), do: @reason_codes[reason]

  @doc "Returns the complete reason-to-code table."
  @spec reason_codes() :: %{reason() => pos_integer()}
  def reason_codes, do: @reason_codes

  @doc "Encodes an error reply payload."
  @spec error(reason()) :: payload()
  def error(reason), do: {:binary, <<reason_code(reason)::8>>}

  @doc "Encodes the reply to a single `toggle`."
  @spec toggle_reply(non_neg_integer(), 0 | 1) :: payload()
  def toggle_reply(idx, val), do: {:binary, <<idx::size(@index_bits), val::8>>}

  @doc "Encodes the reply to a `toggle_many`, one fixed-width entry per patch."
  @spec toggle_many_reply([patch()]) :: payload()
  def toggle_many_reply(patches) do
    body =
      Enum.reduce(patches, <<>>, fn [idx, val], acc ->
        <<acc::binary, idx::size(@index_bits), val::8>>
      end)

    {:binary, <<length(patches)::16, body::binary>>}
  end

  @doc "Encodes the number of chunks the global snapshot will arrive in."
  @spec snapshot_begin(non_neg_integer()) :: payload()
  def snapshot_begin(chunks), do: {:binary, <<chunks::16>>}

  @doc """
  Encodes one piece of the gzipped global snapshot.

  Chunks are raw slices of a single gzip stream, so a chunk carries no meaning on
  its own — the client concatenates them in arrival order and inflates once.
  """
  @spec snapshot_chunk(binary()) :: payload()
  def snapshot_chunk(bytes), do: {:binary, bytes}

  @doc "Encodes the end-of-snapshot marker."
  @spec snapshot_done() :: payload()
  def snapshot_done, do: {:binary, <<>>}

  @doc "Encodes a window snapshot: the grid position followed by its bits."
  @spec window_snapshot(non_neg_integer(), binary()) :: payload()
  def window_snapshot(pos, bits), do: {:binary, <<pos::size(@index_bits), bits::binary>>}

  @doc """
  Decodes an inbound payload for `event`.

  Returns `:error` for anything malformed rather than raising. This is
  attacker-reachable input and an exception here would terminate the channel.
  """
  @spec decode(String.t(), payload() | map()) ::
          {:ok, non_neg_integer() | [non_neg_integer()]} | :error
  def decode("cursor", {:binary, <<pos::size(@index_bits)>>}), do: {:ok, pos}

  def decode("toggle", {:binary, <<idx::size(@index_bits)>>}), do: {:ok, idx}

  def decode("toggle_many", {:binary, body}) when rem(byte_size(body), 3) == 0 do
    {:ok, for(<<idx::size(@index_bits) <- body>>, do: idx)}
  end

  def decode(_event, _payload), do: :error
end
