import Config

# Tests drive maintenance explicitly via `GridStore.maintain/0`; a timer firing
# underneath them would make the snapshot-staleness assertions racy. The path is
# per-run so a previous run's board is never loaded.
config :check_mill,
  grid_dump_path:
    Path.join(System.tmp_dir!(), "check_mill_test_#{System.unique_integer([:positive])}.dump"),
  grid_maintenance_interval_ms: :timer.hours(1)

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :check_mill, CheckMillWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "AduWYJzcWBLWGRT3APBPhvMAeluXyoamtqnUK/z/TNKd+YIhKfP4n2KOkIgTb+h6",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
