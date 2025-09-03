import { WindowType } from ".";

export function getSupport(ownerWindow: WindowType, ownerDocument: Document) {
    return {
        hasWheelEvent: 'onwheel' in ownerDocument,
        hasMouseWheelEvent: 'onmousewheel' in ownerDocument,
        hasTouch: 'ontouchstart' in ownerDocument,
        hasTouchWin: ownerWindow.navigator.maxTouchPoints && ownerWindow.navigator.maxTouchPoints > 0,
        hasKeyDown: 'onkeydown' in document,
        isFirefox: ownerWindow.navigator.userAgent.indexOf('Firefox') > -1,
    } as const;
}