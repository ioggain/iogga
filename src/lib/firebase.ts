// Conexión de iogga con Firebase (login, base de datos y canjes QR).
// Si no hay claves de Firebase configuradas (.env), la app funciona en "modo demo"
// guardando los datos solo en este dispositivo.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
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
  getDocs,
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
  // Dominio limpio: Google muestra "iogga.com" en el login. Requiere tener
  // registrado https://iogga.com/__/auth/handler como URI de redirección en el
  // Web client de Google Cloud (ya hecho). Para volver atrás, poner de nuevo
  // 'iogga-b932b.firebaseapp.com' en VITE_FIREBASE_AUTH_DOMAIN.
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'iogga.com',
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
      nameLower: name.trim().toLowerCase(),
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
  const name = cred.user.displayName || email.split('@')[0];
  // Asegurar que el usuario exista en /users con nameLower (para aparecer
  // en "Agregar amigos" aunque se haya registrado antes de este campo).
  if (db) {
    void setDoc(doc(db, 'users', cred.user.uid), {
      name,
      nameLower: name.trim().toLowerCase(),
      email: cred.user.email || email,
    }, { merge: true }).catch(() => {});
  }
  return {
    uid: cred.user.uid,
    name,
    email: cred.user.email || email,
  };
}

// Enviar correo para restablecer la contraseña.
export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('demo');
  await sendPasswordResetEmail(auth, email);
}

// En móvil los popups suelen bloquearse; ahí conviene redirigir.
function preferRedirect(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
  return isMobile || isStandalone;
}

// Al volver de un login por redirección de Google, terminar de crear el perfil.
export async function completeGoogleRedirect(): Promise<AuthUser | null> {
  if (!auth || !db) return null;
  try {
    const res = await getRedirectResult(auth);
    if (!res?.user) return null;
    const user: AuthUser = {
      uid: res.user.uid,
      name: res.user.displayName || res.user.email?.split('@')[0] || 'Usuario',
      email: res.user.email || '',
    };
    await setDoc(doc(db, 'users', user.uid), { name: user.name, nameLower: user.name.trim().toLowerCase(), email: user.email, photoURL: res.user.photoURL || null, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    return user;
  } catch {
    return null;
  }
}

export async function loginWithGoogle(): Promise<AuthUser> {
  if (!auth || !db) throw new Error('demo');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Móvil / app instalada: redirección (los popups fallan). Se completa al volver.
  if (preferRedirect()) {
    if (auth.currentUser?.isAnonymous) {
      try { await linkWithRedirect(auth.currentUser, provider); } catch { await signInWithRedirect(auth, provider); }
    } else {
      await signInWithRedirect(auth, provider);
    }
    // El navegador se va a Google y regresa; el resultado se recoge en completeGoogleRedirect.
    return new Promise(() => {});
  }

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
      } else if (code.includes('popup-blocked') || code.includes('operation-not-supported') || code.includes('cancelled-popup')) {
        await signInWithRedirect(auth, provider);
        return new Promise(() => {});
      } else {
        throw err;
      }
    }
  } else {
    try {
      cred = await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code.includes('popup-blocked') || code.includes('operation-not-supported') || code.includes('cancelled-popup')) {
        await signInWithRedirect(auth, provider);
        return new Promise(() => {});
      }
      throw err;
    }
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
      { name: user.name, nameLower: user.name.trim().toLowerCase(), email: user.email, photoURL: cred.user.photoURL || null, updatedAt: serverTimestamp() },
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
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface UserProfile {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  photoURL?: string | null;
  photos?: string[]; // hasta 3 fotos extra para conocerse mejor en planes públicos
  whatsapp?: string; // para el botón "Hablar por WhatsApp" al hacer match
  instagram?: string; // usuario de Instagram (sin @)
  website?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
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
  // nameLower permite buscar usuarios por nombre para agregarlos como amigos
  const extra = data.name ? { nameLower: data.name.trim().toLowerCase() } : {};
  await setDoc(doc(db, 'users', uid), { ...sanitize(data), ...extra, updatedAt: serverTimestamp() }, { merge: true });
  if (auth?.currentUser && data.name) {
    await updateProfile(auth.currentUser, { displayName: data.name }).catch(() => {});
  }
}

// ---------- Amigos: modelo de seguir (como Instagram/TikTok) ----------

export interface Friend {
  uid: string;
  name: string;
  photo?: string | null;
}

// TODOS los usuarios registrados (para la lista "Agregar amigos").
// Sin orderBy: así nadie queda fuera aunque le falte algún campo.
export async function listUsers(myUid: string): Promise<Friend[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(150)));
    return snap.docs
      .filter((d) => d.id !== myUid)
      .map((d) => {
        const x = d.data() as any;
        return { uid: d.id, name: x.name || (x.email ? String(x.email).split('@')[0] : 'Usuario'), photo: x.photoURL || null };
      });
  } catch {
    return [];
  }
}

