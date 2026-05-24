import { Channel, Socket } from "phoenix";

import { DisposableStore, EventReader, isDev, TypedEvent, type Disposable } from "../core";
import type { Component } from "./component";

export type PatchBatch = { seq: number; patches: [number, number][] };
export type GlobalSnapshotBegin = { chunks: number };
export type GlobalSnapshotChunk = { i: number; b64: string };
export type WindowSnapshot = { pos: number; bits_b64: string };

export interface Transport extends Component {
  readonly patchBatch: EventReader<PatchBatch>;
  readonly snapshotBegin: EventReader<GlobalSnapshotBegin>;
  readonly snapshotChunk: EventReader<GlobalSnapshotChunk>;
  readonly snapshotDone: EventReader<void>;
  readonly windowSnapshot: EventReader<WindowSnapshot>;

  sendCursor(pos: number): void;
  sendToggle(idx: number): void;
  sendToggleMany(idxs: number[]): void;
}

export function createTransport(url: string): Transport {
  const patchBatch = new TypedEvent<PatchBatch>();

  const snapshotBegin = new TypedEvent<GlobalSnapshotBegin>();

  const snapshotChunk = new TypedEvent<GlobalSnapshotChunk>();

  const snapshotDone = new TypedEvent<void>();

  const windowSnapshot = new TypedEvent<WindowSnapshot>();

  let channel: Channel | null = null;

  const events = [patchBatch, snapshotBegin, snapshotChunk, snapshotDone, windowSnapshot] as const;

  function init(): Disposable {
    const socket = new Socket(url, {});
    socket.connect();

    channel = socket.channel("grid:main", {});

    channel.on("patch_batch", patchBatch.emit);
    channel.on("global_snapshot_begin", snapshotBegin.emit);
    channel.on("global_snapshot_chunk", snapshotChunk.emit);
    channel.on("global_snapshot_done", snapshotDone.emit);
    channel.on("window_snapshot", windowSnapshot.emit);

    channel
      .join()
      .receive("ok", (resp) => isDev && console.log("Joined successfully", resp))
      .receive("error", (resp) => isDev && console.log("Unable to join", resp));

    const disposables = new DisposableStore();
    disposables.push(
      () => {
        socket.disconnect();
        channel?.leave();
        channel = null;
      },
      ...events.map((event) => event.clear),
    );

    return () => disposables.flushAll();
  }

  function sendCursor(pos: number): void {
    channel?.push("cursor", { pos });
  }

  function sendToggle(idx: number): void {
    channel?.push("toggle", { idx });
  }

  function sendToggleMany(idxs: number[]): void {
    channel?.push("toggle_many", { idxs });
  }

  return {
    init,
    patchBatch,
    snapshotBegin,
    snapshotChunk,
    snapshotDone,
    windowSnapshot,
    sendCursor,
    sendToggle,
    sendToggleMany,
  };
}
