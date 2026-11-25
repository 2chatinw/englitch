/**
 * A little isometric WASD macro keypad, drawn in SVG for the page-change wipe.
 * Everything is laid out flat (a top view) and tilted with one isometric matrix; height comes from
 * stacking the same shape a few pixels apart, so the sides read as solid blocks.
 */
const ISO = 'matrix(0.866 0.5 -0.866 0.5 0 0)';
const BASE_H = 42; // base height in screen px
const KEY_H = 18; // keycap height above the base
const STEP = 3;

type KeyDef = { id: string; label: string; x: number; y: number; w: number; h: number; hot?: boolean };
const KEYS: KeyDef[] = [
  { id: 'Q', label: 'Q', x: 14, y: 14, w: 56, h: 56 },
  { id: 'W', label: 'W', x: 78, y: 14, w: 56, h: 56, hot: true },
  { id: 'A', label: 'A', x: 14, y: 78, w: 56, h: 56, hot: true },
  { id: 'E', label: 'E', x: 142, y: 14, w: 56, h: 56 },
  { id: 'S', label: 'S', x: 78, y: 78, w: 56, h: 56, hot: true },
  { id: 'D', label: 'D', x: 142, y: 78, w: 56, h: 56, hot: true },
  { id: 'SPACE', label: '', x: 14, y: 142, w: 184, h: 46 },
]; // ordered back to front so nearer keys draw over farther ones

// cable path in screen space: starts behind the back-left face, sweeps out and down to the plug
const CABLE = 'M -40 50 C -110 40, -176 8, -200 56 C -216 90, -214 122, -221 146';
const PLUG = { x: -221, y: 146, deg: 18 }; // turned to match the cable's last direction

const layers = (h: number) => Array.from({ length: Math.floor(h / STEP) }, (_, i) => i * STEP);

export function Keypad() {
  return (
    <svg className="keypad" viewBox="-262 -60 492 320" aria-hidden="true">
      <defs>
        {/* an ink outline around each solid shape, like the cel-shaded reference */}
        <filter id="kp-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology operator="dilate" radius="2.6" in="SourceAlpha" result="grow" />
          <feFlood floodColor="#15275C" />
          <feComposite in2="grow" operator="in" result="ink" />
          <feMerge><feMergeNode in="ink" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* soft shadow on the backdrop */}
      <g transform={`translate(26 ${BASE_H + 26})`}>
        <rect x="0" y="0" width="212" height="202" rx="26" transform={ISO} fill="rgba(10, 30, 90, .28)" />
      </g>
      {/* cable: leaves the back of the case (its start is hidden behind the base), one smooth S-bend,
          a soft shadow on the ground, an ink edge, a body and a thin highlight so it reads as round */}
      <path className="kp-cable-shadow" d={CABLE} transform="translate(16 26)" />
      <path className="kp-cable-ink" d={CABLE} />
      <path className="kp-cable" d={CABLE} />
      <path className="kp-cable-shine" d={CABLE} transform="translate(-1.8 -2.2)" />
      {/* USB plug, turned to follow the end of the cable */}
      <g transform={`translate(${PLUG.x} ${PLUG.y}) rotate(${PLUG.deg})`} filter="url(#kp-ink)">
        <rect className="kp-plug" x="-9" y="-4" width="18" height="16" rx="5" />
        <rect className="kp-plug" x="-15" y="10" width="30" height="40" rx="8" />
        <rect className="kp-plug-shine" x="-10" y="15" width="5" height="28" rx="2.5" />
        <rect className="kp-usb" x="-11" y="49" width="22" height="20" rx="2" />
        <rect className="kp-usb-hole" x="-6" y="55" width="4" height="5" rx="1" />
        <rect className="kp-usb-hole" x="2" y="55" width="4" height="5" rx="1" />
      </g>
      {/* base: stacked sides, then the top */}
      <g filter="url(#kp-ink)">
      {layers(BASE_H).map((z) => (
        <rect key={'b' + z} className="kp-base-side" x="0" y="0" width="212" height="202" rx="26" transform={`translate(0 ${BASE_H - z}) ${ISO}`} />
      ))}
      <rect className="kp-base-top" x="0" y="0" width="212" height="202" rx="26" transform={ISO} />
      </g>
      {KEYS.map((k) => (
        <g key={k.id} className={'kp-key' + (k.hot ? ' is-hot' : '')} data-key={k.id} filter="url(#kp-ink)">
          {layers(KEY_H).map((z) => (
            <rect key={z} className="kp-key-side" x={k.x} y={k.y} width={k.w} height={k.h} rx="10" transform={`translate(0 ${-z}) ${ISO}`} />
          ))}
          <g transform={`translate(0 ${-KEY_H}) ${ISO}`}>
            <rect className="kp-key-top" x={k.x} y={k.y} width={k.w} height={k.h} rx="10" />
            <rect className="kp-key-dish" x={k.x + 7} y={k.y + 7} width={k.w - 14} height={k.h - 14} rx="7" />
            {k.label ? (
              <text className="kp-key-label" x={k.x + k.w / 2} y={k.y + k.h / 2} textAnchor="middle" dominantBaseline="central">{k.label}</text>
            ) : (
              <rect className="kp-key-bar" x={k.x + k.w / 2 - 26} y={k.y + k.h / 2 - 3} width="52" height="6" rx="3" />
            )}
          </g>
        </g>
      ))}
    </svg>
  );
}
