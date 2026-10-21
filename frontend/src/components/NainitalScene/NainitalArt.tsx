/**
 * The Nainital panorama, as flat ink-on-paper line art.
 *
 * Drawn strictly in the site palette (paper / paper-deep / white / ink / rust,
 * no third hue) so the illustration reads as part of the dashboard rather than
 * as a stock hero image, per workflow.md SS9.1.
 *
 * Each hill is a *filled landmass* with a separately stroked top edge, not a
 * bare stroke. That matters for two reasons: the fills give the scene real
 * depth ordering (each ridge hides what is behind it, so overlapping curves
 * stop reading as tangled wire), and the open top-edge path is what
 * DrawSVGPlugin animates -- a closed filled shape cannot be "drawn on" the way
 * an open path can. Alternating paper-deep / paper / white across the three
 * ranges separates them using only the palette's own tones.
 *
 * Geography, west to east, seen from the Tallital end of the lake: Naina Peak
 * (China Peak) is the tall summit on the left with the Snow View ropeway
 * running up to it, Ayarpatha is the rise on the right, Naina Devi temple
 * stands on the near bank, the Mall Road traces the east shore below the town,
 * and the Himalayan wall (Nanda Devi and neighbours) sits far behind it all.
 *
 * Every element that sits on a hill has its base y taken from that hill's
 * own curve, so nothing floats or sinks into the slope.
 */

/** Deodars along the near bank; [x, base y on the near ridge]. */
const PINES: [number, number][] = [
  [108, 370], [160, 367], [210, 363], [260, 360], [310, 358],
  [360, 358], [460, 360], [510, 361], [560, 362], [606, 363],
  [1050, 349], [1110, 352], [1170, 358],
];

/** The town stacked above the Mall; [x, base y, width, height]. */
const BUILDINGS: [number, number, number, number][] = [
  [664, 360, 26, 20], [698, 359, 20, 27], [724, 358, 30, 18], [760, 357, 22, 28],
  [788, 357, 26, 20], [822, 356, 20, 25], [850, 355, 28, 18], [886, 354, 22, 23],
  [916, 353, 26, 16], [950, 352, 20, 21], [976, 351, 30, 14],
];

