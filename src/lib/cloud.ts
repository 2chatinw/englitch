/*
 * Firebase access, loaded on demand so visitors who never sign in don't download the SDK.
 *
 * Firestore layout:
 *   users/{uid}        { data: <progress JSON string>, updatedAt }   — owner only
 *   members/{uid}      { name, email, photo, provider, createdAt, lastSeen }     — owner only (site owner reads in the console)
 */
import { firebaseConfig, firebaseEnabled, isLocalhost } from '../firebase.config';

type AuthMod = typeof import('firebase/auth');
type StoreMod = typeof import('firebase/firestore');
interface Sdk {
  authMod: AuthMod;
  store: StoreMod;
  auth: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
}

let sdkPromise: Promise<Sdk> | null = null;
function sdk(): Promise<Sdk> {
  if (!firebaseEnabled) return Promise.reject(new Error('firebase-disabled'));
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const [{ initializeApp }, authMod, store] = await Promise.all([
        import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
      ]);
      const app = initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      auth.languageCode = 'th';
      const db = store.getFirestore(app);
      return { authMod, store, auth, db };
    })();
  }
  return sdkPromise;
}

export interface CloudUser {
  uid: string;
  name: string;
  email: string | null;
  photo: string | null;
  provider: 'google' | 'facebook' | 'discord' | 'password' | 'other';
  /** False when the account has no display name yet (name falls back to the email). */
  named: boolean;
}

function toUser(u: import('firebase/auth').User): CloudUser {
  const p = u.providerData[0]?.providerId;
  return {
    uid: u.uid,
    name: u.displayName || (u.email ? u.email.split('@')[0] : 'ผู้เล่น'),
    email: u.email,
    photo: u.photoURL,
    provider: u.uid.startsWith('discord:') ? 'discord' : p === 'google.com' ? 'google' : p === 'facebook.com' ? 'facebook' : p === 'password' ? 'password' : 'other',
    named: !!u.displayName,
  };
}

export function watchAuth(cb: (u: CloudUser | null) => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;
  sdk().then(({ authMod, auth }) => {
    if (cancelled) return;
    stop = authMod.onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null));
  }).catch(() => cb(null));
  return () => { cancelled = true; stop?.(); };
}

export async function signInGoogle(): Promise<void> {
  const { authMod } = await sdk();
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithProvider(provider);
}

/** Facebook through Firebase's built-in provider: asks only for the public profile and email. */
export async function signInFacebook(): Promise<void> {
  const { authMod } = await sdk();
  const provider = new authMod.FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  await signInWithProvider(provider);
}

