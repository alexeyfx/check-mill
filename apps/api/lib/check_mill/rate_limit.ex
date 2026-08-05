defmodule CheckMill.RateLimit do
  @moduledoc """
  Fixed-window rate limiter backed by ETS.

  Used for two independent budgets: joins per client IP, and board actions per
  connection. Limits and windows come from `CheckMill.GridConfig`.
  """

  use Hammer, backend: :ets
end
