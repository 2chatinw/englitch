/**
 * Firebase web app settings (Firebase console → Project settings → Your apps → Web app → SDK setup).
 * These values identify the project; they are not secrets — access is controlled by
 * Firebase Authentication and the rules in firestore.rules.
 *
 * Leave apiKey empty to run the site without accounts (progress stays on each device).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBB8zOGSBIiPp5zFAG0QmbUQwuEOdi_BFQ',
  // The site's own domain: /__/auth/* is proxied to Firebase by functions/_middleware.ts (same-origin sign-in).
  authDomain: 'englitch.pages.dev',
  projectId: 'englitch-da50c',
  storageBucket: 'englitch-da50c.firebasestorage.app',
  messagingSenderId: '662219245733',
  appId: '1:662219245733:web:f714a0b1dbdbfb8215254c',
};

export const firebaseEnabled = firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;
