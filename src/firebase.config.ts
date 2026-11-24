/**
 * Firebase web app settings (Firebase console → Project settings → Your apps → Web app → SDK setup).
 * These values identify the project; they are not secrets — access is controlled by
 * Firebase Authentication and the rules in firestore.rules.
 *
 * Leave apiKey empty to run the site without accounts (progress stays on each device).
 */
export function isLocalhost(): boolean {
  return typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
}

export const firebaseConfig = {
  apiKey: 'AIzaSyBB8zOGSBIiPp5zFAG0QmbUQwuEOdi_BFQ',
  // Live site: its own host, so Google sign-in stays same-origin (/__/auth/* is proxied to Firebase by
  // functions/_middleware.ts). Localhost (plain http) uses Firebase's own domain with a popup window instead.
  authDomain: isLocalhost() ? 'englitch-da50c.firebaseapp.com' : (typeof window !== 'undefined' ? window.location.host : 'englitch.pages.dev'),
  projectId: 'englitch-da50c',
  storageBucket: 'englitch-da50c.firebasestorage.app',
  messagingSenderId: '662219245733',
  appId: '1:662219245733:web:f714a0b1dbdbfb8215254c',
};

export const firebaseEnabled = firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;
