const PATHS = {
  home: <path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  cards: <><rect x="7" y="3.5" width="12" height="16" rx="2" /><path d="M4 7.5v11a2 2 0 0 0 2 2h9" /></>,
  headphones: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><path d="M4 15h3.5v5.5H5.5A1.5 1.5 0 0 1 4 19zM20 15h-3.5v5.5h2A1.5 1.5 0 0 0 20 19z" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5" /></>,
  chat: <path d="M4 5.5h16v10.5H10l-5 4v-4H4z" />,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  speaker: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  slow: <><circle cx="12" cy="13" r="7.5" /><path d="M12 13V9M12 2.5v3M9 2.5h6" /></>,
  check: <path d="M5 12.5 10 17.5 19.5 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M5.5 15.5h-1a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  external: <path d="M14 4h6v6M20 4l-9 9M18.5 14v5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>,
  share: <><path d="M12 15V3.5M8 7.5l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></>,
  retry: <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.5h4.5" /></>,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
};
export type IconName = keyof typeof PATHS | 'flame';

export function Icon({ name, size }: { name: IconName; size?: number }) {
  const style = size ? { width: size, height: size } : undefined;
  if (name === 'flame') {
    return (
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={style}>
        <path fill="currentColor" d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 2 1 3 2 3.5C11 9 10.5 5.5 12 2z" />
      </svg>
    );
  }
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={style} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}
