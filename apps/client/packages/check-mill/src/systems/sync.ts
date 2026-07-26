import type { AppSystemInstance, SystemContext } from "../components";
import { AppDirtyFlags, Phases, isDirty, markDirty, topmostRetained } from "../components";
import type { Disposable, LoopParams } from "../core";
import { concatUint8Arrays, gunzipInBrowser, throttle } from "../core";

/** Applies inbound server state and reports where the user is looking. */
/** Anything that can put a different page at the top of the viewport. */
const CURSOR_MAY_HAVE_MOVED =
  AppDirtyFlags.Motion | AppDirtyFlags.Layout | AppDirtyFlags.Hydration;

export type SyncContext = SystemContext<
  "transport",
  "layout" | "motion" | "selectionBoard" | "syncBuffer" | "frame"
>;

export function SyncSystem(appRef: SyncContext): AppSystemInstance {
  const { state } = appRef;

  let inflating = false;
  let disposed = false;

  /** Where the viewport is, and the last position the server was told about. */
  let pendingCursor = -1;
  let sentCursor = -1;

  /**
   * The send is throttled to match the server's own cursor flush, so it will
   * often decline. `pendingCursor` outliving `sentCursor` is what keeps the
   * loop awake until one gets through — parking on an unsent cursor would
   * leave the server subscribing us to the wrong region of the grid.
   */
  const flushCursor = throttle(() => {
    sentCursor = pendingCursor;
    appRef.host.transport.sendCursor(pendingCursor);
  }, 300);

  function init(): Disposable {
    disposed = false;

    return () => {
      disposed = true;
      pendingCursor = -1;
      sentCursor = -1;
    };
  }

  function consumePatches(_params: LoopParams): void {
    const { patches } = state.syncBuffer.inbound;

    if (inflating || patches.length === 0) return;

    for (const [index, value] of patches) {
      state.selectionBoard.setAt(index, value !== 0);
    }

    patches.length = 0;
    markDirty(state.frame, AppDirtyFlags.Board);
  }

  function consumeWindowSnapshots(_params: LoopParams): void {
    const { windowSnapshots } = state.syncBuffer.inbound;

    if (inflating || windowSnapshots.length === 0) return;

    for (const snapshot of windowSnapshots) {
      state.selectionBoard.patchFromBase64(snapshot.pos, snapshot.bits_b64, { bitOrder: "msb0" });
    }

    windowSnapshots.length = 0;
    markDirty(state.frame, AppDirtyFlags.Board);
  }

  function consumeSnapshotStream(_params: LoopParams): void {
    const { stream } = state.syncBuffer.inbound;

    if (inflating || !stream.isDone) return;
    if (stream.chunks.length !== stream.expectedChunks) return;

    const compressed = concatUint8Arrays(stream.chunks);

    stream.chunks.length = 0;
    stream.expectedChunks = 0;
    stream.isDone = false;
    inflating = true;

    gunzipInBrowser(compressed)
      .then((raw) => {
        if (disposed) return;

        state.selectionBoard.copyFromBytesWithOrder(raw, { bitOrder: "msb0" });
        markDirty(state.frame, AppDirtyFlags.Board);
      })
      .catch(() => undefined)
      .then(() =>  inflating = false);
  }

  function syncCursor(_params: LoopParams): void {
    // Re-locating the anchor walks the registry, so only bother when something
    // could actually have moved it.
    if (isDirty(state.frame, CURSOR_MAY_HAVE_MOVED)) {
      const plan = state.layout.current;
      const anchor = topmostRetained(state.motion.visibility, state.motion.track, plan);

      if (anchor) {
        pendingCursor = anchor.pageIndex * plan.computed.pagination.itemsPerSlide;
      }
    }

    if (pendingCursor !== sentCursor) {
      flushCursor();
    }
  }

  const { inbound } = state.syncBuffer;

  return {
    init,
    isBusy: () =>
      inflating ||
      pendingCursor !== sentCursor ||
      inbound.patches.length > 0 ||
      inbound.windowSnapshots.length > 0,
    logic: {
      [Phases.IO]: [
        consumeSnapshotStream,
        consumeWindowSnapshots,
        consumePatches,
        syncCursor,
      ],
    },
  };
}
