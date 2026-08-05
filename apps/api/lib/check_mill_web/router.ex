defmodule CheckMillWeb.Router do
  @moduledoc """
  HTTP routes.

  There is no public HTTP API — clients reach the board over the WebSocket
  declared in `CheckMillWeb.Endpoint`. The `:api` pipeline is kept for the
  operational endpoints that will hang off it (health, metrics), and the
  dashboard below is development-only.
  """

  use CheckMillWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
  end

  if Application.compile_env(:check_mill, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through([:fetch_session, :protect_from_forgery])

      live_dashboard("/dashboard", metrics: CheckMillWeb.Telemetry)
    end
  end
end