// Buscar usuarios por nombre (prefijo) para agregarlos
export async function searchUsers(term: string, myUid: string): Promise<Friend[]> {
  if (!db || term.trim().length < 2) return [];
  const q0 = term.trim().toLowerCase();
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('nameLower'),
      where('nameLower', '>=', q0),
      where('nameLower', '<=', q0 + String.fromCharCode(0xf8ff)),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => d.id !== myUid)
      .map((d) => ({ uid: d.id, name: (d.data() as any).name || 'Usuario', photo: (d.data() as any).photoURL || null }));
  } catch {
    return [];
  }
}

function followId(a: string, b: string) {
  return `${a}_${b}`;
}

export async function followUser(me: AuthUser, target: Friend): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'follows', followId(me.uid, target.uid)), {
    follower: me.uid,
    followerName: me.name,
    following: target.uid,
    followingName: target.name,
    followingPhoto: target.photo || null,
    createdAt: serverTimestamp(),
  });
}

export async function unfollowUser(myUid: string, targetUid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'follows', followId(myUid, targetUid))).catch(() => {});
}

// A quién sigo (mis "amigos" para invitar), en tiempo real
export function watchFollowing(uid: string, callback: (friends: Friend[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'follows'), where('follower', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => {
      const x = d.data() as any;
      return { uid: x.following, name: x.followingName || 'Usuario', photo: x.followingPhoto || null };
    })),
    () => callback([])
  );
}

// Quién me sigue (mis seguidores)
export function watchFollowers(uid: string, callback: (friends: Friend[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'follows'), where('following', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => {
      const x = d.data() as any;
      return { uid: x.follower, name: x.followerName || 'Usuario', photo: null };
    })),
    () => callback([])
  );
}

// ---------- Notificaciones reales dentro de la app ----------

export interface AppNotif {
  id: string;
  type: 'invite' | 'accepted' | 'system';
  to: string;
  fromName: string;
  title: string;
  message: string;
  planId?: string;
  read: boolean;
  createdAtMs: number;
}

// Enviar una notificación a un amigo (p. ej. al invitarlo a un plan)
export async function sendNotification(n: Omit<AppNotif, 'id' | 'read' | 'createdAtMs'>): Promise<void> {
  if (!db) return;
  await setDoc(doc(collection(db, 'notifications')), {
    ...sanitize(n),
    read: false,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  }).catch(() => {});
}

// Mis notificaciones en tiempo real (para el iconito de campana)
export function watchNotifications(uid: string, callback: (items: AppNotif[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'notifications'), where('to', '==', uid), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ ...(d.data() as AppNotif), id: d.id }));
      items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      callback(items);
    },
    () => callback([])
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
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
  try {
    await deleteDoc(doc(db, name, id));
  } catch {
    // Si las reglas no dejan borrar (p. ej. se publicó con otra sesión anónima),
    // lo marcamos como borrado y las vistas lo ocultan igual.
    await updateDoc(doc(db, name, id), { deleted: true }).catch(() => {});
  }
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

// ---- Calificaciones (modelo tipo Uber: promedio bayesiano, justo con pocos votos) ----
// Se guardan sum y count en el doc del usuario; el promedio visible se pondera
// con un "prior" para que 1 mala calificación temprana no te hunda.
export const RATING_PRIOR_MEAN = 4.7; // arranque amable
export const RATING_PRIOR_WEIGHT = 5; // equivale a 5 votos "prior"
export function bayesianRating(sum = 0, count = 0): number {
  return (RATING_PRIOR_MEAN * RATING_PRIOR_WEIGHT + sum) / (RATING_PRIOR_WEIGHT + count);
}
// Sumar una calificación (1..5) a un usuario.
export async function rateUser(uid: string, stars: number): Promise<void> {
  if (!db || !uid) return;
  const s = Math.max(1, Math.min(5, Math.round(stars)));
  await setDoc(doc(db, 'users', uid), { ratingSum: increment(s), ratingCount: increment(1) }, { merge: true }).catch(() => {});
}
// Leer sum/count de un usuario para mostrar su estrella.
export async function fetchUserRating(uid: string): Promise<{ sum: number; count: number }> {
  if (!db || !uid) return { sum: 0, count: 0 };
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const x = (snap.data() as any) || {};
    return { sum: x.ratingSum || 0, count: x.ratingCount || 0 };
  } catch { return { sum: 0, count: 0 }; }
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
    // El cliente bajó el QR: cuenta como "QR bajado" en las analíticas.
    await updateDoc(doc(db, 'promos', promo.id), { qrScans: increment(1) }).catch(() => {});
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
      // Reflejar el canje: solo cuenta como "canjeado" (el "QR bajado" ya se contó al generarlo).
      await updateDoc(doc(db, 'promos', redemption.promoId), {
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
