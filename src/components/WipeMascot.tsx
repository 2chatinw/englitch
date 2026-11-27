import type { Route } from '../lib/router';

/*
 * The page-change wipe's mascots, one per skill (owner picked from 12 drawings, Nov 2026: speak 3, listen 1,
 * read 2, write 1). Drawn as static SVG strings in the keypad's style (navy ink outline, sun yellow, the skill
 * colours); their idle wiggle is CSS (`.wm-*` in theme.css): a quick squash-and-spring like the keypad's keys.
 */
const INK = '#15275C', Y = '#FFC53D', YD = '#DE8F00', W = '#FFFFFF', CR = '#F4F7FF', SD = '#C3D2EC', PK = '#FF9EC4',
  BLD = '#3D7BE0', MTD = '#2FB08A', LV = '#B9A6FF', MOUTH = '#7A1F3D';

const og = (x: number, y: number) => `style="transform-origin:${x}px ${y}px"`;
const eye = (x: number, y: number) => `<g class="wm-blink" ${og(x, y)}><ellipse cx="${x}" cy="${y}" rx="5.5" ry="7.5" fill="${INK}"/><circle cx="${x - 1.8}" cy="${y - 3}" r="2.1" fill="#fff"/></g>`;
const happy = (x: number, y: number) => `<path d="M${x - 6} ${y + 2}Q${x} ${y - 6} ${x + 6} ${y + 2}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
const cheeks = (a: number, b: number, y: number) => `<ellipse cx="${a}" cy="${y}" rx="6" ry="3.5" fill="#FF7FA8" opacity=".55"/><ellipse cx="${b}" cy="${y}" rx="6" ry="3.5" fill="#FF7FA8" opacity=".55"/>`;
const note = (x: number, y: number, d: number, c: string) => `<g class="wm-float" style="animation-delay:${d}s"><path d="M${x} ${y}v-20q8 2 12-5" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="${x - 4}" cy="${y}" rx="6.5" ry="5" fill="${c}" stroke="${INK}" stroke-width="3"/></g>`;
const hand = (x: number, y: number) => `<circle class="wm-o" cx="${x}" cy="${y}" r="8.5" fill="${W}"/>`;
const arm = (d: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
const shoes = (c: string, y: number, a: number, b: number) => `<ellipse class="wm-o" cx="${a}" cy="${y}" rx="14" ry="8" fill="${c}"/><ellipse class="wm-o" cx="${b}" cy="${y}" rx="14" ry="8" fill="${c}"/>`;
const tube = (d: string, w: number, c: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 7}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const ring = (d: string, x: number, delay: number) => `<path class="wm-ring" style="transform-origin:${x}px 84px;animation-delay:${delay}s" d="${d}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;

/** speak: a yellow podcast mic on its stand, eyes shut, singing and rocking; sound waves ripple out */
const SPEAK = `${ring('M156 62Q172 84 156 106', 150, 0)}${ring('M166 52Q188 84 166 116', 150, 0.5)}${ring('M44 62Q28 84 44 106', 50, 0.25)}
<g class="wm-sway" ${og(100, 184)}>
 <ellipse class="wm-o" cx="100" cy="178" rx="40" ry="10" fill="${SD}"/>
 <rect class="wm-o" x="93" y="138" width="14" height="40" rx="4" fill="${SD}"/>
 ${tube('M56 90Q56 146 100 146Q144 146 144 90', 6, SD)}
 <rect class="wm-o" x="64" y="22" width="72" height="114" rx="32" fill="${Y}"/>
 <rect x="112" y="30" width="18" height="98" rx="9" fill="${YD}" opacity=".35"/>
 <path d="M70 58Q70 30 100 30Q130 30 130 58V64H70Z" fill="${YD}" opacity=".4"/>
 <path d="M77 42h46M73 53h54" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".4"/>
 <path d="M74 76Q74 60 84 52" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
 <circle class="wm-o" cx="57" cy="90" r="7" fill="${W}"/><circle class="wm-o" cx="143" cy="90" r="7" fill="${W}"/>
 ${happy(87, 86)}${happy(113, 86)}${cheeks(78, 122, 98)}
 <ellipse class="wm-o" cx="100" cy="106" rx="7.5" ry="9" fill="${MOUTH}" stroke-width="3.5"/>
</g>`;

/** listen: the Englitch cloud wearing yellow headphones, nodding to the beat; notes float up */
const CLOUD = '<circle cx="70" cy="108" r="30"/><circle cx="100" cy="90" r="38"/><circle cx="132" cy="106" r="30"/><circle cx="100" cy="122" r="30"/><circle cx="58" cy="128" r="20"/><circle cx="144" cy="128" r="20"/>';
const LISTEN = `${note(168, 64, 0, Y)}${note(34, 74, 1.2, PK)}${note(160, 34, 0.6, '#fff')}
<g class="wm-nod" ${og(100, 150)}>
 <g fill="none" stroke="${INK}" stroke-width="9">${CLOUD}</g><g fill="#fff">${CLOUD}</g>
 <ellipse cx="100" cy="140" rx="46" ry="8" fill="#DCE9FF"/>
 ${happy(86, 102)}${happy(114, 102)}${cheeks(76, 124, 114)}
 <path d="M92 114Q100 122 108 114" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
 ${tube('M48 100Q48 30 100 30Q152 30 152 100', 7, BLD)}
 <rect class="wm-o" x="34" y="86" width="26" height="44" rx="11" fill="${Y}"/><rect class="wm-o" x="140" y="86" width="26" height="44" rx="11" fill="${Y}"/>
 <rect x="38" y="92" width="7" height="30" rx="3.5" fill="#fff" opacity=".6"/><rect x="144" y="92" width="7" height="30" rx="3.5" fill="#fff" opacity=".6"/>
</g>`;

