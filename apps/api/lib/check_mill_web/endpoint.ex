defmodule CheckMillWeb.Endpoint do
  @moduledoc """
  HTTP and WebSocket entry point.

  The grid socket is the only meaningful route; the plug pipeline below exists
  for the dev dashboard and error rendering.

  `compress: false` is deliberate. Bandit allocates a pair of zlib contexts per
  connection at handshake time, which costs far more memory per connection than
  the frames save — and the binary protocol in `CheckMill.Wire` already produces
  payloads compression cannot meaningfully improve on.
  """

  use Phoenix.Endpoint, otp_app: :check_mill

  socket("/view", CheckMillWeb.UserSocket,
    websocket: [connect_info: [:peer_data, :x_headers], compress: false],
    longpoll: false
  )

  plug(Plug.RequestId)

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(CheckMillWeb.Router)
end
