// Conexión de IOGGA con Firebase (login, base de datos y canjes QR).
// Si no hay claves de Firebase configuradas (.env), la app funciona en "modo demo"
// guardando los datos solo en este dispositivo.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
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

export function logoutUser(): void {
  if (auth) void signOut(auth);
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
  userName: string;
  status: 'pending' | 'redeemed';
}

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
  promo: { id: string; title: string; businessName: string },
  user: AuthUser | null
): Promise<Redemption> {
  const redemption: Redemption = {
    code: generateCode(),
    promoId: promo.id,
    promoTitle: promo.title,
    businessName: promo.businessName,
    userName: user?.name || 'Invitado',
    status: 'pending',
  };
  if (db) {
    await setDoc(doc(db, 'redemptions', redemption.code), {
      ...redemption,
      uid: user?.uid || null,
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
  | { ok: false; reason: 'not-found' | 'already-used' | 'error'; redemption?: Redemption };

export async function validateRedemption(rawCode: string): Promise<ValidationResult> {
  const code = rawCode.trim().toUpperCase().replace(/^IOGGA:/, '');
  if (!code) return { ok: false, reason: 'not-found' };

  if (db) {
    try {
      const ref = doc(db, 'redemptions', code);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { ok: false, reason: 'not-found' };
      const redemption = snap.data() as Redemption;
      if (redemption.status === 'redeemed') return { ok: false, reason: 'already-used', redemption };
      await updateDoc(ref, { status: 'redeemed', redeemedAt: serverTimestamp() });
      return { ok: true, redemption: { ...redemption, status: 'redeemed' } };
    } catch {
      return { ok: false, reason: 'error' };
    }
  }

  const data = demoRead();
  const redemption = data[code];
  if (!redemption) return { ok: false, reason: 'not-found' };
  if (redemption.status === 'redeemed') return { ok: false, reason: 'already-used', redemption };
  redemption.status = 'redeemed';
  demoWrite(data);
  return { ok: true, redemption };
}
