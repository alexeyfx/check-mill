defmodule CheckMillWeb.UserSocket do
  @moduledoc """
  Socket for the grid channel.

  Connections are anonymous — there are no accounts, and `id/1` returns `nil`
  so there is no per-user channel to disconnect. The only thing established at
  connect time is the client IP, which `CheckMillWeb.GridChannel` uses as its
  join rate-limit key.
  """

  use Phoenix.Socket

  channel("grid:*", CheckMillWeb.GridChannel)

  @impl Phoenix.Socket
  def connect(_params, socket, connect_info) do
    {:ok, assign(socket, :remote_ip, client_ip(connect_info))}
  end

  @impl Phoenix.Socket
  def id(_socket), do: nil

  # Prefers the proxy's forwarded address, which is spoofable by a direct
  # client. It is only a rate-limit key, never an identity.
  @spec client_ip(map() | nil) :: String.t()
  defp client_ip(connect_info) do
    forwarded_ip(connect_info[:x_headers]) || peer_ip(connect_info[:peer_data]) || "unknown"
  end

  @spec forwarded_ip(list() | nil) :: String.t() | nil
  defp forwarded_ip(headers) when is_list(headers) do
    case List.keyfind(headers, "x-forwarded-for", 0) do
      {_name, value} -> value |> String.split(",") |> List.first() |> String.trim()
      nil -> nil
    end
  end

  defp forwarded_ip(_headers), do: nil

  @spec peer_ip(map() | nil) :: String.t() | nil
  defp peer_ip(%{address: address}), do: address |> :inet.ntoa() |> to_string()
  defp peer_ip(_peer_data), do: nil
end