export default function NainitalArt() {
  return (
    <svg
      className="nainital-svg"
      viewBox="0 0 1200 560"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Line illustration of Nainital: the Himalayan skyline, the ring of hills, Naini Lake with its boats, the Snow View ropeway, Naina Devi temple and the Mall Road."
    >
      <defs>
        {/* the lake's own outline, reused to clip the water fill and the ripples */}
        <clipPath id="lake-clip">
          <path d="M130 422 C 270 400, 460 392, 640 396 C 820 400, 990 410, 1068 426 C 1108 434, 1072 462, 966 476 C 800 496, 460 498, 302 482 C 186 470, 100 440, 130 422 Z" />
        </clipPath>

        {/* hatch for the "pressure" band that rises through the water */}
        <pattern id="pressure-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="var(--rust)" strokeWidth="2.5" opacity="0.5" />
        </pattern>
      </defs>

      {/* ---------------- sky ---------------- */}
      <g data-layer="sky">
        <rect className="sky-wash" x="0" y="0" width="1200" height="430" fill="var(--paper)" />
        <g id="sun">
          <circle cx="0" cy="0" r="33" fill="none" stroke="var(--line)" strokeWidth="1.4" />
          <circle cx="0" cy="0" r="25" fill="var(--paper)" stroke="var(--rust)" strokeWidth="2.5" />
          <g className="sun-rays" stroke="var(--rust)" strokeLinecap="round">
            <line x1="0" y1="-40" x2="0" y2="-31" strokeWidth="2.2" />
            <line x1="20.5" y1="-34.5" x2="16.5" y2="-27" strokeWidth="1.6" />
            <line x1="35.5" y1="-20.5" x2="28" y2="-16.5" strokeWidth="1.6" />
            <line x1="41" y1="0" x2="32" y2="0" strokeWidth="2.2" />
            <line x1="35.5" y1="20.5" x2="28" y2="16.5" strokeWidth="1.6" />
            <line x1="20.5" y1="34.5" x2="16.5" y2="27" strokeWidth="1.6" />
            <line x1="0" y1="41" x2="0" y2="32" strokeWidth="2.2" />
            <line x1="-20.5" y1="34.5" x2="-16.5" y2="27" strokeWidth="1.6" />
            <line x1="-35.5" y1="20.5" x2="-28" y2="16.5" strokeWidth="1.6" />
            <line x1="-41" y1="0" x2="-32" y2="0" strokeWidth="2.2" />
            <line x1="-35.5" y1="-20.5" x2="-28" y2="-16.5" strokeWidth="1.6" />
            <line x1="-20.5" y1="-34.5" x2="-16.5" y2="-27" strokeWidth="1.6" />
          </g>
        </g>
        {/* the arc the sun travels, never painted */}
        <path id="sun-path" d="M120 380 C 300 90, 900 90, 1080 380" fill="none" stroke="none" />
      </g>

      {/* ---------------- the Himalayan wall, far behind ---------------- */}
      <g data-layer="himalaya">
        {/* a solid hazy silhouette behind the ridge line -- previously this
            range had no fill at all (bare stroke), which is exactly why the
            whole background read as a thin wire sketch instead of a real
            mountain wall. Same outline as .peak-line, closed down to a
            baseline safely behind the nearer hill-bodies. Joins the existing
            .hill-body autoAlpha reveal group for free -- no changes needed in
            NainitalScene.tsx. */}
        <path
          className="hill-body"
          d="M-20 252
             L44 209 Q58 200 66 205 L94 221 Q102 226 111 214
             L141 174 Q150 162 159 172 L193 210 Q202 220 210 214
             L238 192 Q246 186 256 194 L290 220 Q300 228 309 214
             L343 166 Q352 152 361 163 L393 201 Q402 212 412 206
             L446 184 Q456 178 464 186 L492 216 Q500 224 511 214
             L549 180 Q560 170 569 178 L601 208 Q610 216 619 205
             L653 165 Q662 154 671 165 L703 203 Q712 214 721 209
             L751 189 Q760 184 771 192 L809 218 Q820 226 829 215
             L861 175 Q870 164 879 174 L911 208 Q920 218 930 213
             L966 193 Q976 188 986 196 L1020 222 Q1030 230 1039 220
             L1073 184 Q1082 174 1092 182 L1130 212 Q1140 220 1154 216
             L1220 198
             L1220 440 L-20 440 Z"
          fill="var(--ink-faint)"
          fillOpacity="0.4"
        />
        <path
          className="peak-line"
          d="M-20 252
             L44 209 Q58 200 66 205 L94 221 Q102 226 111 214
             L141 174 Q150 162 159 172 L193 210 Q202 220 210 214
             L238 192 Q246 186 256 194 L290 220 Q300 228 309 214
             L343 166 Q352 152 361 163 L393 201 Q402 212 412 206
             L446 184 Q456 178 464 186 L492 216 Q500 224 511 214
             L549 180 Q560 170 569 178 L601 208 Q610 216 619 205
             L653 165 Q662 154 671 165 L703 203 Q712 214 721 209
             L751 189 Q760 184 771 192 L809 218 Q820 226 829 215
             L861 175 Q870 164 879 174 L911 208 Q920 218 930 213
             L966 193 Q976 188 986 196 L1020 222 Q1030 230 1039 220
             L1073 184 Q1082 174 1092 182 L1130 212 Q1140 220 1154 216
             L1220 198"
          fill="none"
          stroke="var(--ink-faint)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* snowline hatching on the three tallest summits (apex positions follow
            the now only-lightly-rounded curve, a few px off the original sharp
            peak coordinates) */}
        <g className="snow-hatch" stroke="var(--ink-faint)" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M338 182 Q352 158 366 182" />
          <path d="M648 184 Q662 160 676 184" />
          <path d="M1068 203 Q1082 179 1096 203" />
        </g>
      </g>

      {/* ---------------- mist in the valley ---------------- */}
      <g data-layer="mist" stroke="var(--line)" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path className="mist-line" d="M60 262 C 200 250, 320 272, 470 260" />
        <path className="mist-line" d="M520 288 C 660 274, 800 296, 960 280" />
        <path className="mist-line" d="M180 282 C 300 272, 420 288, 560 278" />
        <path className="mist-line" d="M700 244 C 820 234, 940 252, 1080 240" />
      </g>

      {/* ---------------- the ring of hills ----------------
           Each range: a filled body, then its ridgeline as an open path so
           DrawSVG can stroke it on. Fills alternate paper-deep / paper / white
           to separate the three depths without leaving the palette. */}
      <g data-layer="hills">
        {/* far shoulder */}
        <path
          className="hill-body"
          d="M-20 322 C 120 288, 250 296, 380 312 C 520 330, 660 300, 800 296 C 940 292, 1080 312, 1220 326 L1220 560 L-20 560 Z"
          fill="var(--paper-deep)"
        />
        <path
          className="ridge"
          d="M-20 322 C 120 288, 250 296, 380 312 C 520 330, 660 300, 800 296 C 940 292, 1080 312, 1220 326"
          fill="none"
          stroke="var(--ink-soft)"
          strokeWidth="2"
        />

        {/* Naina Peak on the left, Ayarpatha opposite -- was fill="var(--paper)",
            exactly the sky's own color, so this whole prominent named hill was
            invisible except for its ridge stroke. var(--line) gives it real,
            solid contrast against the sky while staying inside the palette. */}
        <path
          className="hill-body"
          d="M-20 356 C 60 346, 130 268, 250 288 C 350 304, 420 344, 540 350 C 660 356, 760 306, 880 312 C 1000 318, 1120 350, 1220 354 L1220 560 L-20 560 Z"
          fill="var(--line)"
        />
        <path
          className="ridge"
          d="M-20 356 C 60 346, 130 268, 250 288 C 350 304, 420 344, 540 350 C 660 356, 760 306, 880 312 C 1000 318, 1120 350, 1220 354"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.4"
        />

        {/* the near bank the town sits on */}
        <path
          className="hill-body"
          d="M-20 380 C 160 366, 300 352, 460 360 C 620 368, 780 356, 940 350 C 1080 345, 1160 356, 1220 366 L1220 560 L-20 560 Z"
          fill="var(--white)"
        />
        <path
          className="ridge"
          d="M-20 380 C 160 366, 300 352, 460 360 C 620 368, 780 356, 940 350 C 1080 345, 1160 356, 1220 366"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
        />

        <text className="peak-label" x="250" y="270" textAnchor="middle">
          NAINA PEAK
        </text>
        <text className="peak-label" x="880" y="294" textAnchor="middle">
          AYARPATHA
        </text>
      </g>

      {/* ---------------- deodar line, standing on the near bank ---------------- */}
      {/* Solid ink-soft silhouettes, not white-filled outlines -- a tree drawn as
          a white cutout with a thin border reads as a sketch icon; a solid dark
          taper reads as an actual conifer standing against the light bank. */}
      <g data-layer="pines" fill="none" strokeLinejoin="round">
        {PINES.map(([x, y], i) => (
          <g className="pine" key={i}>
            <path d={`M${x} ${y} L${x} ${y - 7}`} stroke="var(--ink)" strokeWidth="1.5" />
            {/* three graduated tiers, each a gently concave (pinched-waist) taper
                rather than a straight-sided triangle -- the refined-conifer silhouette */}
            <path
              d={`M${x - 11} ${y - 4} Q${x - 3} ${y - 9} ${x} ${y - 19} Q${x + 3} ${y - 9} ${x + 11} ${y - 4} Z`}
              fill="var(--ink-soft)"
              stroke="var(--ink)"
              strokeWidth="1"
            />
            <path
              d={`M${x - 8} ${y - 13} Q${x - 2} ${y - 17} ${x} ${y - 26} Q${x + 2} ${y - 17} ${x + 8} ${y - 13} Z`}
              fill="var(--ink-soft)"
              stroke="var(--ink)"
              strokeWidth="1"
            />
            <path
              d={`M${x - 5} ${y - 21} Q${x - 1.5} ${y - 24} ${x} ${y - 32} Q${x + 1.5} ${y - 24} ${x + 5} ${y - 21} Z`}
              fill="var(--ink-soft)"
              stroke="var(--ink)"
              strokeWidth="1"
            />
          </g>
        ))}
      </g>

      {/* ---------------- ropeway, near bank up to Snow View ---------------- */}
      <g data-layer="ropeway">
        <path id="ropeway-cable" d="M180 368 L205 330 L252 292" fill="none" stroke="var(--ink)" strokeWidth="1.4" />
        <g className="pylon" stroke="var(--ink)" strokeWidth="1.6" fill="none">
          <path d="M205 330 L205 352" />
          <path d="M199 352 L211 352" />
        </g>
        <g id="cable-car">
          <path d="M-1 -9 L1 -9 L1 -4 L-1 -4 Z" fill="var(--ink)" />
          <rect x="-8" y="-4" width="16" height="11" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
          <line x1="-4" y1="-1" x2="4" y2="-1" stroke="var(--rust)" strokeWidth="2" />
        </g>
      </g>

      {/* ---------------- Naina Devi temple, on the near bank ---------------- */}
      <g id="temple">
        <path d="M398 359 L432 359 L432 340 L398 340 Z" fill="var(--white)" stroke="var(--ink)" strokeWidth="1.8" />
        {/* shikhara: a gentle S-curve (convex near the tip, concave near the base) rather
            than a single uniform bow, closer to a real spire's silhouette */}
        <path
          d="M415 300 C 425 309, 430 320, 431 330 C 431.5 335, 432 337, 432 340 L398 340 C 398 337, 398.5 335, 399 330 C 400 320, 405 309, 415 300 Z"
          fill="var(--white)"
          stroke="var(--ink)"
          strokeWidth="1.8"
        />
        <path d="M403.5 331 Q 415 336, 426.5 331" fill="none" stroke="var(--ink-faint)" strokeWidth="1.2" />
        <path d="M415 300 L415 291" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="415" cy="288" r="3" fill="var(--rust)" />
        <path d="M407 346 L423 346" stroke="var(--ink-faint)" strokeWidth="1.4" />
      </g>

      {/* ---------------- the town and the Mall along the east bank ---------------- */}
      <g data-layer="town">
        <g className="town-block">
          {BUILDINGS.map(([x, y, w, h], i) => (
            <g className="building" key={i}>
              <rect x={x} y={y - h} width={w} height={h} rx={1.5} fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth="1.6" />
              <line x1={x + 4} y1={y - h + 6} x2={x + w - 4} y2={y - h + 6} stroke="var(--ink-faint)" strokeWidth="1.2" />
              {h > 22 && (
                <line x1={x + 4} y1={y - h + 13} x2={x + w - 4} y2={y - h + 13} stroke="var(--ink-faint)" strokeWidth="1.2" />
              )}
            </g>
          ))}
        </g>
        <path
          id="mall-road"
          d="M1032 372 C 992 361, 900 353, 812 353 C 742 353, 692 357, 650 361"
          fill="none"
          stroke="var(--ink-soft)"
          strokeWidth="2.4"
        />
        <text className="peak-label" x="836" y="381" textAnchor="middle">
          THE MALL
        </text>
      </g>

      {/* ---------------- Naini Lake ---------------- */}
      <g data-layer="lake">
        <path
          id="lake-shape"
          d="M130 422 C 270 400, 460 392, 640 396 C 820 400, 990 410, 1068 426 C 1108 434, 1072 462, 966 476 C 800 496, 460 498, 302 482 C 186 470, 100 440, 130 422 Z"
          fill="var(--paper-deep)"
          stroke="var(--ink)"
          strokeWidth="2.4"
        />

        <g clipPath="url(#lake-clip)">
          {/* the pressure band rises through the water as the section is read */}
          <rect id="pressure-band" x="100" y="400" width="1000" height="130" fill="url(#pressure-hatch)" />

          {/* Naina Peak's reflection: three short vertical shimmers, not a
              second ridgeline -- a mirrored ridge read as a stray stroke */}
          <g className="reflection" stroke="var(--ink-faint)" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M238 404 C 232 424, 244 444, 238 464" />
            <path d="M250 402 C 244 422, 256 442, 250 462" />
            <path d="M262 404 C 256 426, 268 446, 262 468" />
          </g>

          <g className="ripples" stroke="var(--ink-faint)" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path className="ripple" d="M330 446 C 390 438, 450 454, 510 444" />
            <path className="ripple" d="M470 466 C 540 456, 610 472, 680 460" />
            <path className="ripple" d="M700 442 C 760 434, 820 450, 890 438" />
            <path className="ripple" d="M380 476 C 450 468, 520 482, 590 472" />
            <path className="ripple" d="M780 472 C 840 464, 900 478, 960 466" />
            <path className="ripple" d="M560 424 C 620 418, 680 430, 750 420" />
          </g>
        </g>

        {/* boat routes -- never painted, only used as motion paths */}
        <path id="boat-path-a" d="M280 448 C 420 428, 640 432, 840 444" fill="none" stroke="none" />
        <path id="boat-path-b" d="M980 462 C 830 478, 560 480, 340 466" fill="none" stroke="none" />
        <path id="boat-path-c" d="M420 478 C 560 462, 700 466, 860 474" fill="none" stroke="none" />

        {/* the rowing boats the Boat House Club hires out */}
        {["a", "b", "c"].map((k) => (
          <g className="boat" data-boat={k} key={k}>
            <path
              d="M-13 3 L13 3 C 13 3, 11 12.5, 0 13 C -11 12.5, -13 3, -13 3 Z"
              fill="var(--paper)"
              stroke="var(--ink)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M0 3 L0 -13" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M1 -12 C 7 -8, 10.5 -3, 11.5 1 L1 1 Z" fill="var(--rust)" stroke="var(--rust-deep)" strokeWidth="1" strokeLinejoin="round" />
          </g>
        ))}
      </g>

      {/* ---------------- birds ---------------- */}
      <path id="bird-path" d="M-40 214 C 260 154, 620 254, 1240 182" fill="none" stroke="none" />
      <g data-layer="birds" stroke="var(--ink)" strokeWidth="1.8" fill="none" strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => (
          <path className="bird" key={i} d="M-9 0.5 C -6 -7, -2 -7.5, 0 -1.5 C 2 -7.5, 6 -7, 9 0.5" />
        ))}
      </g>

      {/* ---------------- foreground contour lines ---------------- */}
      <g data-layer="contours" fill="none" stroke="var(--line-strong)" strokeWidth="1.4">
        <path className="contour" d="M-20 518 C 180 504, 420 528, 640 516 C 860 504, 1040 522, 1220 512" />
        <path className="contour" d="M-20 540 C 200 526, 440 548, 660 538 C 880 528, 1050 542, 1220 534" />
      </g>
    </svg>
  );
}