async function signInWithProvider(provider: import('firebase/auth').AuthProvider): Promise<void> {
  const { authMod, auth } = await sdk();
  try {
    await authMod.signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    // Redirect sign-in can't finish on localhost (cross-site storage), so there the popup must be allowed.
    if ((code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') && !isLocalhost()) {
      await authMod.signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

/** Finish a Discord sign-in: the Cloudflare function hands back a Firebase custom token for this Discord user. */
export async function signInDiscordToken(token: string, name: string, photo: string): Promise<CloudUser> {
  const { authMod, auth } = await sdk();
  const cred = await authMod.signInWithCustomToken(auth, token);
  const patch: { displayName?: string; photoURL?: string } = {};
  if (name && cred.user.displayName !== name) patch.displayName = name.slice(0, 40);
  if (photo && cred.user.photoURL !== photo) patch.photoURL = photo;
  if (Object.keys(patch).length) await authMod.updateProfile(cred.user, patch);
  return toUser(cred.user);
}

/* ---- Member list (members/{uid}); the site owner reads it in the Firebase console ---- */
export async function recordMember(u: CloudUser, email: string | null): Promise<void> {
  const { store, db } = await sdk();
  const ref = store.doc(db, 'members', u.uid);
  const snap = await store.getDoc(ref);
  const now = Date.now();
  const base = { name: u.name.slice(0, 40), email: (email || u.email || '').slice(0, 200), photo: (u.photo || '').slice(0, 500), provider: u.provider, lastSeen: now };
  if (!snap.exists()) await store.setDoc(ref, { ...base, createdAt: now });
  else await store.setDoc(ref, { ...base, createdAt: snap.data().createdAt ?? now });
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const { authMod, auth } = await sdk();
  await authMod.signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpEmail(name: string, email: string, password: string): Promise<CloudUser> {
  const { authMod, auth } = await sdk();
  const cred = await authMod.createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await authMod.updateProfile(cred.user, { displayName: name.trim().slice(0, 40) });
  return toUser(cred.user);
}

export async function resetPassword(email: string): Promise<void> {
  const { authMod, auth } = await sdk();
  await authMod.sendPasswordResetEmail(auth, email.trim());
}

export async function renameUser(name: string): Promise<CloudUser | null> {
  const { authMod, auth } = await sdk();
  if (!auth.currentUser) return null;
  await authMod.updateProfile(auth.currentUser, { displayName: name.trim().slice(0, 40) });
  return toUser(auth.currentUser);
}

/** Deletes this member for good: progress, member entry, then the sign-in account itself. */
export async function deleteAccount(): Promise<void> {
  const { authMod, store, auth, db } = await sdk();
  const u = auth.currentUser;
  if (!u) return;
  await store.deleteDoc(store.doc(db, 'users', u.uid));
  await store.deleteDoc(store.doc(db, 'members', u.uid));
  await authMod.deleteUser(u);
}

export async function signOutUser(): Promise<void> {
  const { authMod, auth } = await sdk();
  await authMod.signOut(auth);
}

/* ---- Progress ---- */
export function watchProgress(uid: string, cb: (json: string | null) => void, onError: () => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;
  sdk().then(({ store, db }) => {
    if (cancelled) return;
    stop = store.onSnapshot(store.doc(db, 'users', uid), (snap) => {
      const d = snap.data();
      cb(d && typeof d.data === 'string' ? d.data : null);
    }, onError);
  }).catch(onError);
  return () => { cancelled = true; stop?.(); };
}

export async function saveProgress(uid: string, json: string, updatedAt: number): Promise<void> {
  const { store, db } = await sdk();
  await store.setDoc(store.doc(db, 'users', uid), { data: json, updatedAt });
}

export function authErrorText(e: unknown): string {
  const code = (e as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'auth/missing-password': 'กรอกรหัสผ่านก่อน',
    'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน',
    'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    'auth/wrong-password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    'auth/user-not-found': 'ไม่พบบัญชีนี้ ลองสมัครใหม่',
    'auth/too-many-requests': 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่',
    'auth/popup-closed-by-user': 'ปิดหน้าต่างล็อกอินก่อนเสร็จ ลองใหม่อีกครั้ง',
    'auth/cancelled-popup-request': 'ปิดหน้าต่างล็อกอินก่อนเสร็จ ลองใหม่อีกครั้ง',
    'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้ง',
    'auth/popup-blocked': 'เบราว์เซอร์บล็อกหน้าต่างล็อกอิน กดอนุญาตป๊อปอัปให้เว็บนี้แล้วลองใหม่',
    'auth/unauthorized-domain': 'เว็บนี้ยังไม่ได้รับอนุญาตใน Firebase (ต้องเพิ่มโดเมนใน Authorized domains)',
    'auth/operation-not-allowed': 'วิธีล็อกอินนี้ยังไม่ได้เปิดใช้ใน Firebase',
    'auth/requires-recent-login': 'ลบข้อมูลความคืบหน้าแล้ว แต่ต้องออกจากระบบแล้วเข้าใหม่ก่อน จึงจะลบบัญชีได้ แล้วกดลบบัญชีอีกครั้ง',
    'auth/account-exists-with-different-credential': 'อีเมลนี้มีบัญชีที่เข้าสู่ระบบด้วยวิธีอื่นอยู่แล้ว (เช่น Google) ใช้วิธีเดิมเข้าสู่ระบบแทน',
  };
  if (code.startsWith('auth/api-key') || code === 'auth/invalid-api-key') return 'ระบบบัญชีตั้งค่าไม่ถูกต้อง (Firebase API key) แจ้งเจ้าของเว็บ';
  return map[code] || 'ล็อกอินไม่สำเร็จ ลองใหม่อีกครั้ง';
}
