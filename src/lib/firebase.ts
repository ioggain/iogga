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
  signInWithCredential,
  getRedirectResult,
  signInAnonymously,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  EmailAuthProvider,
  GoogleAuthProvider,
  signOut,
  deleteUser,
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
import { getMessaging, getToken, isSupported as pushSupported } from 'firebase/messaging';

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
  // Mantener la sesión SIEMPRE, aunque el usuario cierre y reabra o navegue mucho.
  // IndexedDB primero (sobrevive mejor en móvil/PWA) y localStorage de respaldo.
  void setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    if (auth) void setPersistence(auth, browserLocalPersistence).catch(() => {});
  });
}

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  isAnonymous?: boolean; // invitado con sesión silenciosa: puede publicar, no ver datos premium
}

// ---------- Notificaciones PUSH (con la app cerrada) ----------
// Clave PÚBLICA de push web (certificado de Cloud Messaging). Es pública por
// diseño, como las claves web de Firebase. La privada vive solo en Firebase.
const PUSH_PUBLIC_KEY = 'BNw7jDiml9Cf2MtqsvG85Wm4zxDiviYETiUpGwSgpNSZCZBdEgOluB-3Pnh4aUEL-mXi4ljCaZCkXj2FlQFyAU0';

// Activar push para este usuario/dispositivo: pide el token a Firebase Cloud
// Messaging (usando nuestro service worker) y lo guarda en su perfil. El
// backend usa esos tokens para avisarle aunque la app esté cerrada.
export async function enablePushNotifications(uid: string): Promise<boolean> {
  try {
    if (!app || !db || !uid) return false;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
    if (!(await pushSupported().catch(() => false))) return false;
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return false;
    const token = await getToken(getMessaging(app), {
      vapidKey: PUSH_PUBLIC_KEY,
      serviceWorkerRegistration: reg,
    });
    if (!token) return false;
    await setDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }, { merge: true });
    return true;
  } catch {
    return false;
  }
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
      signupMethod: 'email', // para saber por dónde entra la gente (analítica)
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    }, { merge: true });
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

// ¿Es un navegador embebido (Instagram, Facebook, etc.)? Ahí los popups fallan.
function isInAppWebview(ua: string): boolean {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger|; wv\)/i.test(ua);
}

