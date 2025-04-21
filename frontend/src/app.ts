import { Acceleration, Animations, Axis, Drag, Wheel, Translate, Location } from "./components";
import { query } from "./utils";

export async function main() {

  /**************************************** 
   * Required dom elements 
   ****************************************/

  /** Application root element */
  const root = query(document, "#root", true) as HTMLElement;

  /** Application scroll-body element */
  const container = query(document, ".container", true) as HTMLElement;




  /**************************************** 
   * Application data-components 
   ****************************************/

  /** Scroll direction component */
  const axis = Axis("y");

  const location = Location(0);




  /**************************************** 
   * Application controller-components
   ****************************************/

  const acceleration = Acceleration(
    location,
    0,
    0.68
  );

  const wheel = Wheel(root);

  const translate = Translate(axis, container);

  const animations = Animations(
    document,
    window,
    () => acceleration.seek(),
    (alpha) => {
      const hasSettledAndIdle = acceleration.settled() && !drag.interacting();
  
      if (hasSettledAndIdle) {
        animations.stop();
      }
    
      const interpolatedLocation =
        location.current.get() * alpha + location.previous.get() * (1 - alpha);
    
      location.offset.set(interpolatedLocation);
      translate.to(location.offset.get());
    }
  );

  const drag = Drag(root, location, animations, axis, acceleration);




  /**************************************** 
   * Run components initialization lifecycle method
   ****************************************/

  await Promise.all([drag, wheel, animations].map((m) => m.init()));




  /**************************************** 
   * After initialization
   ****************************************/

  console.log('Running...');
}



// const render: AnimationsRenderType = (
//   {
//     scrollBody,
//     translate,
//     location,
//     offsetLocation,
//     previousLocation,
//     scrollLooper,
//     slideLooper,
//     dragHandler,
//     animation,
//     eventHandler,
//     scrollBounds,
//     options: { loop }
//   },
//   alpha
// ) => {
//   const shouldSettle = scrollBody.settled()
//   const withinBounds = !scrollBounds.shouldConstrain()
//   const hasSettled = loop ? shouldSettle : shouldSettle && withinBounds
//   const hasSettledAndIdle = hasSettled && !dragHandler.pointerDown()

//   if (hasSettledAndIdle) animation.stop()

//   const interpolatedLocation =
//     location.get() * alpha + previousLocation.get() * (1 - alpha)

//   offsetLocation.set(interpolatedLocation)

//   if (loop) {
//     scrollLooper.loop(scrollBody.direction())
//     slideLooper.loop()
//   }

//   translate.to(offsetLocation.get())

//   if (hasSettledAndIdle) eventHandler.emit('settle')
//   if (!hasSettled) eventHandler.emit('scroll')
// }