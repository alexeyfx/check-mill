defmodule CheckMillWeb.ErrorJSON do
  @moduledoc """
  Renders error responses as JSON.

  Falls back to the status message for the template name, so `404.json` becomes
  `%{errors: %{detail: "Not Found"}}`.
  """

  @doc "Renders `template` as an error body."
  @spec render(String.t(), map()) :: %{errors: %{detail: String.t()}}
  def render(template, _assigns) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(template)}}
  end
end
