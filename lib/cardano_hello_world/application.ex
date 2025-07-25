defmodule CardanoHelloWorld.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      CardanoHelloWorldWeb.Telemetry,
      {DNSCluster,
       query: Application.get_env(:cardano_hello_world, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: CardanoHelloWorld.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: CardanoHelloWorld.Finch},
      # Start a worker by calling: CardanoHelloWorld.Worker.start_link(arg)
      # {CardanoHelloWorld.Worker, arg},
      # Start to serve requests, typically the last entry
      CardanoHelloWorldWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: CardanoHelloWorld.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    CardanoHelloWorldWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
