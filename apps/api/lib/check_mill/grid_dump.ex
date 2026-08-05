defmodule CheckMill.GridDump do
  @moduledoc """
  On-disk format for the grid, used to survive a restart.

  A dump is a fixed header followed by the raw bitmap:

      "CMG1" | grid_bits::unsigned-big-64 | body::binary

  The header makes a truncated, foreign or wrongly-sized file detectable, so
  `CheckMill.GridStore` can boot from an empty board rather than crash on one.
  Writes go to a temporary path and are renamed into place, which is atomic on
  POSIX filesystems and leaves no partial dump behind if the node dies mid-write.
  """

  @magic "CMG1"

  @type decode_error ::
          :bad_magic
          | {:grid_mismatch, stored :: non_neg_integer(), expected :: pos_integer()}
          | {:bad_size, actual :: non_neg_integer(), expected :: pos_integer()}

  @doc "Wraps a raw bitmap in the dump header."
  @spec encode(binary(), pos_integer()) :: binary()
  def encode(body, grid_bits) when is_binary(body) and is_integer(grid_bits) do
    <<@magic, grid_bits::unsigned-big-64, body::binary>>
  end

  @doc """
  Validates a dump and returns its bitmap.

  Fails rather than returning a partial board when the magic is wrong, the grid
  size does not match this build, or the body is the wrong length.
  """
  @spec decode(binary(), pos_integer()) :: {:ok, binary()} | {:error, decode_error()}
  def decode(binary, grid_bits) when is_binary(binary) and is_integer(grid_bits) do
    with {:ok, body} <- strip_header(binary, grid_bits) do
      check_size(body, grid_bits)
    end
  end

  @doc "Reads and validates the dump at `path`."
  @spec read(Path.t(), pos_integer()) :: {:ok, binary()} | {:error, decode_error() | File.posix()}
  def read(path, grid_bits) do
    with {:ok, binary} <- File.read(path) do
      decode(binary, grid_bits)
    end
  end

  @doc """
  Writes `body` to `path` atomically.

  Creates the parent directory if needed, writes to `temp_path/1` and renames.
  The temporary file is removed if any step fails.
  """
  @spec write(Path.t(), binary(), pos_integer()) :: :ok | {:error, File.posix()}
  def write(path, body, grid_bits) do
    tmp = temp_path(path)

    with :ok <- File.mkdir_p(Path.dirname(path)),
         :ok <- File.write(tmp, encode(body, grid_bits)),
         :ok <- File.rename(tmp, path) do
      :ok
    else
      {:error, reason} ->
        File.rm(tmp)
        {:error, reason}
    end
  end

  @doc "The staging path `write/3` uses before renaming into place."
  @spec temp_path(Path.t()) :: Path.t()
  def temp_path(path), do: path <> ".tmp"

  @spec strip_header(binary(), pos_integer()) :: {:ok, binary()} | {:error, decode_error()}
  defp strip_header(<<@magic, stored::unsigned-big-64, body::binary>>, grid_bits) do
    if stored == grid_bits do
      {:ok, body}
    else
      {:error, {:grid_mismatch, stored, grid_bits}}
    end
  end

  defp strip_header(_binary, _grid_bits), do: {:error, :bad_magic}

  @spec check_size(binary(), pos_integer()) :: {:ok, binary()} | {:error, decode_error()}
  defp check_size(body, grid_bits) do
    expected = div(grid_bits, 8)

    case byte_size(body) do
      ^expected -> {:ok, body}
      actual -> {:error, {:bad_size, actual, expected}}
    end
  end
end
