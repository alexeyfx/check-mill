defmodule CheckMillWeb do
  @moduledoc """
  Shared setup for the web layer.

  `use CheckMillWeb, :router` and friends inject the imports each kind of module
  needs, keeping that boilerplate in one place rather than repeated per file.
  """

  @doc "Paths served as static assets."
  @spec static_paths() :: [String.t()]
  def static_paths, do: ~w(assets fonts images favicon.ico robots.txt)

  @doc false
  @spec router() :: Macro.t()
  def router do
    quote do
      use Phoenix.Router, helpers: false

      import Plug.Conn
      import Phoenix.Controller
    end
  end

  @doc false
  @spec channel() :: Macro.t()
  def channel do
    quote do
      use Phoenix.Channel
    end
  end

  @doc false
  @spec verified_routes() :: Macro.t()
  def verified_routes do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: CheckMillWeb.Endpoint,
        router: CheckMillWeb.Router,
        statics: CheckMillWeb.static_paths()
    end
  end

  @doc """
  Injects the setup for `which`, one of `:router`, `:channel` or
  `:verified_routes`.
  """
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
