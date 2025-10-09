defmodule CheckMill.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {DNSCluster, query: Application.get_env(:check_mill, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: CheckMill.PubSub},
      # Start a worker by calling: CheckMill.Worker.start_link(arg)
      # {CheckMill.Worker, arg},
      # Start to serve requests, typically the last entry
      CheckMillWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: CheckMill.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    CheckMillWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