/** read: an open mint book wearing glasses, eyes scanning the lines while a page flips over */
const READ = `<g class="wm-hop" ${og(100, 184)}>
 ${arm('M86 156L84 172M114 156L116 172')}${shoes(Y, 176, 80, 120)}
 ${arm('M28 112Q14 124 18 140')}${hand(18, 144)}
 <g class="wm-wave wm-rev" ${og(172, 108)}>${arm('M172 108Q188 96 186 78')}${hand(186, 72)}</g>
 <path class="wm-o" d="M22 56L100 74L178 56L178 152L100 170L22 152Z" fill="${MTD}"/>
 <path class="wm-o" d="M30 54Q66 46 100 66L100 160Q66 140 30 146Z" fill="#fff"/>
 <path class="wm-o" d="M170 54Q134 46 100 66L100 160Q134 140 170 146Z" fill="#fff"/>
 <path d="M40 72q24-6 48 6M40 132q24-6 48 6M112 132q24-12 48-6" stroke="${SD}" stroke-width="4" stroke-linecap="round" fill="none"/>
 <g class="wm-flip" ${og(100, 110)}><path class="wm-o" d="M100 66Q134 46 166 58L166 146Q134 140 100 160Z" fill="${CR}"/><path d="M112 80q24-12 46-8M112 92q24-12 46-8" stroke="${SD}" stroke-width="4" stroke-linecap="round" fill="none"/></g>
 <circle cx="78" cy="104" r="17" fill="#E9F5FF" opacity=".9"/><circle cx="122" cy="104" r="17" fill="#E9F5FF" opacity=".9"/>
 <g class="wm-blink" ${og(78, 104)}><g class="wm-look"><circle cx="78" cy="106" r="7" fill="${INK}"/><circle cx="76" cy="103" r="2.4" fill="#fff"/></g></g>
 <g class="wm-blink" ${og(122, 104)}><g class="wm-look"><circle cx="122" cy="106" r="7" fill="${INK}"/><circle cx="120" cy="103" r="2.4" fill="#fff"/></g></g>
 <g fill="none" stroke="${INK}" stroke-width="6"><circle cx="78" cy="104" r="17"/><circle cx="122" cy="104" r="17"/><path d="M95 102Q100 96 105 102"/></g>
 ${cheeks(66, 134, 126)}<path d="M92 128Q100 136 108 128" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
</g>`;

/** write: a pencil wiggling as it writes on a lavender notebook; the ink line draws itself */
const PENCIL = `<g transform="translate(104 24)"><rect class="wm-o" x="-20" y="-4" width="40" height="18" rx="8" fill="${PK}"/><rect class="wm-o" x="-20" y="10" width="40" height="12" fill="${SD}"/><rect class="wm-o" x="-20" y="22" width="40" height="92" fill="${Y}"/><rect x="8" y="24" width="10" height="88" fill="${YD}" opacity=".45"/><rect x="-14" y="24" width="5" height="88" fill="#fff" opacity=".55"/><path class="wm-o" d="M-20 114L0 146L20 114Z" fill="#F6D2A2"/><path d="M-7 135L0 146L7 135Z" fill="${INK}"/></g>`;
const WRITE = `<path class="wm-o" d="M16 152L150 140L186 172L46 186Z" fill="${LV}"/>
<path d="M28 152L146 142L174 168L48 180Z" fill="#fff"/>
<path d="M48 160L150 151M56 170L160 161" stroke="${SD}" stroke-width="3" stroke-linecap="round"/>
<path class="wm-draw" d="M62 172q7-14 14 0t14 0t14 0t14 0t14 0" fill="none" stroke="${BLD}" stroke-width="4" stroke-linecap="round"/>
<g class="wm-scrib" ${og(104, 168)}><g transform="rotate(14 104 168)">
 ${PENCIL}
 <g class="wm-wave" ${og(84, 92)}>${arm('M84 92Q62 86 58 66')}${hand(58, 60)}</g>
 ${arm('M124 96Q138 108 132 124')}${hand(132, 128)}
 ${eye(95, 68)}${eye(113, 68)}${cheeks(88, 120, 82)}
 <path class="wm-o" d="M96 80Q104 94 112 80Z" fill="${MOUTH}" stroke-width="3"/>
</g></g>`;

const ART: Partial<Record<Route, string>> = { speak: SPEAK, listen: LISTEN, read: READ, write: WRITE };

export const hasMascot = (r: Route) => r in ART;

export function WipeMascot({ route }: { route: Route }) {
  return <svg className="wipe-mascot" viewBox="0 0 200 200" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[route] ?? '' }} />;
}
