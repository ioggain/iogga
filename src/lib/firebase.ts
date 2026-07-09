// Conexión de iogga con Firebase (login, base de datos y canjes QR).
// Si no hay claves de Firebase configuradas (.env), la app funciona en "modo demo"
// guardando los datos solo en este dispositivo.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
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
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
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
  isAnonymous?: boolean; // invitado con sesión silenciosa: puede publicar, no ver datos premium
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
        name: user.displayName || user.email?.split('@')[0] || 'Invitado',
        email: user.email || '',
        isAnonymous: user.isAnonymous,
      });
    } else {
      callback(null);
    }
  });
}

// Sesión silenciosa: permite publicar y compartir sin registrarse.
// (Requiere habilitar "Anónimo" en Firebase Authentication.)
export async function ensureAnonSession(): Promise<AuthUser | null> {
  if (!auth) return null;
  if (auth.currentUser) {
    const u = auth.currentUser;
    return { uid: u.uid, name: u.displayName || 'Invitado', email: u.email || '', isAnonymous: u.isAnonymous };
  }
  try {
    const cred = await signInAnonymously(auth);
    return { uid: cred.user.uid, name: 'Invitado', email: '', isAnonymous: true };
  } catch {
    return null; // proveedor anónimo no habilitado: se pedirá login normal
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthUser> {
  if (!auth || !db) throw new Error('demo');
  // Si venía como invitado anónimo, VINCULAMOS la cuenta en lugar de crear otra:
  // así conserva sus planes, su negocio y todo lo que ya hizo.
  const cred = auth.currentUser?.isAnonymous
    ? await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))
    : await createUserWithEmailAndPassword(auth, email, password);
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
  const provider = new GoogleAuthProvider();
  let cred;
  if (auth.currentUser?.isAnonymous) {
    // Invitado anónimo: vincular su cuenta de Google conservando todos sus datos
    try {
      cred = await linkWithPopup(auth.currentUser, provider);
    } catch (err) {
      // Ese Google ya tiene cuenta en IOGGA: iniciar sesión normal con ella
      const code = (err as { code?: string })?.code || '';
      if (code.includes('credential-already-in-use') || code.includes('email-already-in-use')) {
        cred = await signInWithPopup(auth, provider);
      } else {
        throw err;
      }
    }
  } else {
    cred = await signInWithPopup(auth, provider);
  }
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

export interface BusinessProfile {
  name?: string;
  bio?: string;
  logo?: string;
  cover?: string;
  location?: string;
  phone?: string;
  email?: string;
}

export interface UserProfile {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  photoURL?: string | null;
  whatsapp?: string; // para el botón "Hablar por WhatsApp" al hacer match
  instagram?: string; // usuario de Instagram (sin @)
  business?: BusinessProfile; // perfil de negocio del usuario (mismo modelo que Facebook: una cuenta, dos caras)
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

// Para abrir invitaciones desde un link compartido (iogga.com/?inv=ID)
export async function fetchDocIn<T>(name: 'plans' | 'promos', id: string): Promise<T | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, name, id));
    return snap.exists() ? ({ ...(snap.data() as T), id } as T) : null;
  } catch {
    return null;
  }
}

export async function incrementPlanAccepted(planId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'plans', planId), { acceptedCount: increment(1) }).catch(() => {});
}

// Registrar QUIÉN aceptó el plan (nombre y foto) para mostrarlo al creador
export async function acceptPlanAs(planId: string, user: AuthUser, photoURL?: string | null): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'plans', planId), {
    acceptedCount: increment(1),
    acceptedBy: arrayUnion({ uid: user.uid, name: user.name, photo: photoURL || null }),
  }).catch(() => {});
}

// Guardar el perfil de negocio dentro del documento del usuario
export async function saveBusinessProfile(uid: string, business: BusinessProfile): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), { business: sanitize(business), updatedAt: serverTimestamp() }, { merge: true });
}

// Guardar sugerencias/ideas del usuario (se ven luego en el panel de administración)
export async function saveFeedback(text: string, context: string, user: AuthUser | null): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(collection(db, 'feedback')), {
      text,
      context, // qué botón/pantalla la originó
      uid: user?.uid || null,
      userName: user?.name || 'Anónimo',
      email: user?.email || '',
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });
    return true;
  } catch {
    return false;
  }
}

// Canjes del negocio en tiempo real (para la gráfica de ventas REAL)
export function watchMyRedemptions(businessUid: string, callback: (items: Redemption[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'redemptions'), where('businessUid', '==', businessUid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as Redemption)),
    () => callback([])
  );
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
  redeemedAtMs?: number; // para la gráfica de ventas por día
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
      await updateDoc(ref, { status: 'redeemed', redeemedAt: serverTimestamp(), redeemedAtMs: Date.now(), redeemedBy: validatorUid || null });
      // Reflejar el canje en las analíticas reales de la promoción
      await updateDoc(doc(db, 'promos', redemption.promoId), {
        qrScans: increment(1),
        salesCount: increment(1),
        totalEarnings: increment(redemption.priceAmount || 0),
      }).catch(() => {});
      // Libro contable de IOGGA: base para pagos en la app y comisión por transacción.
      // Hoy la venta se cobra en el local (offline); cuando activemos pagos, aquí
      // se registrará el cobro y la comisión ya está calculada.
      const IOGGA_COMMISSION_RATE = 0.05;
      await setDoc(doc(db, 'ledger', code), {
        type: 'redemption',
        code,
        promoId: redemption.promoId,
        promoTitle: redemption.promoTitle,
        businessUid: redemption.businessUid || null,
        businessName: redemption.businessName,
        amount: redemption.priceAmount || 0,
        commissionRate: IOGGA_COMMISSION_RATE,
        commissionAmount: Math.round((redemption.priceAmount || 0) * IOGGA_COMMISSION_RATE * 100) / 100,
        paymentStatus: 'offline', // 'offline' hoy; 'paid_in_app' cuando activemos pagos
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
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
