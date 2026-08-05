defmodule CheckMill do
  @moduledoc """
  A shared grid of 1,048,576 checkboxes, live across every connected browser.

  The board itself lives in `CheckMill.GridStore`. `CheckMillWeb.GridChannel`
  is the only route in or out of it, `CheckMill.SegmentBroadcaster` fans changes
  back out, and `CheckMill.Wire` defines the binary protocol both sides speak.
  """
end