// Cuándo usar redirección en vez de popup para Google.
// iOS (Safari bloquea popups), app instalada y navegadores embebidos -> redirección.
// Android Chrome normal -> popup: es más confiable y evita la pantalla blanca con
// error del flujo de redirección con dominio propio.
function preferRedirect(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
  return isIOS || isStandalone || isInAppWebview(ua);
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
    await setDoc(doc(db, 'users', user.uid), { name: user.name, nameLower: user.name.trim().toLowerCase(), email: user.email, photoURL: res.user.photoURL || null, signupMethod: 'google', createdAtMs: Date.now(), updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
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
      // Ese Google ya tiene cuenta en IOGGA: entrar con ella SIN abrir un segundo
      // popup (en móvil el segundo popup se bloquea y "regresa a invitado").
      // Usamos la credencial que viene en el error para iniciar sesión directo.
      const code = (err as { code?: string })?.code || '';
      if (code.includes('credential-already-in-use') || code.includes('email-already-in-use')) {
        const pending = GoogleAuthProvider.credentialFromError(err as any);
        if (pending) {
          cred = await signInWithCredential(auth, pending);
        } else {
          cred = await signInWithPopup(auth, provider);
        }
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
      { name: user.name, nameLower: user.name.trim().toLowerCase(), email: user.email, photoURL: cred.user.photoURL || null, signupMethod: 'google', createdAtMs: Date.now(), updatedAt: serverTimestamp() },
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
  photos?: string[]; // hasta 5 fotos del negocio
  // Datos para DEPOSITARLE sus ventas por SPEI (solo los ve el negocio y el administrador)
  payoutHolder?: string; // titular de la cuenta
  payoutBank?: string; // banco
  payoutClabe?: string; // CLABE interbancaria (18 dígitos)
  payoutDocImage?: string; // carátula de la cuenta o foto de la tarjeta (opción sin teclear)
}

export interface UserProfile {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  photoURL?: string | null;
  photos?: string[]; // hasta 3 fotos extra para conocerse mejor en planes públicos
  birthday?: string; // fecha de nacimiento (YYYY-MM-DD), opcional: de aquí sale la edad
  signupMethod?: 'google' | 'email' | 'guest'; // cómo se registró (para analítica)
  whatsapp?: string; // para el botón "Hablar por WhatsApp" al hacer match
  instagram?: string; // usuario de Instagram (sin @)
  website?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  blocked?: string[]; // uids de usuarios/negocios bloqueados por este usuario
  groups?: IoggaGroup[]; // grupos de amigos (como WhatsApp) para invitar de un toque
  business?: BusinessProfile; // perfil de negocio del usuario (mismo modelo que Facebook: una cuenta, dos caras)
  mpConnected?: boolean; // el negocio ya conectó su cuenta de Mercado Pago (reparto automático)
  mpAccount?: string | null; // nombre/usuario visible de la cuenta de Mercado Pago conectada
}

// Grupo de amigos (como WhatsApp): nombre + personas de iogga. Vive dentro del
// perfil del usuario (no es un chat: sirve para invitar a todos de un toque).
export interface IoggaGroup {
  id: string;
  name: string;
  members: Friend[];
}

// Perfil PÚBLICO de otra persona (para ver su tarjeta). La info sensible
// (whatsapp, redes, fotos extra) solo se muestra en la app si hay confianza
// (te sigue o aceptó tu solicitud) — esa regla vive en la interfaz.
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return (snap.data() as UserProfile) || null;
  } catch { return null; }
}

// ---------- Bloquear usuarios o negocios ----------
export async function blockUser(myUid: string, targetUid: string): Promise<void> {
  if (!db || !myUid || !targetUid) return;
  await setDoc(doc(db, 'users', myUid), { blocked: arrayUnion(targetUid) }, { merge: true }).catch(() => {});
  // Al bloquear se corta la relación en ambos sentidos
  await deleteDoc(doc(db, 'follows', followId(myUid, targetUid))).catch(() => {});
  await deleteDoc(doc(db, 'follows', followId(targetUid, myUid))).catch(() => {});
}
export async function unblockUser(myUid: string, targetUid: string): Promise<void> {
  if (!db || !myUid || !targetUid) return;
  try {
    const snap = await getDoc(doc(db, 'users', myUid));
    const blocked: string[] = ((snap.data() as any)?.blocked || []).filter((u: string) => u !== targetUid);
    await updateDoc(doc(db, 'users', myUid), { blocked });
  } catch { /* sin cambios */ }
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
  status?: 'pending' | 'accepted'; // solicitud enviada vs. amistad confirmada (como Instagram)
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

// Seguir = enviar SOLICITUD (como Instagram en privado). La otra persona la
// acepta y hasta entonces quedan como amigos confirmados. Los follows viejos
// (sin campo status) se tratan como aceptados para no romper nada.
export async function followUser(me: AuthUser, target: Friend, mePhoto?: string | null): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'follows', followId(me.uid, target.uid)), {
    follower: me.uid,
    followerName: me.name,
    followerPhoto: mePhoto || null,
    following: target.uid,
    followingName: target.name,
    followingPhoto: target.photo || null,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  // Avisar a la persona: tiene una solicitud nueva
  await setDoc(doc(collection(db, 'notifications')), {
    type: 'system',
    to: target.uid,
    fromName: me.name,
    fromUid: me.uid,
    title: `${me.name.split(' ')[0]} quiere seguirte`,
    message: 'Acepta su solicitud en Amigos → Seguidores para que puedan invitarse a planes.',
    read: false,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  }).catch(() => {});
}

export async function unfollowUser(myUid: string, targetUid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'follows', followId(myUid, targetUid))).catch(() => {});
}

