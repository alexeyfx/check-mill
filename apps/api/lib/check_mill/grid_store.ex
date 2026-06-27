defmodule CheckMill.GridStore do
  use GenServer
  import Bitwise

  alias CheckMill.GridConfig, as: Config

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

  @zero_chunk :binary.copy(<<0>>, @chunk_bytes)

  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok, name: __MODULE__)

  def toggle(idx) when is_integer(idx) do
    GenServer.call(__MODULE__, {:toggle, idx &&& @grid_mask})
  end

  def toggle_many(idxs) when is_list(idxs) do
    GenServer.call(__MODULE__, {:toggle_many, idxs})
  end

  def global_snapshot_chunks(bytes_per_chunk) do
    GenServer.call(__MODULE__, {:global_snapshot_chunks, bytes_per_chunk})
  end

  def window_snapshot(pos) when is_integer(pos) do
    pos = pos &&& @grid_mask
    stop = pos + (@seg_bits - 1) &&& @grid_mask

    bits =
      if pos <= stop do
        slice_bits(pos, @seg_bits)
      else
        left_bits = @grid_bits - pos
        right_bits = @seg_bits - left_bits
        <<slice_bits(pos, left_bits)::bitstring, slice_bits(0, right_bits)::bitstring>>
      end

    if bit_size(bits) != @seg_bits do
      raise "window_snapshot invalid bit size: expected #{@seg_bits}, got #{bit_size(bits)}"
    end

    if not is_binary(bits) or byte_size(bits) != @seg_bytes do
      raise "window_snapshot invalid byte size: expected #{@seg_bytes}, got #{byte_size(bits)}"
    end

    bits
  end

  @impl true
  def init(:ok) do
    :ets.new(@table, [
      :named_table,
      :public,
      :set,
      read_concurrency: true,
      write_concurrency: true
    ])

    {:ok, %{snapshot_cache: nil, dirty: true}}
  end

  @impl true
  def handle_call({:toggle, idx}, _from, state) do
    val = do_toggle(idx)
    {:reply, val, %{state | dirty: true}}
  end

  @impl true
  def handle_call({:toggle_many, idxs}, _from, state) do
    patches =
      for idx <- idxs do
        idx = idx &&& @grid_mask
        [idx, do_toggle(idx)]
      end

    {:reply, patches, %{state | dirty: true}}
  end

  @impl true
  def handle_call({:global_snapshot_chunks, bytes_per_chunk}, _from, state) do
    case state do
      %{dirty: false, snapshot_cache: {^bytes_per_chunk, chunks}} ->
        {:reply, chunks, state}

      _ ->
        chunks = compute_global_snapshot_chunks(bytes_per_chunk)
        {:reply, chunks, %{state | dirty: false, snapshot_cache: {bytes_per_chunk, chunks}}}
    end
  end

  defp do_toggle(idx) do
    {chunk_id, bit_in_chunk} = chunk_pos(idx)

    bin = get_chunk(chunk_id)
    new_bin = flip_bit(bin, bit_in_chunk)

    :ets.insert(@table, {chunk_id, new_bin})
    bit_value(new_bin, bit_in_chunk)
  end

  defp compute_global_snapshot_chunks(bytes_per_chunk) do
    0..(@num_chunks - 1)
    |> Stream.map(&get_chunk/1)
    |> Enum.into(<<>>)
    |> :zlib.gzip()
    |> chunk_binary(bytes_per_chunk)
  end

  defp chunk_pos(idx) do
    chunk_id = idx >>> @chunk_shift
    bit_in_chunk = idx &&& @chunk_mask
    {chunk_id, bit_in_chunk}
  end

  defp get_chunk(chunk_id) when is_integer(chunk_id) and chunk_id >= 0 do
    case :ets.lookup(@table, chunk_id) do
      [{^chunk_id, bin}] -> bin
      [] -> @zero_chunk
    end
  end

  defp slice_bits(start_idx, bit_len) when bit_len >= 0 do
    chunk_id = start_idx >>> @chunk_shift
    bit_off = start_idx &&& @chunk_mask
    needed = bit_off + bit_len

    if needed <= @chunk_bits do
      extract_bits(get_chunk(chunk_id), bit_off, bit_len)
    else
      left = @chunk_bits - bit_off
      right = bit_len - left

      <<extract_bits(get_chunk(chunk_id), bit_off, left)::bitstring,
        extract_bits(get_chunk(chunk_id + 1), 0, right)::bitstring>>
    end
  end

  defp extract_bits(bin, bit_off, bit_len) do
    <<_::size(^bit_off), bits::bitstring-size(^bit_len), _::bitstring>> = bin
    bits
  end

  defp flip_bit(bin, bit_index) do
    <<prefix::bitstring-size(^bit_index), b::1, rest::bitstring>> = bin
    new_bit = bxor(b, 1)
    <<prefix::bitstring, new_bit::1, rest::bitstring>>
  end

  defp bit_value(bin, bit_index) do
    <<_::bitstring-size(^bit_index), b::1, _::bitstring>> = bin
    b
  end

  defp chunk_binary(bin, bytes_per_chunk) do
    total = byte_size(bin)
    do_chunk(bin, bytes_per_chunk, total, 0, []) |> Enum.reverse()
  end

  defp do_chunk(_bin, _step, total, offset, acc) when offset >= total, do: acc

  defp do_chunk(bin, step, total, offset, acc) do
    len = min(step, total - offset)
    part = binary_part(bin, offset, len)
    do_chunk(bin, step, total, offset + len, [part | acc])
  end
end
