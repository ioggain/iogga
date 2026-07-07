// Conexión de IOGGA con Firebase (login, base de datos y canjes QR).
// Si no hay claves de Firebase configuradas (.env), la app funciona en "modo demo"
// guardando los datos solo en este dispositivo.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

// Configuración del proyecto Firebase "iogga". Estas claves web son públicas
// por diseño (la seguridad real está en las reglas de Firestore).
// Se pueden sobreescribir con variables VITE_FIREBASE_* en un archivo .env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBbloSdceYuypqjrakX7c3pKJXu2aVr3Qc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'iogga-b932b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'iogga-b932b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'iogga-b932b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '371002889074',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:371002889074:web:359c44e475906963eb03eb',
};

export const isFirebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
}

export function watchAuth(callback: (user: AuthUser | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
      });
    } else {
      callback(null);
    }
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthUser> {
  if (!auth || !db) throw new Error('demo');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  // Guardar el perfil no debe impedir el registro si las reglas aún no están publicadas
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      createdAt: serverTimestamp(),
    });
  } catch {
    // el perfil se puede volver a guardar después
  }
  return { uid: cred.user.uid, name, email };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  if (!auth) throw new Error('demo');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return {
    uid: cred.user.uid,
    name: cred.user.displayName || email.split('@')[0],
    email: cred.user.email || email,
  };
}

export async function loginWithGoogle(): Promise<AuthUser> {
  if (!auth || !db) throw new Error('demo');
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  const user: AuthUser = {
    uid: cred.user.uid,
    name: cred.user.displayName || cred.user.email?.split('@')[0] || 'Usuario',
    email: cred.user.email || '',
  };
  // Crear/actualizar su perfil sin bloquear el acceso si falla
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      { name: user.name, email: user.email, photoURL: cred.user.photoURL || null, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch {
    // se reintenta después
  }
  return user;
}

export function logoutUser(): void {
  if (auth) void signOut(auth);
}

// ---------- Perfil del usuario (para el medidor "completa tu perfil") ----------

export interface UserProfile {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  photoURL?: string | null;
  whatsapp?: string; // para el botón "Hablar por WhatsApp" al hacer match
}

export function watchProfile(uid: string, callback: (profile: UserProfile) => void): () => void {
  if (!db) return () => {};
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => callback((snap.data() as UserProfile) || {}),
    () => callback({})
  );
}

export async function saveProfile(uid: string, data: UserProfile): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), { ...sanitize(data), updatedAt: serverTimestamp() }, { merge: true });
  if (auth?.currentUser && data.name) {
    await updateProfile(auth.currentUser, { displayName: data.name }).catch(() => {});
  }
}

// ---------- Planes y promociones en tiempo real (la app inicia en blanco) ----------

// Firestore no acepta valores undefined: los quitamos antes de guardar
function sanitize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function watchCollectionDocs<T>(name: 'plans' | 'promos', callback: (items: T[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, name), orderBy('timestamp', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }))),
    () => callback([]) // sin permisos o sin conexión: lista vacía, la app sigue funcionando
  );
}

export async function saveDocIn(name: 'plans' | 'promos', id: string, data: object): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, name, id), sanitize(data), { merge: true });
}

export async function deleteDocIn(name: 'plans' | 'promos', id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, name, id));
}

export async function incrementPlanAccepted(planId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'plans', planId), { acceptedCount: increment(1) }).catch(() => {});
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (code.includes('email-already-in-use')) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
  if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code.includes('invalid-email')) return 'El correo no es válido.';
  if (code.includes('too-many-requests')) return 'Demasiados intentos. Espera un momento.';
  if (code.includes('network')) return 'Sin conexión. Revisa tu internet.';
  return 'Ocurrió un error. Intenta de nuevo.';
}

// ---------- Canjes con código QR (cliente <-> negocio) ----------