// Aceptar la solicitud de alguien que quiere seguirme
export async function acceptFollower(me: AuthUser, followerUid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'follows', followId(followerUid, me.uid)), { status: 'accepted' }).catch(() => {});
  await setDoc(doc(collection(db, 'notifications')), {
    type: 'system',
    to: followerUid,
    fromName: me.name,
    fromUid: me.uid,
    title: `${me.name.split(' ')[0]} aceptó tu solicitud`,
    message: 'Ya son amigos en iogga: pueden verse el perfil completo e invitarse a planes.',
    read: false,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  }).catch(() => {});
}

// Rechazar solicitud o quitar a un seguidor (borra la relación)
export async function removeFollower(myUid: string, followerUid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'follows', followId(followerUid, myUid))).catch(() => {});
}

// A quién sigo (mis "amigos" para invitar), en tiempo real
export function watchFollowing(uid: string, callback: (friends: Friend[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'follows'), where('follower', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => {
      const x = d.data() as any;
      return { uid: x.following, name: x.followingName || 'Usuario', photo: x.followingPhoto || null, status: x.status || 'accepted' };
    })),
    () => callback([])
  );
}

// Quién me sigue (mis seguidores), con foto y estado de la solicitud
export function watchFollowers(uid: string, callback: (friends: Friend[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'follows'), where('following', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => {
      const x = d.data() as any;
      return { uid: x.follower, name: x.followerName || 'Usuario', photo: x.followerPhoto || null, status: x.status || 'accepted' };
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
  fromUid?: string; // quién la originó: al tocarla se abre su perfil (como Instagram)
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
  // Ordenado por fecha, lo más nuevo primero: así lo recién publicado SIEMPRE
  // entra. (Todo lo que se publica lleva "timestamp" garantizado; ver publishDoc.)
  const q = query(collection(db, name), orderBy('timestamp', 'desc'), limit(400));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }))),
    () => callback([]) // sin permisos o sin conexión: lista vacía, la app sigue funcionando
  );
}

// Rescate: publicaciones antiguas que se guardaron SIN "timestamp" y por eso
// no aparecen en el feed ordenado. Se leen aparte, sin ordenar, y se les pone
// la fecha que les falta para que vuelvan a verse.
export async function repairMissingTimestamps(name: 'plans' | 'promos'): Promise<number> {
  if (!db) return 0;
  try {
    const snap = await getDocs(query(collection(db, name), limit(400)));
    let fixed = 0;
    for (const d of snap.docs) {
      const data = d.data() as { timestamp?: unknown };
      if (typeof data.timestamp === 'number') continue;
      await setDoc(doc(db, name, d.id), { timestamp: Date.now() }, { merge: true }).catch(() => {});
      fixed++;
    }
    return fixed;
  } catch {
    return 0;
  }
}

export async function saveDocIn(name: 'plans' | 'promos', id: string, data: object): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, name, id), sanitize(data), { merge: true });
}

