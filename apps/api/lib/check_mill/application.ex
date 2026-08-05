defmodule CheckMill.Application do
  @moduledoc """
  OTP application entry point.

  Children start in dependency order: PubSub and the rate limiter before
  `CheckMill.GridStore`, which loads the board from disk, then the broadcaster,
  then the endpoint that lets clients reach them.
  """

  use Application

  @impl Application
  def start(_type, _args) do
    children = [
      {DNSCluster, query: Application.get_env(:check_mill, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: CheckMill.PubSub},
      {CheckMill.RateLimit, [clean_period: :timer.minutes(1)]},
      CheckMill.GridStore,
      CheckMill.SegmentBroadcaster,
      CheckMillWeb.Endpoint
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: CheckMill.Supervisor)
  end

  @impl Application
  def config_change(changed, _new, removed) do
    CheckMillWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
