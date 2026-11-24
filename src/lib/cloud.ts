/*
 * Firebase access, loaded on demand so visitors who never sign in don't download the SDK.
 *
 * Firestore layout:
 *   users/{uid}        { data: <progress JSON string>, updatedAt }   — owner only
 *   leaderboard/{uid}  { name, photo, xp, level, streak, lastActive, updatedAt } — any signed-in user reads, owner writes
 */
import { firebaseConfig, firebaseEnabled } from '../firebase.config';

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
  provider: 'google' | 'password' | 'other';
}

function toUser(u: import('firebase/auth').User): CloudUser {
  const p = u.providerData[0]?.providerId;
  return {
    uid: u.uid,
    name: u.displayName || (u.email ? u.email.split('@')[0] : 'ผู้เล่น'),
    email: u.email,
    photo: u.photoURL,
    provider: p === 'google.com' ? 'google' : p === 'password' ? 'password' : 'other',
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
  const { authMod, auth } = await sdk();
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await authMod.signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await authMod.signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
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

/* ---- Leaderboard ---- */
export interface BoardEntry { uid: string; name: string; photo: string; xp: number; level: number; streak: number; lastActive: string }

export async function saveBoard(e: BoardEntry): Promise<void> {
  const { store, db } = await sdk();
  await store.setDoc(store.doc(db, 'leaderboard', e.uid), {
    name: e.name.slice(0, 40), photo: (e.photo || '').slice(0, 500),
    xp: Math.max(0, Math.floor(e.xp)), level: Math.max(1, Math.floor(e.level)),
    streak: Math.max(0, Math.floor(e.streak)), lastActive: e.lastActive || '', updatedAt: Date.now(),
  });
}

export async function removeBoard(uid: string): Promise<void> {
  const { store, db } = await sdk();
  await store.deleteDoc(store.doc(db, 'leaderboard', uid));
}

export function watchBoard(cb: (rows: BoardEntry[]) => void, onError: () => void, max = 20): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;
  sdk().then(({ store, db }) => {
    if (cancelled) return;
    const q = store.query(store.collection(db, 'leaderboard'), store.orderBy('xp', 'desc'), store.limit(max));
    stop = store.onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => {
        const v = d.data();
        return {
          uid: d.id, name: String(v.name || 'ผู้เล่น'), photo: String(v.photo || ''),
          xp: Number(v.xp) || 0, level: Number(v.level) || 1, streak: Number(v.streak) || 0, lastActive: String(v.lastActive || ''),
        };
      }));
    }, onError);
  }).catch(onError);
  return () => { cancelled = true; stop?.(); };
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
    'auth/unauthorized-domain': 'เว็บนี้ยังไม่ได้รับอนุญาตใน Firebase (ต้องเพิ่มโดเมนใน Authorized domains)',
    'auth/operation-not-allowed': 'วิธีล็อกอินนี้ยังไม่ได้เปิดใช้ใน Firebase',
  };
  if (code.startsWith('auth/api-key') || code === 'auth/invalid-api-key') return 'ระบบบัญชีตั้งค่าไม่ถูกต้อง (Firebase API key) แจ้งเจ้าของเว็บ';
  return map[code] || 'ล็อกอินไม่สำเร็จ ลองใหม่อีกครั้ง';
}
