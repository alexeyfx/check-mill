defmodule CheckMill.RoomChannel do
  use Phoenix.Channel

  @impl true
  def join(_topic, _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("update", {:binary, chunk}, socket) do
    {:reply, {:ok, byte_size(chunk)}, socket}
  end
end
