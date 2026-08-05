import Config

config :check_mill,
  generators: [timestamp_type: :utc_datetime]

config :check_mill,
  grid_dump_path: "data/grid.dump",
  grid_maintenance_interval_ms: 5_000

config :check_mill, CheckMillWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: CheckMillWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: CheckMill.PubSub,
  live_view: [signing_salt: "D+2oRfBi"]

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