// Guardar y COMPROBAR que de verdad quedó. Publicar un plan o una oferta es lo
// más importante de la app: no basta con mandar el guardado, hay que confirmar
// que el servidor lo tiene. Devuelve un motivo entendible si algo falló, para
// poder decírselo a la persona en vez de fingir que se publicó.
export async function publishDoc(
  name: 'plans' | 'promos',
  id: string,
  data: object,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!db) return { ok: true }; // modo demo sin base de datos: no se bloquea a nadie
  // El feed se ordena por "timestamp", y Firestore DEJA FUERA cualquier
  // documento que no tenga ese campo: sin él, la publicación existe pero nadie
  // la ve nunca. Por eso se pone aquí, en la única puerta de publicación.
  const clean = sanitize(data) as Record<string, unknown>;
  if (typeof clean.timestamp !== 'number') clean.timestamp = Date.now();
  // Un documento no aguanta más de 1 MB. Se revisa ANTES para poder explicarlo.
  const weight = JSON.stringify(clean).length;
  if (weight > 950_000) {
    return { ok: false, reason: 'La foto pesa demasiado. Elige otra o quítala y vuelve a publicar.' };
  }
  try {
    await setDoc(doc(db, name, id), clean, { merge: true });
  } catch (e) {
    const code = String((e as { code?: string })?.code || '');
    if (code.includes('permission-denied')) {
      return { ok: false, reason: 'Tu sesión no tiene permiso para publicar. Cierra sesión, vuelve a entrar e inténtalo otra vez.' };
    }
    if (code.includes('unavailable') || code.includes('deadline')) {
      return { ok: false, reason: 'No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.' };
    }
    if (code.includes('invalid-argument') || code.includes('resource-exhausted')) {
      return { ok: false, reason: 'La foto pesa demasiado. Elige otra o quítala y vuelve a publicar.' };
    }
    return { ok: false, reason: 'No se pudo publicar. Revisa tu conexión e inténtalo otra vez.' };
  }
  // Confirmación real: volver a leerlo del servidor.
  try {
    const check = await getDoc(doc(db, name, id));
    if (!check.exists()) {
      return { ok: false, reason: 'El servidor no guardó la publicación. Inténtalo otra vez.' };
    }
  } catch {
    // Si no se puede releer (sin conexión), el guardado ya no lanzó error:
    // Firestore lo reenvía solo al recuperar la señal. Se da por bueno.
  }
  return { ok: true };
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

// Contador "Seleccionados" de una oferta: suma cuando alguien la elige para su plan
// (o baja su QR). Es el pulso real de interés que ve el negocio.
export async function incrementPromoSelected(promoId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'promos', promoId), { qrScans: increment(1) }).catch(() => {});
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

