defmodule CheckMillWeb.GridChannel do
  @moduledoc """
  The `grid:main` channel: the only route between a browser and the board.

  All payloads are binary, encoded and decoded by `CheckMill.Wire`.

  ## Join

  A client is primed before it is told anything else: the visible window is
  pushed first so the board can paint at roughly one round trip, then the
  gzipped global snapshot streams behind it, then the window is pushed again.
  The repeat is not redundant — the global snapshot may be up to one maintenance
  tick stale and the client overwrites its whole board with it, so the
  authoritative window has to land last.

  ## Cursor

  A client reports where it is looking; the channel subscribes it to that
  segment and one either side, and pushes a window snapshot for the position.
  Cursor updates are coalesced over a short window, so a fast scroll costs one
  subscription change rather than one per frame.

  ## Patches

  Patch batches are *not* pushed from here. `CheckMill.SegmentBroadcaster`
  publishes them with fastlane metadata, so Phoenix encodes each batch once and
  writes it straight to every subscriber's transport without waking this
  process.
  """

  use Phoenix.Channel

  import Bitwise
  require Logger

  alias CheckMill.{GridConfig, GridStore, RateLimit, SegmentBroadcaster, Wire}

  @cursor_flush_ms 64
  @segment_index_mask GridConfig.num_segments() - 1
  @cursor_margin_segments 1

  @impl Phoenix.Channel
  def join("grid:main", _payload, socket) do
    case check_join_rate_limit(socket) do
      :ok ->
        send(self(), :prime)

        {:ok,
         assign(socket, %{
           cursor: nil,
           segments: MapSet.new(),
           cursor_ref: nil,
           pending_cursor: nil,
           action_limit_key: "act:#{inspect(socket.transport_pid)}"
         })}

      {:error, :rate_limited} ->
        {:error, %{reason: "rate_limit", message: "Too many connections."}}
    end
  end

  @impl Phoenix.Channel
  def handle_in("cursor" = event, payload, socket) do
    case Wire.decode(event, payload) do
      {:ok, pos} -> {:noreply, schedule_cursor(socket, pos &&& GridConfig.grid_mask())}
      :error -> {:reply, {:error, Wire.error(:bad_request)}, socket}
    end
  end

  def handle_in("toggle" = event, payload, socket) do
    with {:ok, idx} <- Wire.decode(event, payload),
         :ok <- check_action_limit(socket, 1) do
      idx = idx &&& GridConfig.grid_mask()
      val = GridStore.toggle(idx)
      SegmentBroadcaster.enqueue(idx >>> GridConfig.seg_shift(), idx, val)
      {:reply, {:ok, Wire.toggle_reply(idx, val)}, socket}
    else
      :error -> {:reply, {:error, Wire.error(:bad_request)}, socket}
      {:error, :rate_limited} -> {:reply, {:error, Wire.error(:slow_down)}, socket}
    end
  end

  def handle_in("toggle_many" = event, payload, socket) do
    with {:ok, idxs} <- Wire.decode(event, payload),
         :ok <- check_action_limit(socket, max(1, length(idxs))) do
      {:reply, {:ok, Wire.toggle_many_reply(process_batch_toggles(idxs))}, socket}
    else
      :error -> {:reply, {:error, Wire.error(:bad_request)}, socket}
      {:error, :rate_limited} -> {:reply, {:error, Wire.error(:batch_limit)}, socket}
    end
  end

  def handle_in(event, _payload, socket) do
    Logger.debug("[GridChannel] unhandled event #{inspect(event)}")
    {:reply, {:error, Wire.error(:bad_request)}, socket}
  end

  @impl Phoenix.Channel
  def handle_info(:prime, socket) do
    socket = apply_cursor(socket, 0)
    send(self(), :begin_snapshot)
    {:noreply, socket}
  end

  def handle_info(:begin_snapshot, socket) do
    chunks = GridStore.global_snapshot_chunks(GridConfig.global_chunk_bytes())
    push(socket, "global_snapshot_begin", Wire.snapshot_begin(length(chunks)))
    send(self(), {:push_chunk, chunks})
    {:noreply, socket}
  end

  def handle_info({:push_chunk, []}, socket) do
    push(socket, "global_snapshot_done", Wire.snapshot_done())
    push_window_snapshot(socket, socket.assigns.cursor)
    {:noreply, socket}
  end

  def handle_info({:push_chunk, [chunk | rest]}, socket) do
    push(socket, "global_snapshot_chunk", Wire.snapshot_chunk(chunk))
    Process.send_after(self(), {:push_chunk, rest}, 1)
    {:noreply, socket}
  end

  def handle_info(:flush_cursor, %{assigns: %{pending_cursor: pos}} = socket)
      when not is_nil(pos) do
    socket =
      socket
      |> assign(cursor_ref: nil, pending_cursor: nil)
      |> apply_cursor(pos)

    {:noreply, socket}
  end

  def handle_info(:flush_cursor, socket) do
    {:noreply, assign(socket, :cursor_ref, nil)}
  end

  # Logs rather than ignoring: patch batches reach subscribers by fastlane and
  # never arrive here, so anything that does indicates broken routing.
  def handle_info(message, socket) do
    Logger.warning("[GridChannel] unexpected message #{inspect(message)}")
    {:noreply, socket}
  end

  @spec process_batch_toggles([non_neg_integer()]) :: [[non_neg_integer()]]
  defp process_batch_toggles([]), do: []

  defp process_batch_toggles(idxs) do
    patches = GridStore.toggle_many(idxs)

    for [idx, val] <- patches do
      SegmentBroadcaster.enqueue(idx >>> GridConfig.seg_shift(), idx, val)
    end

    patches
  end

  @spec apply_cursor(Phoenix.Socket.t(), non_neg_integer()) :: Phoenix.Socket.t()
  defp apply_cursor(socket, pos) do
    wanted = wanted_segments(pos)

    socket
    |> update_subscriptions(socket.assigns.segments, wanted)
    |> assign(cursor: pos, segments: wanted)
    |> tap(&push_window_snapshot(&1, pos))
  end

  # One segment either side of the cursor. A viewport shows at most ~1,280
  # indices, so the margin absorbs both a scroll upward and the round trip a
  # cursor update takes. Masking wraps segment 0 onto the last one.
  @spec wanted_segments(non_neg_integer()) :: MapSet.t(non_neg_integer())
  defp wanted_segments(pos) do
    base = pos >>> GridConfig.seg_shift()

    for offset <- -@cursor_margin_segments..@cursor_margin_segments, into: MapSet.new() do
      base + offset &&& @segment_index_mask
    end
  end

  @spec check_join_rate_limit(Phoenix.Socket.t()) :: :ok | {:error, :rate_limited}
  defp check_join_rate_limit(socket) do
    ip = socket.assigns[:remote_ip] || "unknown"

    case RateLimit.hit("join:#{ip}", GridConfig.join_limit_ms(), GridConfig.join_limit_count()) do
      {:allow, _count} -> :ok
      {:deny, _limit} -> {:error, :rate_limited}
    end
  end

  @spec check_action_limit(Phoenix.Socket.t(), pos_integer()) :: :ok | {:error, :rate_limited}
  defp check_action_limit(socket, cost) do
    key = socket.assigns.action_limit_key

    case RateLimit.hit(key, GridConfig.toggle_limit_ms(), GridConfig.toggle_limit_count(), cost) do
      {:allow, _count} -> :ok
      {:deny, _limit} -> {:error, :rate_limited}
    end
  end

  @spec update_subscriptions(
          Phoenix.Socket.t(),
          MapSet.t(non_neg_integer()),
          MapSet.t(non_neg_integer())
        ) :: Phoenix.Socket.t()
  defp update_subscriptions(socket, current, wanted) do
    current |> MapSet.difference(wanted) |> Enum.each(&unsubscribe/1)
    wanted |> MapSet.difference(current) |> Enum.each(&subscribe(socket, &1))
    socket
  end

  # The fastlane metadata is what lets Phoenix encode a patch batch once and
  # write it straight to the transport, instead of waking this process per
  # subscriber to serialise an identical payload.
  @spec subscribe(Phoenix.Socket.t(), non_neg_integer()) :: :ok
  defp subscribe(socket, id) do
    Phoenix.PubSub.subscribe(CheckMill.PubSub, segment_topic(id),
      metadata: {:fastlane, socket.transport_pid, socket.serializer, []}
    )
  end

  @spec unsubscribe(non_neg_integer()) :: :ok
  defp unsubscribe(id), do: Phoenix.PubSub.unsubscribe(CheckMill.PubSub, segment_topic(id))

  @spec segment_topic(non_neg_integer()) :: String.t()
  defp segment_topic(id), do: "grid:seg:#{id}"

  @spec schedule_cursor(Phoenix.Socket.t(), non_neg_integer()) :: Phoenix.Socket.t()
  defp schedule_cursor(%{assigns: %{cursor: pos}} = socket, pos), do: socket

  defp schedule_cursor(%{assigns: %{cursor_ref: ref}} = socket, pos) when not is_nil(ref) do
    assign(socket, :pending_cursor, pos)
  end

  defp schedule_cursor(socket, pos) do
    assign(socket, %{
      pending_cursor: pos,
      cursor_ref: Process.send_after(self(), :flush_cursor, @cursor_flush_ms)
    })
  end

  @spec push_window_snapshot(Phoenix.Socket.t(), non_neg_integer()) :: :ok
  defp push_window_snapshot(socket, pos) do
    push(socket, "window_snapshot", Wire.window_snapshot(pos, GridStore.window_snapshot(pos)))
  end
end
