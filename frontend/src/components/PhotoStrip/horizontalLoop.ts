import gsap from "gsap";

/**
 * GreenSock's official `horizontalLoop()` helper -- a seamless, responsive,
 * infinite-looping GSAP timeline. Reproduced close to verbatim from
 * https://codepen.io/GreenSock/pen/PojYwPp rather than reinvented: every
 * hand-rolled 3D CSS-transform gallery we tried in this dashboard (a dome, a
 * sphere, a rotating cylinder) broke in a different way -- overlapping
 * tiles, a Chromium mask+3D-transform compositor bug that made whole layers
 * vanish at certain rotation angles, and a `ScrollTrigger` pin whose forced
 * document reflow on every scroll tick turned out to resurface an unrelated
 * hover bug elsewhere on the page. This is flat 2D (just `x`/`xPercent`) --
 * none of that bug surface exists here, which is the whole point of using
 * the library's own well-tested recipe instead of another custom one.
 */
export type HorizontalLoopConfig = {
  repeat?: number;
  paused?: boolean;
  speed?: number;
  snap?: number | false;
  paddingRight?: number;
  reversed?: boolean;
};

export function horizontalLoop(items: HTMLElement[], config: HorizontalLoopConfig = {}): gsap.core.Timeline {
  let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
    }),
    length = items.length,
    startX = items[0].offsetLeft,
    times: number[] = [],
    widths: number[] = [],
    xPercents: number[] = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v: number) => v : gsap.utils.snap(config.snap || 1),
    totalWidth: number,
    curX: number,
    distanceToStart: number,
    distanceToLoop: number,
    item: HTMLElement,
    i: number;

  gsap.set(items, {
    xPercent: (i: number, el: HTMLElement) => {
      const w = (widths[i] = parseFloat(String(gsap.getProperty(el, "width", "px"))));
      xPercents[i] = snap(
        (parseFloat(String(gsap.getProperty(el, "x", "px"))) / w) * 100 + Number(gsap.getProperty(el, "xPercent")),
      );
      return xPercents[i];
    },
  });
  gsap.set(items, { x: 0 });
  totalWidth =
    items[length - 1].offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    items[length - 1].offsetWidth * Number(gsap.getProperty(items[length - 1], "scaleX")) +
    (parseFloat(String(config.paddingRight)) || 0);

  for (i = 0; i < length; i++) {
    item = items[i];
    curX = (xPercents[i] / 100) * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * Number(gsap.getProperty(item, "scaleX"));
    tl.to(
      item,
      { xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100), duration: distanceToLoop / pixelsPerSecond },
      0,
    )
      .fromTo(
        item,
        { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100) },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond,
      )
      .add("label" + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }

  function toIndex(index: number, vars: gsap.TweenVars) {
    vars = vars || {};
    if (Math.abs(index - curIndex) > length / 2) index += index > curIndex ? -length : length;
    const newIndex = gsap.utils.wrap(0, length, index);
    let time = times[newIndex];
    if (time > tl.time() !== index > curIndex) {
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }

  (tl as any).next = (vars: gsap.TweenVars) => toIndex(curIndex + 1, vars);
  (tl as any).previous = (vars: gsap.TweenVars) => toIndex(curIndex - 1, vars);
  (tl as any).current = () => curIndex;
  (tl as any).toIndex = (index: number, vars: gsap.TweenVars) => toIndex(index, vars);
  (tl as any).times = times;

  if (config.reversed) {
    tl.vars.onReverseComplete?.();
    tl.reverse();
  }

  return tl;
}