// Quitar el perfil de negocio y quedarse SOLO como persona. La cuenta, los
// planes y los amigos no se tocan: es una cara de la cuenta que se apaga, no
// una baja. Las ofertas publicadas se marcan como borradas para que dejen de
// aparecer (modelo "desactivar cuenta profesional" de Instagram).
export async function removeBusinessProfile(uid: string): Promise<boolean> {
  if (!db) return true;
  try {
    await setDoc(doc(db, 'users', uid), { business: null, mpConnected: false, mpAccount: null, updatedAt: serverTimestamp() }, { merge: true });
    const mine = await getDocs(query(collection(db, 'promos'), where('uid', '==', uid), limit(200)));
    for (const d of mine.docs) {
      await updateDoc(doc(db, 'promos', d.id), { deleted: true }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

// Guardar sugerencias/ideas del usuario (se ven luego en el panel de administración).
// extra: datos de contexto para que el EQUIPO pueda responder y diagnosticar
// (WhatsApp y ubicación del perfil, dispositivo, versión de la app, modo).
export async function saveFeedback(
  text: string,
  context: string,
  user: AuthUser | null,
  extra?: { whatsapp?: string; location?: string; device?: string; version?: string; mode?: string }
): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(collection(db, 'feedback')), {
      text,
      context, // qué botón/pantalla la originó
      uid: user?.uid || null,
      userName: user?.name || 'Anónimo',
      email: user?.email || '',
      ...sanitize(extra || {}),
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

// Canjes de un usuario (cliente) en tiempo real: sirven para pedirle que evalúe
// al negocio ~30 min después de que la promoción se hizo efectiva.
export function watchUserRedemptions(uid: string, callback: (items: Redemption[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'redemptions'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as Redemption)),
    () => callback([])
  );
}

// Escuchar EN VIVO el pago de un folio (QR): cuando Mercado Pago lo aprueba,
// el webhook escribe en /payments y aquí la app se entera al instante para
// confirmar la compra sola (sin que el usuario tenga que decir "ya pagué").
export function watchPaymentForCode(code: string, uid: string, callback: (status: string | null) => void): () => void {
  if (!db || !uid || !code) return () => {};
  const q = query(collection(db, 'payments'), where('uid', '==', uid), where('code', '==', code));
  return onSnapshot(
    q,
    (snap) => {
      let status: string | null = null;
      snap.docs.forEach((d) => {
        const s = (d.data() as { status?: string }).status || null;
        if (s === 'approved') status = 'approved';
        else if (!status) status = s;
      });
      callback(status);
    },
    () => callback(null)
  );
}

// ---------- Panel de administrador ----------
export const FOUNDER_EMAIL = 'omareduardo_@hotmail.com';

// ¿Este correo es administrador? (el fundador siempre; otros si están en /admins)
export async function checkIsAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  if (email.toLowerCase() === FOUNDER_EMAIL) return true;
  if (!db) return false;
  try { return (await getDoc(doc(db, 'admins', email))).exists(); } catch { return false; }
}

export interface AdminData {
  userCount: number;
  planCount: number;
  promoCount: number;
  redemptionsTotal: number;
  redemptionsRedeemed: number;
  incomeTotal: number; // suma del libro contable (comisiones/ingresos de iogga)
  salesTotal: number;  // ventas concretadas (montos de canjes)
  feedback: { text: string; context: string; userName: string; email?: string; whatsapp?: string; location?: string; device?: string; version?: string; createdAtMs?: number }[];
  admins: string[];
  recentRedemptions: Redemption[];
  // Compras pagadas por Mercado Pago (escritas por el backend de pagos)
  paidCount: number;
  paidAmount: number;
  paidFees: number;
  recentPayments: PaymentRecord[];
  // Lista de usuarios (para exportar y analizar)
  usersList: { name?: string; email?: string; whatsapp?: string; location?: string; business?: string; edad?: number | ''; alta?: string }[];
  // De dónde llega la gente (para decidir en qué invertir)
  signupStats: { google: number; email: number; sinDato: number };
}

// Un pago registrado por el backend (colección /payments)
export interface PaymentRecord {
  status?: string; // created / approved / pending / rejected
  statusDetail?: string | null; // motivo exacto de Mercado Pago (para diagnosticar rechazos)
  title?: string;
  amount?: number;
  feeAmount?: number;
  payoutAmount?: number;
  code?: string | null;
  userName?: string | null;
  businessName?: string | null;
  method?: string | null;
  createdAtMs?: number;
  approvedAtMs?: number | null;
}

// Todo lo del panel en una sola llamada (conteos y listas recientes)
export async function fetchAdminData(): Promise<AdminData> {
  const empty: AdminData = { userCount: 0, planCount: 0, promoCount: 0, redemptionsTotal: 0, redemptionsRedeemed: 0, incomeTotal: 0, salesTotal: 0, feedback: [], admins: [], recentRedemptions: [], paidCount: 0, paidAmount: 0, paidFees: 0, recentPayments: [], usersList: [], signupStats: { google: 0, email: 0, sinDato: 0 } };
  if (!db) return empty;
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => { try { return await fn(); } catch { return fallback; } };
  const [users, plansSnap, promosSnap, reds, ledger, fb, adminsSnap, paysSnap] = await Promise.all([
    safe(() => getDocs(query(collection(db!, 'users'), limit(500))), null as any),
    safe(() => getDocs(query(collection(db!, 'plans'), limit(500))), null as any),
    safe(() => getDocs(query(collection(db!, 'promos'), limit(500))), null as any),
    safe(() => getDocs(query(collection(db!, 'redemptions'), limit(500))), null as any),
    safe(() => getDocs(query(collection(db!, 'ledger'), limit(500))), null as any),
    safe(() => getDocs(query(collection(db!, 'feedback'), limit(200))), null as any),
    safe(() => getDocs(collection(db!, 'admins')), null as any),
    safe(() => getDocs(query(collection(db!, 'payments'), limit(500))), null as any),
  ]);
  const redsList: Redemption[] = reds ? reds.docs.map((d: any) => d.data() as Redemption) : [];
  const redeemed = redsList.filter(r => r.status === 'redeemed');
  const paysList: PaymentRecord[] = paysSnap ? paysSnap.docs.map((d: any) => d.data() as PaymentRecord) : [];
  const paysApproved = paysList.filter(p => p.status === 'approved');
  return {
    userCount: users?.size || 0,
    planCount: plansSnap?.size || 0,
    promoCount: promosSnap?.size || 0,
    redemptionsTotal: redsList.length,
    redemptionsRedeemed: redeemed.length,
    incomeTotal: ledger ? ledger.docs.reduce((s: number, d: any) => s + (Number(d.data().amount) || 0), 0) : 0,
    salesTotal: redeemed.reduce((s, r) => s + (r.priceAmount || 0), 0),
    feedback: fb ? fb.docs.map((d: any) => d.data()).sort((a: any, b: any) => (b.createdAtMs || 0) - (a.createdAtMs || 0)) : [],
    admins: adminsSnap ? adminsSnap.docs.map((d: any) => d.id) : [],
    recentRedemptions: redeemed.sort((a, b) => (b.redeemedAtMs || 0) - (a.redeemedAtMs || 0)).slice(0, 20),
    paidCount: paysApproved.length,
    paidAmount: paysApproved.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    paidFees: paysApproved.reduce((s, p) => s + (Number(p.feeAmount) || 0), 0),
    recentPayments: paysList
      .sort((a, b) => (b.approvedAtMs || b.createdAtMs || 0) - (a.approvedAtMs || a.createdAtMs || 0))
      .slice(0, 20),
    usersList: users
      ? users.docs.map((d: any) => {
          const x = d.data() || {};
          // Edad real a partir de la fecha de nacimiento que la persona dio
          let edad: number | '' = '';
          if (x.birthday) {
            const b = new Date(x.birthday);
            if (!isNaN(b.getTime())) {
              const hoy = new Date();
              let a = hoy.getFullYear() - b.getFullYear();
              const m = hoy.getMonth() - b.getMonth();
              if (m < 0 || (m === 0 && hoy.getDate() < b.getDate())) a--;
              if (a > 0 && a < 120) edad = a;
            }
          }
          return {
            name: x.name || '',
            email: x.email || '',
            whatsapp: x.whatsapp || '',
            location: x.location || '',
            business: (x.business && x.business.name) || '',
            edad,
            alta: x.signupMethod === 'google' ? 'Google' : x.signupMethod === 'email' ? 'Correo' : '',
          };
        })
      : [],
    signupStats: users
      ? users.docs.reduce(
          (acc: { google: number; email: number; sinDato: number }, d: any) => {
            const m = (d.data() || {}).signupMethod;
            if (m === 'google') acc.google++;
            else if (m === 'email') acc.email++;
            else acc.sinDato++;
            return acc;
          },
          { google: 0, email: 0, sinDato: 0 }
        )
      : { google: 0, email: 0, sinDato: 0 },
  };
}

// Guardar las credenciales del Marketplace de Mercado Pago de iogga (client_id y
// client_secret de la app). Solo un admin puede escribirlas (reglas). El backend
// las lee con permisos de servidor; nadie más las ve.
export async function saveMpMarketplaceConfig(clientId: string, clientSecret: string): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'config', 'mp'), {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

// URL a la que se manda al negocio para conectar su cuenta de Mercado Pago.
export const MP_CONNECT_URL = 'https://us-central1-iogga-b932b.cloudfunctions.net/mpConnect';

// ¿A qué cuenta de Mercado Pago quedó conectado el negocio? Devuelve la etiqueta
// visible (usuario/correo enmascarado) y la guarda en el perfil.
export async function fetchMpAccount(uid: string): Promise<string | null> {
  try {
    const r = await fetch('https://us-central1-iogga-b932b.cloudfunctions.net/mpWhoami', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    const d = await r.json().catch(() => ({}));
    return d.label || null;
  } catch {
    return null;
  }
}

// Desvincular la cuenta de Mercado Pago del negocio (para cambiarla por otra).
export async function disconnectMercadoPago(uid: string): Promise<boolean> {
  try {
    const r = await fetch('https://us-central1-iogga-b932b.cloudfunctions.net/mpDisconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    const d = await r.json().catch(() => ({}));
    return !!d.ok;
  } catch {
    return false;
  }
}

export async function addAdmin(email: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'admins', email.trim().toLowerCase()), { addedAt: serverTimestamp() });
}
export async function removeAdmin(email: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'admins', email));
}

// Eliminar la cuenta y TODA la información de la persona (modelo Instagram/Apple):
// guarda el motivo (para el equipo), borra sus datos y cierra la cuenta de acceso.
export async function deleteMyAccount(uid: string, reason: string): Promise<{ ok: boolean; needsRelogin?: boolean }> {
  if (!db || !auth) return { ok: false };
  // Registrar el motivo de la baja (analítica de retención, sin datos sensibles).
  try {
    await setDoc(doc(collection(db, 'deletions')), { uid, reason: reason || '', createdAtMs: Date.now(), createdAt: serverTimestamp() });
  } catch { /* no bloquear la baja por esto */ }
  // Borrar sus datos (mejor esfuerzo): perfil, planes y promociones propias.
  try { await deleteDoc(doc(db, 'users', uid)); } catch { /* reglas o red */ }
  try {
    const mine = await getDocs(query(collection(db, 'plans'), where('uid', '==', uid)));
    await Promise.all(mine.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  } catch { /* ignore */ }
  try {
    const myPromos = await getDocs(query(collection(db, 'promos'), where('uid', '==', uid)));
    await Promise.all(myPromos.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  } catch { /* ignore */ }
  // Cerrar la cuenta de acceso.
  try {
    if (auth.currentUser) await deleteUser(auth.currentUser);
    return { ok: true };
  } catch (e) {
    // Firebase pide reingreso reciente para borrar la cuenta: cerramos sesión
    // (los datos ya se borraron) y quedará la solicitud registrada.
    if (String((e as { code?: string })?.code || '').includes('requires-recent-login')) {
      await signOut(auth).catch(() => {});
      return { ok: true, needsRelogin: true };
    }
    return { ok: false };
  }
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
  validUntilMs?: number; // hasta cuándo vale el QR: el fin de la vigencia de la promo
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
  promo: { id: string; title: string; businessName: string; uid?: string | null; price?: string; validTo?: string; validToTime?: string; allDay?: boolean },
  user: AuthUser | null
): Promise<Redemption> {
  // El QR vale hasta que termina la vigencia de la promoción (si la tiene);
  // si no tiene vigencia, vale 24 horas desde que se genera.
  let validUntilMs = Date.now() + REDEMPTION_TTL_MS;
  if (promo.validTo) {
    const hasTime = !promo.allDay && promo.validToTime && /^\d{1,2}:\d{2}$/.test(promo.validToTime);
    const end = new Date(`${promo.validTo}T${hasTime ? promo.validToTime + ':59' : '23:59:59'}`).getTime();
    if (Number.isFinite(end) && end > Date.now()) validUntilMs = end;
  }
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
    validUntilMs,
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
  // Expira cuando termina la vigencia de la promoción (o a las 24 h si no tiene)
  const limitMs = redemption.validUntilMs || (redemption.createdAtMs ? redemption.createdAtMs + REDEMPTION_TTL_MS : 0);
  if (limitMs && Date.now() > limitMs) {
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
      // Libro contable de iogga. REGLA: en "amount" va SOLO lo que gana iogga.
      // Un canje NO es ingreso de iogga: el dinero de la venta es del negocio.
      // El ingreso real (la comisión) lo registra el webhook de Mercado Pago
      // cuando el pago se aprueba, en ledger/mp_{pago}. Si aquí se apuntara el
      // precio de la venta, el panel sumaría como "Ingresos iogga" dinero ajeno
      // y lo contaría dos veces. Por eso amount = 0 y la venta va aparte.
      await setDoc(doc(db, 'ledger', code), {
        type: 'redemption',
        code,
        promoId: redemption.promoId,
        promoTitle: redemption.promoTitle,
        businessUid: redemption.businessUid || null,
        businessName: redemption.businessName,
        amount: 0, // ingreso de iogga por este movimiento
        saleAmount: redemption.priceAmount || 0, // lo que cobró el negocio
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
