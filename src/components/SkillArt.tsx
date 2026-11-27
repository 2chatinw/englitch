import { useId } from 'react';

export type Skill = 'listen' | 'speak' | 'read' | 'write';

/**
 * Small shaded pictures for the four skills (headphones, microphone, open book, pencil), drawn as SVG with
 * gradients and highlights so they read as little 3D objects on the coloured skill orbs, not flat line icons.
 */
export function SkillArt({ kind, size = 48 }: { kind: Skill; size?: number }) {
  const u = useId().replace(/:/g, '');
  const id = (n: string) => u + n;
  const url = (n: string) => `url(#${u}${n})`;
  return (
    <svg className="skill-art" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <filter id={id('sh')} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#0B1A40" floodOpacity=".35" />
        </filter>
        {kind === 'listen' ? (
          <>
            <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A5C94" /><stop offset="1" stopColor="#1C2A55" /></linearGradient>
            <linearGradient id={id('cup')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#C9D4EA" /></linearGradient>
            <linearGradient id={id('pad')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B4C82" /><stop offset="1" stopColor="#16224A" /></linearGradient>
          </>
        ) : kind === 'speak' ? (
          <>
            <radialGradient id={id('head')} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".55" stopColor="#D5DCEB" /><stop offset="1" stopColor="#8D99B5" /></radialGradient>
            <linearGradient id={id('body')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2E3D6E" /><stop offset=".45" stopColor="#5466A0" /><stop offset="1" stopColor="#1E2A52" /></linearGradient>
            <linearGradient id={id('ring')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFD36B" /><stop offset=".5" stopColor="#FFF1C2" /><stop offset="1" stopColor="#E2A21A" /></linearGradient>
          </>
        ) : kind === 'read' ? (
          <>
            <linearGradient id={id('cover')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F4C9E" /><stop offset="1" stopColor="#1A2C66" /></linearGradient>
            <linearGradient id={id('pl')} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#DCE3F1" /><stop offset=".25" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F4F7FD" /></linearGradient>
            <linearGradient id={id('pr')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#DCE3F1" /><stop offset=".25" stopColor="#FFFFFF" /><stop offset="1" stopColor="#EEF2FA" /></linearGradient>
            <linearGradient id={id('mark')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF6B6B" /><stop offset="1" stopColor="#D93A4A" /></linearGradient>
          </>
        ) : (
          <>
            <linearGradient id={id('wood')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE9C2" /><stop offset="1" stopColor="#E8B97A" /></linearGradient>
            <linearGradient id={id('yel')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE680" /><stop offset=".5" stopColor="#FFC53D" /><stop offset="1" stopColor="#E09A00" /></linearGradient>
            <linearGradient id={id('metal')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3F5FA" /><stop offset=".5" stopColor="#AEB8CE" /><stop offset="1" stopColor="#7C88A6" /></linearGradient>
            <linearGradient id={id('eraser')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB3C7" /><stop offset="1" stopColor="#F0708F" /></linearGradient>
          </>
        )}
      </defs>

      {kind === 'listen' ? (
        <g filter={url('sh')}>
          {/* headband */}
          <path d="M12 36V30a20 20 0 0 1 40 0v6" fill="none" stroke={url('band')} strokeWidth="6" strokeLinecap="round" />
          <path d="M16 27a16.5 16.5 0 0 1 14-12" fill="none" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
          {/* ear cups */}
          <rect x="7" y="32" width="14" height="22" rx="6" fill={url('cup')} />
          <rect x="43" y="32" width="14" height="22" rx="6" fill={url('cup')} />
          <rect x="15" y="34" width="7" height="18" rx="3.5" fill={url('pad')} />
          <rect x="42" y="34" width="7" height="18" rx="3.5" fill={url('pad')} />
          <rect x="9.5" y="35" width="3" height="10" rx="1.5" fill="#FFFFFF" opacity=".9" />
          <rect x="45.5" y="35" width="3" height="10" rx="1.5" fill="#FFFFFF" opacity=".9" />
          {/* little sound waves */}
          <path d="M28 41q4 -4 0 -8M32 44q8 -7.5 0 -14" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
        </g>
      ) : kind === 'speak' ? (
        <g filter={url('sh')}>
          {/* stand */}
          <path d="M18 31a14 14 0 0 0 28 0" fill="none" stroke="#1E2A52" strokeWidth="3.2" strokeLinecap="round" />
          <rect x="30" y="45" width="4" height="9" rx="1.5" fill="#1E2A52" />
          <ellipse cx="32" cy="55.5" rx="10" ry="3" fill="#2E3D6E" />
          {/* body */}
          <rect x="24" y="26" width="16" height="16" rx="7" fill={url('body')} />
          <rect x="22.5" y="25" width="19" height="4" rx="2" fill={url('ring')} />
          {/* mesh head */}
          <rect x="21" y="6" width="22" height="22" rx="11" fill={url('head')} />
          <path d="M23.5 13h17M22.5 17h19M22.5 21h19M23.5 25h17" stroke="#7F8BA8" strokeOpacity=".55" strokeWidth="1" />
          <ellipse cx="27" cy="11.5" rx="3" ry="2" fill="#FFFFFF" opacity=".95" />
        </g>
      ) : kind === 'read' ? (
        <g filter={url('sh')}>
          {/* cover peeking out under the pages */}
          <path d="M5 21l27 4 27-4v29l-27 5-27-5z" fill={url('cover')} />
          {/* pages */}
          <path d="M8 16c8-2 16-1 24 5v30c-8-5-16-6-24-4z" fill={url('pl')} />
          <path d="M56 16c-8-2-16-1-24 5v30c8-5 16-6 24-4z" fill={url('pr')} />
          <path d="M12 25c5-1 10-.5 15 2.5M12 30.5c5-1 10-.5 15 2.5M12 36c5-1 10-.5 15 2.5M37 27.5c5-3 10-3.5 15-2.5M37 33c5-3 10-3.5 15-2.5M37 38.5c5-3 10-3.5 15-2.5"
            fill="none" stroke="#9FB0D3" strokeWidth="1.6" strokeLinecap="round" />
          {/* bookmark ribbon */}
          <path d="M44 18.5v15l3-2.5 3 2.5V17.6z" fill={url('mark')} />
          <path d="M32 21v30" stroke="#B8C4DD" strokeWidth="1" />
        </g>
      ) : (
        <g filter={url('sh')} transform="rotate(45 32 32)">
          {/* pencil drawn upright, then tilted */}
          <path d="M26 46h12l-6 13z" fill={url('wood')} />
          <path d="M29.6 54.4h4.8L32 59z" fill="#2B3354" />
          <rect x="26" y="14" width="12" height="32" fill={url('yel')} />
          <rect x="30" y="14" width="4" height="32" fill="#FFFFFF" opacity=".28" />
          <rect x="26" y="8" width="12" height="7" fill={url('metal')} />
          <path d="M26 10.3h12M26 12.7h12" stroke="#6C7896" strokeWidth=".8" />
          <path d="M26 8V5.5A3.5 3.5 0 0 1 29.5 2h5A3.5 3.5 0 0 1 38 5.5V8z" fill={url('eraser')} />
          <rect x="28" y="3.5" width="2" height="3.5" rx="1" fill="#FFFFFF" opacity=".7" />
        </g>
      )}
    </svg>
  );
}
