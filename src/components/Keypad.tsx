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

const layers = (h: number) => Array.from({ length: Math.floor(h / STEP) }, (_, i) => i * STEP);

export function Keypad() {
  return (
    <svg className="keypad" viewBox="-230 -70 460 330" aria-hidden="true">
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
      {/* cable and USB plug, coming out of the back left */}
      <path className="kp-cable-ink" d="M-44 52 C -110 20, -120 -30, -150 -6 S -196 70, -176 110" />
      <path className="kp-cable" d="M-44 52 C -110 20, -120 -30, -150 -6 S -196 70, -176 110" />
      <g transform="translate(-176 110) rotate(28)" filter="url(#kp-ink)">
        <rect className="kp-plug" x="-16" y="0" width="32" height="40" rx="6" />
        <rect className="kp-usb" x="-11" y="38" width="22" height="20" rx="2" />
      </g>
      {/* base: stacked sides, then the top */}
      <g filter="url(#kp-ink)">
      {layers(BASE_H).map((z) => (
        <rect key={'b' + z} className="kp-base-side" x="0" y="0" width="212" height="202" rx="26" transform={`translate(0 ${BASE_H - z}) ${ISO}`} />
      ))}
      <rect className="kp-base-top" x="0" y="0" width="212" height="202" rx="26" transform={ISO} />
      </g>
      {/* knob on the front left face */}
      <g transform="translate(-62 186)">
        <ellipse className="kp-knob-side" cx="0" cy="6" rx="15" ry="13" />
        <ellipse className="kp-knob" cx="0" cy="0" rx="15" ry="13" />
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
