defmodule CheckMillWeb.UserSocket do
  use Phoenix.Socket

  channel("grid:*", CheckMillWeb.GridChannel)

  @impl true
  def connect(_params, socket, connect_info) do
    {:ok, assign(socket, :remote_ip, client_ip(connect_info))}
  end

  @impl true
  def id(_socket), do: nil

  defp client_ip(connect_info) do
    forwarded_ip(connect_info[:x_headers]) || peer_ip(connect_info[:peer_data]) || "unknown"
  end

  defp forwarded_ip(headers) when is_list(headers) do
    case List.keyfind(headers, "x-forwarded-for", 0) do
      {_, value} ->
        value |> String.split(",") |> List.first() |> String.trim()

      _ ->
        nil
    end
  end

  defp forwarded_ip(_), do: nil

  defp peer_ip(%{address: address}), do: address |> :inet.ntoa() |> to_string()
  defp peer_ip(_), do: nil
end
