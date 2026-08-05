defmodule CheckMill.GridConfig do
  @moduledoc """
  Compile-time dimensions and tuning constants for the grid.

  Every size here is a power of two so that index arithmetic reduces to masks and
  shifts: `idx &&& grid_mask()` wraps into range, `idx >>> seg_shift()` gives a
  segment id. The shifts are derived from the bit counts rather than written
  down twice.

  Three nested units, largest to smallest:

    * **grid** — the whole board, `grid_bits/0` bits.
    * **chunk** — the storage unit. `CheckMill.GridStore` keeps one ETS row per
      chunk, so a toggle rewrites `chunk_bytes/0` rather than the whole board.
    * **segment** — the subscription and broadcast unit. Clients subscribe by
      segment and `CheckMill.SegmentBroadcaster` coalesces patches per segment.

  Chunks are larger than segments and both divide the grid evenly.
  """

  @grid_bits 1_048_576
  @grid_mask @grid_bits - 1

  @seg_bits 2_048
  @seg_bytes div(@seg_bits, 8)
  @seg_shift trunc(:math.log2(@seg_bits))

  @chunk_bits 8_192
  @chunk_bytes div(@chunk_bits, 8)
  @chunk_shift trunc(:math.log2(@chunk_bits))

  @broadcast_flush_ms 64

  @join_limit_count 1_000
  @join_limit_ms 60_000
  @toggle_limit_count 30
  @toggle_limit_ms 2_000

  @global_chunk_bytes 16_384

  @doc "Total bits on the board."
  @spec grid_bits() :: pos_integer()
  def grid_bits, do: @grid_bits

  @doc "Mask that wraps any integer into a valid grid index."
  @spec grid_mask() :: pos_integer()
  def grid_mask, do: @grid_mask

  @doc "Bits per segment, the subscription and broadcast unit."
  @spec seg_bits() :: pos_integer()
  def seg_bits, do: @seg_bits

  @doc "Bytes per segment."
  @spec seg_bytes() :: pos_integer()
  def seg_bytes, do: @seg_bytes

  @doc "Right-shift that turns a grid index into a segment id."
  @spec seg_shift() :: pos_integer()
  def seg_shift, do: @seg_shift

  @doc "Bits per storage chunk."
  @spec chunk_bits() :: pos_integer()
  def chunk_bits, do: @chunk_bits

  @doc "Bytes per storage chunk, and therefore per ETS row."
  @spec chunk_bytes() :: pos_integer()
  def chunk_bytes, do: @chunk_bytes

  @doc "Right-shift that turns a grid index into a chunk id."
  @spec chunk_shift() :: pos_integer()
  def chunk_shift, do: @chunk_shift

  @doc "Number of segments on the board."
  @spec num_segments() :: pos_integer()
  def num_segments, do: div(@grid_bits, @seg_bits)

  @doc "Number of storage chunks on the board."
  @spec num_chunks() :: pos_integer()
  def num_chunks, do: div(@grid_bits, @chunk_bits)

  @doc "How long patches are coalesced before a segment is broadcast."
  @spec broadcast_flush_ms() :: pos_integer()
  def broadcast_flush_ms, do: @broadcast_flush_ms

  @doc "Joins allowed per `join_limit_ms/0`, per client IP."
  @spec join_limit_count() :: pos_integer()
  def join_limit_count, do: @join_limit_count

  @doc "Window over which `join_limit_count/0` applies."
  @spec join_limit_ms() :: pos_integer()
  def join_limit_ms, do: @join_limit_ms

  @doc "Toggles allowed per `toggle_limit_ms/0`, per connection."
  @spec toggle_limit_count() :: pos_integer()
  def toggle_limit_count, do: @toggle_limit_count

  @doc "Window over which `toggle_limit_count/0` applies."
  @spec toggle_limit_ms() :: pos_integer()
  def toggle_limit_ms, do: @toggle_limit_ms

  @doc "Size of each piece the gzipped global snapshot is split into."
  @spec global_chunk_bytes() :: pos_integer()
  def global_chunk_bytes, do: @global_chunk_bytes
end
