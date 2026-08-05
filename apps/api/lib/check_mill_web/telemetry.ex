defmodule CheckMillWeb.Telemetry do
  @moduledoc """
  Telemetry supervisor and metric definitions.

  Supervises the VM poller and declares the metrics the LiveDashboard renders.
  Nothing here exports to an external system yet; `metrics/0` is the list a
  reporter would be attached to.
  """

  use Supervisor

  import Telemetry.Metrics

  @poll_period_ms 10_000

  @doc "Starts the telemetry supervision tree."
  @spec start_link(term()) :: Supervisor.on_start()
  def start_link(arg), do: Supervisor.start_link(__MODULE__, arg, name: __MODULE__)

  @impl Supervisor
  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: @poll_period_ms}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  @doc "Metrics exposed to the dashboard and to any attached reporter."
  @spec metrics() :: [Telemetry.Metrics.t()]
  def metrics do
    [
      summary("phoenix.endpoint.start.system_time", unit: {:native, :millisecond}),
      summary("phoenix.endpoint.stop.duration", unit: {:native, :millisecond}),
      summary("phoenix.router_dispatch.start.system_time",
        tags: [:route],
        unit: {:native, :millisecond}
      ),
      summary("phoenix.router_dispatch.exception.duration",
        tags: [:route],
        unit: {:native, :millisecond}
      ),
      summary("phoenix.router_dispatch.stop.duration",
        tags: [:route],
        unit: {:native, :millisecond}
      ),
      summary("phoenix.socket_connected.duration", unit: {:native, :millisecond}),
      sum("phoenix.socket_drain.count"),
      summary("phoenix.channel_joined.duration", unit: {:native, :millisecond}),
      summary("phoenix.channel_handled_in.duration",
        tags: [:event],
        unit: {:native, :millisecond}
      ),
      summary("vm.memory.total", unit: {:byte, :kilobyte}),
      summary("vm.total_run_queue_lengths.total"),
      summary("vm.total_run_queue_lengths.cpu"),
      summary("vm.total_run_queue_lengths.io")
    ]
  end

  @spec periodic_measurements() :: [{module(), atom(), list()}]
  defp periodic_measurements, do: []
end
