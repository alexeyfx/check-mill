/*


Slide by slide looping approach:

    - on layout loop:
        increase each slide vIdx by slides amount;

    - on slides left shift (to start):
        decrease each shifted slide vIdx by slides amount;

    - on slides right shift (to end):
        increase each shifted slide vIdx by slides amount;

Abstractions:

    interface Slide {
        inMemoryIndex: number;
        virtualIndex: number;
        domElement: Node;
        translate: TranslateType;
    }

    interface Track {
        slides: Slide[],
        loop(direction: number, layoutMetrics: LayoutMetricsType): void {}
        shift(direction: number, layoutMetrics: LayoutMetricsType): void {}
    }


    scroll-looper.looped.register(dir => track.loop(dir, metrics));
    slides-looper.looped.register(dir => track.shift(dir, metrics));

*/
