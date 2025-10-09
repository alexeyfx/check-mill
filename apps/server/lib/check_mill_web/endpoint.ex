defmodule CheckMillWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :check_mill

  socket("/view", CheckMillWeb.UserSocket,
    websocket: true,
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