export interface Redemption {
  code: string;
  promoId: string;
  promoTitle: string;
  businessName: string;
  businessUid?: string | null; // dueño de la promo: solo él puede validar
  priceAmount: number; // monto de la promo (para analíticas y futuros pagos)
  userName: string;
  uid?: string | null;
  status: 'pending' | 'redeemed';
  createdAtMs: number; // para expiración (24 horas)
}

// Convierte "$120", "$1,250.50 MXN", "120 pesos" -> 120 / 1250.5
export function parsePrice(price: string | undefined): number {
  if (!price) return 0;
  const clean = price.replace(/[^0-9.]/g, '');
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

const REDEMPTION_TTL_MS = 24 * 60 * 60 * 1000; // los códigos duran 24 horas

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres confusos (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const DEMO_KEY = 'iogga_demo_redemptions';

function demoRead(): Record<string, Redemption> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) || '{}');
  } catch {
    return {};
  }
}

function demoWrite(data: Record<string, Redemption>): void {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}

export async function createRedemption(
  promo: { id: string; title: string; businessName: string; uid?: string | null; price?: string },
  user: AuthUser | null
): Promise<Redemption> {
  const redemption: Redemption = {
    code: generateCode(),
    promoId: promo.id,
    promoTitle: promo.title,
    businessName: promo.businessName,
    businessUid: promo.uid || null,
    priceAmount: parsePrice(promo.price),
    userName: user?.name || 'Invitado',
    uid: user?.uid || null,
    status: 'pending',
    createdAtMs: Date.now(),
  };
  if (db) {
    await setDoc(doc(db, 'redemptions', redemption.code), {
      ...redemption,
      createdAt: serverTimestamp(),
    });
  } else {
    const data = demoRead();
    data[redemption.code] = redemption;
    demoWrite(data);
  }
  return redemption;
}

export type ValidationResult =
  | { ok: true; redemption: Redemption }
  | {
      ok: false;
      reason: 'not-found' | 'already-used' | 'expired' | 'wrong-business' | 'error';
      redemption?: Redemption;
    };

function checkRedemption(redemption: Redemption, validatorUid?: string | null): ValidationResult | null {
  if (redemption.status === 'redeemed') return { ok: false, reason: 'already-used', redemption };
  if (redemption.createdAtMs && Date.now() - redemption.createdAtMs > REDEMPTION_TTL_MS) {
    return { ok: false, reason: 'expired', redemption };
  }
  // El código solo lo puede validar el negocio dueño de la promoción
  if (redemption.businessUid && validatorUid && redemption.businessUid !== validatorUid) {
    return { ok: false, reason: 'wrong-business', redemption };
  }
  return null; // válido
}

export async function validateRedemption(rawCode: string, validatorUid?: string | null): Promise<ValidationResult> {
  const code = rawCode.trim().toUpperCase().replace(/^IOGGA:/, '');
  if (!code) return { ok: false, reason: 'not-found' };

  if (db) {
    try {
      const ref = doc(db, 'redemptions', code);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { ok: false, reason: 'not-found' };
      const redemption = snap.data() as Redemption;
      const problem = checkRedemption(redemption, validatorUid);
      if (problem) return problem;
      await updateDoc(ref, { status: 'redeemed', redeemedAt: serverTimestamp(), redeemedBy: validatorUid || null });
      // Reflejar el canje en las analíticas reales de la promoción
      await updateDoc(doc(db, 'promos', redemption.promoId), {
        qrScans: increment(1),
        salesCount: increment(1),
        totalEarnings: increment(redemption.priceAmount || 0),
      }).catch(() => {});
      return { ok: true, redemption: { ...redemption, status: 'redeemed' } };
    } catch {
      return { ok: false, reason: 'error' };
    }
  }

  const data = demoRead();
  const redemption = data[code];
  if (!redemption) return { ok: false, reason: 'not-found' };
  const problem = checkRedemption(redemption, validatorUid);
  if (problem) return problem;
  redemption.status = 'redeemed';
  demoWrite(data);
  return { ok: true, redemption };
}
