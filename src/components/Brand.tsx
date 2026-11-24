const LOGO = './brand/englitch-720.webp';

/** The Englitch mark: app icon plus the "Eng" (white) + "litch" (sun yellow) wordmark with navy outline, as in the logo. */
export function Brand({ size = 'md', showIcon = true }: { size?: 'sm' | 'md' | 'lg'; showIcon?: boolean }) {
  return (
    <span className={'brandmark brandmark-' + size}>
      {showIcon ? <img className="brandmark-icon" src={LOGO} alt="" width={128} height={128} decoding="async" /> : null}
      <span className="wordmark" aria-label="Englitch">
        <span className="wm-eng" aria-hidden="true">Eng</span>
        <span className="wm-litch" aria-hidden="true">litch</span>
      </span>
    </span>
  );
}

export const LOGO_URL = LOGO;
