defmodule CheckMillWeb.GridChannel do
  use Phoenix.Channel
  import Bitwise

  alias CheckMill.{GridConfig, GridStore, SegmentBroadcaster, RateLimit}

  @cursor_flush_ms 64

  @impl true
  def join("grid:main", _payload, socket) do
    with :ok <- check_join_rate_limit(socket) do
      initial_state = %{
        cursor: 0,
        segments: MapSet.new(),
        cursor_ref: nil,
        pending_cursor: nil
      }

      socket =
        socket
        |> assign(initial_state)
        |> schedule_cursor(0)

      send(self(), :begin_snapshot)
      {:ok, socket}
    else
      {:error, :rate_limited} ->
        {:error, %{reason: "rate_limit", message: "Too many connections."}}
    end
  end

  @impl true
  def handle_in("cursor", %{"pos" => pos}, socket) when is_integer(pos),
    do: {:noreply, schedule_cursor(socket, pos &&& GridConfig.grid_mask())}

  @impl true
  def handle_in("toggle", %{"idx" => idx}, socket) when is_integer(idx) do
    with :ok <- check_action_limit(socket, 1) do
      idx = idx &&& GridConfig.grid_mask()
      val = GridStore.toggle(idx)
      SegmentBroadcaster.enqueue(idx >>> GridConfig.seg_shift(), idx, val)
      {:reply, {:ok, %{"idx" => idx, "val" => val}}, socket}
    else
      {:error, :rate_limited} -> {:reply, {:error, %{"reason" => "slow_down"}}, socket}
    end
  end

  @impl true
  def handle_in("toggle_many", %{"idxs" => idxs}, socket) when is_list(idxs) do
    valid_idxs = Enum.take(idxs, GridConfig.max_toggles_per_msg())
    cost = Enum.count(valid_idxs)

    with :ok <- check_action_limit(socket, cost) do
      patches = process_batch_toggles(valid_idxs)
      {:reply, {:ok, %{"patches" => patches}}, socket}
    else
      {:error, :rate_limited} ->
        {:reply, {:error, %{"reason" => "batch_limit"}}, socket}
    end
  end

  @impl true
  def handle_info(:begin_snapshot, socket) do
    chunks = GridStore.global_snapshot_chunks(GridConfig.global_chunk_bytes())
    push(socket, "global_snapshot_begin", %{"chunks" => length(chunks)})
    send(self(), {:push_chunk, chunks, 0})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:push_chunk, [], _i}, socket) do
    push(socket, "global_snapshot_done", %{})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:push_chunk, [chunk | rest], i}, socket) do
    push(socket, "global_snapshot_chunk", %{"i" => i, "b64" => Base.encode64(chunk)})
    Process.send_after(self(), {:push_chunk, rest, i + 1}, 1)
    {:noreply, socket}
  end

  @impl true
  def handle_info(:flush_cursor, %{assigns: %{pending_cursor: pos}} = socket)
      when not is_nil(pos) do
    socket =
      socket
      |> assign(cursor_ref: nil, pending_cursor: nil)
      |> apply_cursor(pos)

    {:noreply, socket}
  end

  @impl true
  def handle_info(:flush_cursor, socket), do: {:noreply, assign(socket, :cursor_ref, nil)}

  @impl true
  def handle_info({:patch_batch, seq, patches}, socket) do
    push(socket, "patch_batch", %{"seq" => seq, "patches" => patches})
    {:noreply, socket}
  end

  defp process_batch_toggles(idxs) do
    patches = GridStore.toggle_many(idxs)

    for [idx, val] <- patches do
      SegmentBroadcaster.enqueue(idx >>> GridConfig.seg_shift(), idx, val)
    end

    patches
  end

  defp apply_cursor(socket, pos) do
    wanted = wanted_segments(pos)

    socket
    |> update_subscriptions(socket.assigns.segments, wanted)
    |> assign(cursor: pos, segments: wanted)
    |> tap(&push_window_snapshot(&1, pos))
  end

  defp wanted_segments(pos) do
    [pos, pos + GridConfig.seg_bits() - 1 &&& GridConfig.grid_mask()]
    |> Enum.map(&(&1 >>> GridConfig.seg_shift()))
    |> MapSet.new()
  end

  defp check_join_rate_limit(socket) do
    ip = socket.assigns[:remote_ip] || "unknown"

    case RateLimit.hit("join:#{ip}", GridConfig.join_limit_ms(), GridConfig.join_limit_count()) do
      {:allow, _} -> :ok
      {:deny, _} -> {:error, :rate_limited}
    end
  end

  defp check_action_limit(socket, cost) do
    key = "act:#{inspect(socket.transport_pid)}"

    case RateLimit.hit(key, GridConfig.toggle_limit_ms(), GridConfig.toggle_limit_count(), cost) do
      {:allow, _} -> :ok
      {:deny, _} -> {:error, :rate_limited}
    end
  end

  defp update_subscriptions(socket, current, wanted) do
    MapSet.difference(current, wanted) |> Enum.each(&unsubscribe/1)
    MapSet.difference(wanted, current) |> Enum.each(&subscribe/1)
    socket
  end

  defp subscribe(id), do: Phoenix.PubSub.subscribe(CheckMill.PubSub, "grid:seg:#{id}")

  defp unsubscribe(id), do: Phoenix.PubSub.unsubscribe(CheckMill.PubSub, "grid:seg:#{id}")

  defp schedule_cursor(%{assigns: %{cursor: pos}} = socket, pos), do: socket

  defp schedule_cursor(%{assigns: %{cursor_ref: ref}} = socket, pos) when not is_nil(ref),
    do: assign(socket, :pending_cursor, pos)

  defp schedule_cursor(socket, pos) do
    assign(socket, %{
      pending_cursor: pos,
      cursor_ref: Process.send_after(self(), :flush_cursor, @cursor_flush_ms)
    })
  end

  defp push_window_snapshot(socket, pos) do
    push(socket, "window_snapshot", %{
      "pos" => pos,
      "bits_b64" => Base.encode64(GridStore.window_snapshot(pos))
    })
  end
end
