/**
 * Firebase web app settings (Firebase console → Project settings → Your apps → Web app → SDK setup).
 * These values identify the project; they are not secrets — access is controlled by
 * Firebase Authentication and the rules in firestore.rules.
 *
 * Leave apiKey empty to run the site without accounts (progress stays on each device).
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const firebaseEnabled = firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;
