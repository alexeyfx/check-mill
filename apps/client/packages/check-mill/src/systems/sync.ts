import { AppRef, AppSystemInstance, Phases } from "../components";
import { Disposable, DisposableStore } from "../core";

export function SyncSystem(_appRef: AppRef): AppSystemInstance {
  // const { itemsPerSlide } = state.layout.current.computed.pagination;

  // let patchQueue: [number, number][] = [];
  // let chunkBuffer: Uint8Array[] = [];
  // let lastCursor = -1;

  function init(): Disposable {
    const disposables = new DisposableStore();

    // disposables.push(
    //   gateway.snapshotBegin.register(() => (chunkBuffer = [])),
    //   gateway.snapshotChunk.register(({ b64 }) => chunkBuffer.push(base64ToUint8Array(b64))),
    //   gateway.snapshotDone.register(onSnapshotComplete),
    //   gateway.patchBatch.register(({ patches }) => patchQueue.push(...patches)),
    //   gateway.windowSnapshot.register(onWindowSnapshot),
    // );

    return () => disposables.flushAll();
  }

  // function consumePatches(app: AppRef): void {
  //   if (patchQueue.length === 0) return;

  //   const affectedPages = new Set<number>();

  //   for (const [index, value] of patchQueue) {
  //     board.setAt(index, Boolean(value));
  //     affectedPages.add(Math.floor(index / itemsPerSlide));
  //   }

  //   for (const slide of view.slides) {
  //     if (affectedPages.has(slide.pageIndex)) {
  //       slide.isDirty = true;
  //     }
  //   }

  //   markForCheck(app);
  //   patchQueue = [];
  // }

  // function onWindowSnapshot(snapshot: WindowSnapshot): void {
  //   board.patchFromBase64(snapshot.pos, snapshot.bits_b64, { bitOrder: "msb0" });

  //   for (const slide of view.slidesVisibilityTracker.getVisibleSlides()) {
  //     slide.isDirty = true;
  //   }

  //   markForCheck(appRef.state);
  // }

  // async function onSnapshotComplete(): Promise<void> {
  //   const gzBytes = concatUint8Arrays(chunkBuffer);
  //   chunkBuffer = [];

  //   try {
  //     const rawBytes = await gunzipInBrowser(gzBytes);
  //     board.copyFromBytesWithOrder(rawBytes, { bitOrder: "msb0" });

  //     for (const slide of view.slides) {
  //       slide.isDirty = true;
  //     }

  //     markForCheck(appRef.state);
  //   } catch (error) {}
  // }

  // function syncCursor(app: AppRef): void {
  //   const firstSlide = view.slidesVisibilityTracker.getFirstVisibleSlide();
  //   if (!firstSlide) return;

  //   const cursor = firstSlide.pageIndex * itemsPerSlide;

  //   if (cursor !== lastCursor) {
  //     lastCursor = cursor;
  //     app.gateway.sendCursor(cursor);
  //   }
  // }

  return {
    init,
    logic: {
      [Phases.IO]: [],
      // [Phases.IO]: [consumePatches, throttle(syncCursor, 300)],
    },
  };
}
