export class TranslationController {
  /**
   * Translates an element along the Y-axis using hardware-accelerated 3D transforms.
   * Rounds the target value to 2 decimal places to prevent sub-pixel layout anomalies.
   */
  public static to(element: HTMLElement, target: number): void {
    const roundedTarget = Math.round(target * 100) / 100;
    element.style.transform = `translate3d(0px, ${roundedTarget}px, 0px)`;
  }

  /**
   * Removes the transform rule from the element.
   * If no other inline styles remain, it strips the style attribute entirely to keep the DOM pristine.
   */
  public static clear(element: HTMLElement): void {
    element.style.transform = "";

    if (element.getAttribute("style") === "") {
      element.removeAttribute("style");
    }
  }
}
