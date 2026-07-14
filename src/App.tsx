import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Search, 
  Plus, 
  User, 
  Briefcase, 
  TrendingUp, 
  MessageSquare, 
  MapPin, 
  Clock, 
  DollarSign, 
  Car, 
  Users, 
  QrCode,
  Edit3,
  BarChart3,
  PackagePlus,
  ArrowRight,
  CheckCircle2,
  Bell,
  ChevronRight,
  ChevronDown,
  Download,
  Menu,
  Settings,
  Shield,
  ShieldAlert,
  CreditCard,
  HelpCircle,
  LogOut,
  Globe,
  Smartphone,
  X,
  PlusCircle,
  Store,
  LayoutGrid,
  Wallet,
  Trash2,
  Star,
  Sparkles,
  Eye,
  Check,
  MoreHorizontal,
  Navigation,
  Pencil,
  Camera,
  Trophy,
  UserPlus,
  Send,
  Mic,
  AudioLines
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Plan, Promotion, UserMode, MOCK_PLANS, MOCK_PROMOS, IDEAS, MOCK_GROUPED_PLANS, GUEST_NAME, GENERIC_AVATAR } from './types';
import { SEED_PLANS, SEED_PROMOS, SEED_USERS } from './lib/seed';
import {
  isFirebaseEnabled,
  watchAuth,
  registerUser,
  loginUser,
  resetPassword,
  loginWithGoogle,
  completeGoogleRedirect,
  rateUser,
  bayesianRating,
  ensureAnonSession,
  logoutUser,
  authErrorMessage,
  watchProfile,
  saveProfile,
  watchCollectionDocs,
  saveDocIn,
  deleteDocIn,
  fetchDocIn,
  incrementPlanAccepted,
  acceptPlanAs,
  saveBusinessProfile,
  saveFeedback,
  watchMyRedemptions,
  searchUsers,
  listUsers,
  followUser,
  unfollowUser,
  watchFollowing,
  watchFollowers,
  sendNotification,
  watchNotifications,
  markNotificationRead,
  type Redemption,
  type Friend,
  type AppNotif,
  type AuthUser,
  type UserProfile
} from './lib/firebase';
import { RedeemQRModal, ValidateCodeModal } from './components/qr';
import { pickImage } from './lib/images';
import { playIntroChime, playChime } from './lib/sound';

interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'ai';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon: any;
  category: 'plan' | 'promo' | 'profile' | 'system' | 'sales' | 'match';
}

const MOCK_NOTIFICATIONS_PERSON: AppNotification[] = [
  {
    id: '1',
    type: 'ai',
    title: '¡Match IA Encontrado!',
    message: 'Alguien publicó un plan de "Pádel" que coincide perfectamente con tus intereses en Descubrir.',
    time: 'Hace 5 min',
    isRead: false,
    icon: Sparkles,
    category: 'match'
  },
  {
    id: '2',
    type: 'success',
    title: 'Invitación Recibida',
    message: 'Sofía te ha invitado a su plan "Cena en la Terraza". ¡Revisa los detalles!',
    time: 'Hace 15 min',
    isRead: false,
    icon: MessageSquare,
    category: 'plan'
  },
  {
    id: '3',
    type: 'info',
    title: 'Plan Aceptado',
    message: 'Carlos ha aceptado tu invitación para "Senderismo al Amanecer".',
    time: 'Hace 1 hora',
    isRead: true,
    icon: CheckCircle2,
    category: 'plan'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Perfil Actualizado',
    message: 'Se han guardado los cambios en tu biografía y preferencias de intereses.',
    time: 'Ayer',
    isRead: true,
    icon: User,
    category: 'profile'
  }
];

const MOCK_NOTIFICATIONS_BUSINESS: AppNotification[] = [
  {
    id: '1',
    type: 'success',
    title: '¡Ventas en Aumento!',
    message: 'Tu producto "Hamburguesa 2x1" ha tenido un incremento del 40% en ventas hoy.',
    time: 'Hace 10 min',
    isRead: false,
    icon: TrendingUp,
    category: 'sales'
  },
  {
    id: '2',
    type: 'ai',
    title: 'Oportunidad en Descubrir',
    message: 'Hay 15 personas buscando "Comida Italiana" cerca de tu ubicación ahora mismo.',
    time: 'Hace 30 min',
    isRead: false,
    icon: Sparkles,
    category: 'match'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Producto sin Interés',
    message: 'El producto "Ensalada César" no ha recibido clics en las últimas 24 horas. ¡Prueba cambiar la foto!',
    time: 'Hace 2 horas',
    isRead: true,
    icon: BarChart3,
    category: 'promo'
  },
  {
    id: '4',
    type: 'info',
    title: 'Perfil Actualizado',
    message: 'Tu horario de atención ha sido actualizado correctamente en el perfil de negocio.',
    time: 'Ayer',
    isRead: true,
    icon: Store,
    category: 'profile'
  }
];

const MOCK_SALES_DATA = [
  { name: 'Lun', sales: 400, trend: 380 },
  { name: 'Mar', sales: 700, trend: 450 },
  { name: 'Mie', sales: 450, trend: 520 },
  { name: 'Jue', sales: 900, trend: 590 },
  { name: 'Vie', sales: 650, trend: 660 },
  { name: 'Sab', sales: 800, trend: 730 },
  { name: 'Dom', sales: 550, trend: 800 },
];

const renderPlanTechnicalDetails = (plan: Plan) => {
  const getBudgetLabel = (budget: string) => {
    switch (budget) {
      case 'invites': return 'Yo invito';
      case 'split': return 'Dividimos';
      case 'no-money': return 'Sin presupuesto';
      case 'not-needed': return 'No se necesita';
      default: return budget;
    }
  };

  const getTransportLabel = (transport: string) => {
    switch (transport) {
      case 'has-transport': return 'Tengo transporte';
      case 'each-arrives': return 'Cada quien llega';
      case 'no-transport': return 'Sin transporte';
      case 'not-needed': return 'No se necesita';
      default: return transport;
    }
  };

  const DetailItem = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string, colorClass: string }) => (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`p-2 rounded-xl ${colorClass} shrink-0`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <span className="text-[8px] text-zinc-500 block font-black uppercase tracking-widest leading-none mb-0.5">{label}</span>
        <span className="text-[11px] font-bold text-white leading-none truncate block">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2">
      <DetailItem 
        icon={Clock} 
        label="Horario" 
        value={`${plan.startTime} - ${plan.endTime}`} 
        colorClass="bg-iogga-accent/10 text-iogga-accent" 
      />
      <DetailItem 
        icon={MapPin} 
        label="Lugar" 
        value={plan.location} 
        colorClass="bg-amber-500/10 text-amber-500" 
      />
      <DetailItem 
        icon={DollarSign} 
        label="Presupuesto" 
        value={getBudgetLabel(plan.budget)} 
        colorClass="bg-emerald-500/10 text-emerald-500" 
      />
      <DetailItem 
        icon={Car} 
        label="Transporte" 
        value={getTransportLabel(plan.transport)} 
        colorClass="bg-blue-500/10 text-blue-500" 
      />
      <DetailItem 
        icon={Users} 
        label="Visibilidad" 
        value={plan.guests === 'public' ? 'Público' : 'Amigos'} 
        colorClass="bg-purple-500/10 text-purple-500" 
      />
      <DetailItem 
        icon={Sparkles} 
        label="Actividad" 
        value={plan.activity} 
        colorClass="bg-iogga-primary/10 text-iogga-primary" 
      />
    </div>
  );
};

// Mensaje unificado de bienvenida de iogga (mismo texto en el intro y en el popup de persona)
const IOGGA_WELCOME = 'iogga es la app para salir del móvil y vivir lo espontáneo. Comparte tu intención —"un café", "vamos al cine"— y quien quiera se suma. Sin chats interminables: solo acción.';

// ---- Voz: hablar (TTS) y escuchar (reconocimiento) para Platica y Dicta ----
function speakEs(text: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!('speechSynthesis' in window)) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-MX';
      u.rate = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { resolve(); }
  });
}

let activeRecognition: any = null;
// Cortar cualquier escucha activa (al salir de la pantalla, el micro se apaga).
function abortListen() {
  try { activeRecognition?.abort?.(); } catch {}
  activeRecognition = null;
}
function listenEs(): Promise<string | null> {
  return new Promise((resolve) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return resolve(null);
    try {
      const rec = new SR();
      activeRecognition = rec;
      rec.lang = 'es-MX';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let done = false;
      const finish = (v: string | null) => { if (!done) { done = true; if (activeRecognition === rec) activeRecognition = null; resolve(v); } };
      rec.onresult = (e: any) => finish(e.results?.[0]?.[0]?.transcript || null);
      rec.onerror = () => finish(null);
      rec.onend = () => finish(null);
      rec.start();
    } catch { resolve(null); }
  });
}

// Ideas para las "luciérnagas": pool grande para que no se repitan
const FIREFLY_POOL = [
  'Café', 'Cine', 'Tacos', 'Cerveza', 'Caminar', 'Alitas', 'Música', 'Picnic', 'Playa', 'Concierto',
  'Sushi', 'Boliche', 'Yoga', 'Museo', 'Correr', 'Bici', 'Pizza', 'Helado', 'Fotos', 'Bailar',
  'Senderismo', 'Café con leche', 'Ver el atardecer', 'Ping pong', 'Karaoke', 'Parque', 'Ajedrez',
  'Nadar', 'Escalar', 'Postres', 'Ramen', 'Mercado', 'Arte', 'Estrenos', 'Domino', 'Terraza',
  'Feria', 'Antojitos', 'Brunch', 'Vinos', 'Board games', 'Patinar', 'Frisbee', 'Mirador',
];

// Palabras que flotan y cambian solas (fade in/out), sin repetir a la vista
function FireflyWords({ onPick }: { onPick: (w: string) => void }) {
  const [words, setWords] = React.useState<string[]>(() => {
    const s = [...FIREFLY_POOL].sort(() => Math.random() - 0.5);
    return s.slice(0, 10);
  });
  React.useEffect(() => {
    const id = setInterval(() => {
      // Cambia unas pocas palabras cada ciclo (no todas), para que se sienta vivo pero sutil
      setWords(prev => {
        const next = [...prev];
        const pool = FIREFLY_POOL.filter(w => !prev.includes(w));
        for (let k = 0; k < 3 && pool.length; k++) {
          const i = Math.floor(Math.random() * next.length);
          const j = Math.floor(Math.random() * pool.length);
          next[i] = pool.splice(j, 1)[0];
        }
        return next;
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2.5 justify-center py-2 min-h-[72px] content-center">
      {words.map((w, i) => (
        <AnimatePresence mode="popLayout" key={i}>
          <motion.button
            key={w}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            onClick={() => onPick(w)}
            className="text-sm font-semibold text-iogga-primary bg-transparent border-none"
            style={{ animation: `iogFirefly ${4 + (i % 3)}s ease-in-out ${(i * 0.4).toFixed(2)}s infinite` }}
          >
            {w}
          </motion.button>
        </AnimatePresence>
      ))}
    </div>
  );
}

// Botón de micrófono para dictar dentro de cualquier campo de texto
function MicButton({ onText, tone = 'primary', inline = false }: { onText: (t: string) => void; tone?: 'primary' | 'accent'; inline?: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const busyRef = React.useRef(false);
  const color = tone === 'accent' ? 'text-iogga-accent' : 'text-iogga-primary';
  const pos = inline ? '' : 'absolute right-3 top-1/2 -translate-y-1/2 ';
  // Al desmontar SOLO abortar si ESTE micrófono estaba escuchando; así no
  // interrumpimos la plática (que maneja su propia escucha) al redibujar.
  React.useEffect(() => () => { if (busyRef.current) abortListen(); }, []);
  return (
    <button
      type="button"
      onClick={async () => {
        if (busy) { abortListen(); busyRef.current = false; setBusy(false); return; }
        busyRef.current = true; setBusy(true);
        const t = await listenEs();
        busyRef.current = false; setBusy(false);
        if (t) onText(t);
      }}
      title="Dictar por voz"
      className={`${pos}relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${busy ? 'bg-red-500 text-white' : `bg-white/5 ${color} hover:bg-white/10`}`}
    >
      {busy && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
          <span className="absolute -inset-1 rounded-full border border-red-400/40 animate-pulse" />
        </>
      )}
      <Mic size={16} className="relative z-10" />
    </button>
  );
}

// ---- Imagen de ESTADO (WhatsApp/Instagram): 9:16, el TEXTO es el protagonista ----
// message = la invitación generada por iogga (sin clave privada). Sin emojis.
async function buildStatusImage(message: string, image?: string): Promise<string> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Fondo: foto del plan (cualquier formato, recortada a cubrir) muy oscurecida,
  // o degradado de marca si no hay foto. El texto siempre debe leerse.
  const drawBg = async () => {
    if (image) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = image; });
        const scale = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * scale) / 2, (H - img.height * scale) / 2, img.width * scale, img.height * scale);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgba(9,9,11,0.82)'); grad.addColorStop(0.5, 'rgba(9,9,11,0.7)'); grad.addColorStop(1, 'rgba(9,9,11,0.9)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        return;
      } catch { /* sigue al degradado */ }
    }
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1e1b4b'); g.addColorStop(0.5, '#09090b'); g.addColorStop(1, '#312e81');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  await drawBg();

  ctx.textAlign = 'center';

  // Logo iogga arriba
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '900 110px Quicksand, sans-serif';
  ctx.fillText('iogga', W / 2, 300);

  // El TEXTO de la invitación como protagonista: ajusta tamaño y envuelve según largo
  const maxW = W - 160;
  const wrap = (text: string, font: string): string[] => {
    ctx.font = font;
    const out: string[] = [];
    text.split('\n').forEach(para => {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
      }
      if (line) out.push(line);
    });
    return out;
  };
  // Elegir el tamaño más grande que quepa en ~9 líneas
  let size = 86, lines: string[] = [];
  for (; size >= 46; size -= 6) {
    lines = wrap(message, `800 ${size}px Quicksand, sans-serif`);
    if (lines.length <= 9) break;
  }
  const lineH = size * 1.28;
  const blockH = lines.length * lineH;
  let y = Math.max(520, (H - blockH) / 2 - 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${size}px Quicksand, sans-serif`;
  lines.forEach(l => { ctx.fillText(l, W / 2, y); y += lineH; });

  // Pie: invitación a la app + URL real (sin emojis)
  ctx.fillStyle = '#c7d2fe';
  ctx.font = '800 52px Quicksand, sans-serif';
  ctx.fillText('Coincide con los que amas, en iogga', W / 2, H - 220);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 58px Quicksand, sans-serif';
  ctx.fillText(window.location.host, W / 2, H - 140);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 38px Quicksand, sans-serif';
  ctx.fillText('la app para salir del movil y vivir lo espontaneo', W / 2, H - 80);

  return canvas.toDataURL('image/png');
}

// Compartir el estado: imagen + link (nativo si se puede; si no, descarga + WhatsApp)
async function shareStatusImage(dataUrl: string, link: string) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'iogga-estado.png', { type: 'image/png' });
    const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], text: `Coincide con los que amas 💜 ${link}` });
      return;
    }
  } catch { /* cae al respaldo */ }
  // Respaldo: descargar la imagen y abrir WhatsApp con el link
  const a = document.createElement('a');
  a.href = dataUrl; a.download = 'iogga-estado.png'; a.click();
  window.open(`https://wa.me/?text=${encodeURIComponent(`Coincide con los que amas 💜 ${link}`)}`, '_blank');
}

// Etiqueta "Prueba" para distinguir datos ficticios (esquina, sin mover el diseño).
function SeedTag() {
  return (
    <div className="absolute top-0 left-0 bg-amber-500/20 px-3 py-1 rounded-br-2xl border-r border-b border-amber-400/30 flex items-center gap-1 z-20 backdrop-blur-md">
      <span className="text-[9px] font-black text-amber-300 uppercase tracking-[0.2em]">Prueba</span>
    </div>
  );
}

// ---- Motor de coincidencias por palabras (ligero, sin costo de IA) ----
const STOPWORDS = new Set(['de','la','el','los','las','un','una','y','o','en','con','por','para','a','al','del','que','mi','tu','su','me','te','se','lo','es','un','busco','vamos','ir','hacer','plan']);
function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}
// Puntaje de similitud entre el texto de un plan y otro contenido (0..1).
function similarity(aTokens: string[], bText: string): number {
  const b = new Set(tokenize(bText));
  if (!aTokens.length || !b.size) return 0;
  let hits = 0;
  for (const t of aTokens) {
    if (b.has(t)) { hits += 1; continue; }
    // coincidencia parcial (raíz de palabra), p.ej. "cafetería" ~ "café"
    for (const w of b) { if (w.length > 3 && (w.startsWith(t.slice(0, 4)) || t.startsWith(w.slice(0, 4)))) { hits += 0.5; break; } }
  }
  return hits / aTokens.length;
}

export default function App() {
  // ¿Saltamos el intro (logo blanco)? Sí para quien ya tiene la app instalada,
  // ya se registró antes, o ya entró al menos dos veces. Así la app abre rápido
  // y directo a Explorar para quien ya la usa.
  const bootSkipIntro = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
      const visits = Number(localStorage.getItem('iogga_visits') || '0');
      const registered = localStorage.getItem('iogga_tutorial_completed') === 'true';
      return standalone || registered || visits >= 2;
    } catch { return false; }
  })();
  const [isIntro, setIsIntro] = useState(!bootSkipIntro);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [isWiggleMode, setIsWiggleMode] = useState(false);
  const [showEditBusinessProfile, setShowEditBusinessProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: '',
    bio: '',
    logo: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=150&q=80',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    location: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    linkedin: '',
  });
  const [mode, setMode] = useState<UserMode>('person');
  // Quien ya usa la app entra directo a Explorar; los nuevos empiezan en Inicio.
  const [activeTab, setActiveTab] = useState(bootSkipIntro ? 'search' : 'home');
  // Con Firebase conectado la app inicia EN BLANCO y se llena con datos reales
  // de los usuarios en tiempo real. Sin Firebase, usa datos de ejemplo.
  // La base ficticia (SEED_*) siempre acompaña a los datos reales para que la
  // app se vea llena. Los datos reales van primero; los de prueba, al final.
  const [plans, setPlans] = useState<Plan[]>([...(isFirebaseEnabled ? [] : MOCK_PLANS), ...SEED_PLANS]);
  const [promos, setPromos] = useState<Promotion[]>([...(isFirebaseEnabled ? [] : MOCK_PROMOS), ...SEED_PROMOS]);

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    const unsubPlans = watchCollectionDocs<Plan>('plans', (docs) => setPlans([...docs, ...SEED_PLANS]));
    const unsubPromos = watchCollectionDocs<Promotion>('promos', (docs) => setPromos([...docs, ...SEED_PROMOS]));
    return () => {
      unsubPlans();
      unsubPromos();
    };
  }, []);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [selectedProductAnalytics, setSelectedProductAnalytics] = useState<Promotion | null>(null);
  const [searchFilter, setSearchFilter] = useState<'plans' | 'promos'>('plans');
  const [searchSubFilter, setSearchSubFilter] = useState<'for-you' | 'public'>('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);
  const [userSelectedOfferIds, setUserSelectedOfferIds] = useState<Record<string, string>>({});
  const [businessExploreCategory, setBusinessExploreCategory] = useState('Todos');
  const [showTrends, setShowTrends] = useState(false);
  const [acceptedPlanIds, setAcceptedPlanIds] = useState<string[]>([]);
  const [ignoredPlanIds, setIgnoredPlanIds] = useState<string[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [homeFilter, setHomeFilter] = useState<'all' | 'my-plans' | 'offers'>('all');
  const [promoImage, setPromoImage] = useState<string | null>(null);
  const [selectedPlanForOffers, setSelectedPlanForOffers] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [currentPlanStep, setCurrentPlanStep] = useState(0);

  const [visibleIdeas, setVisibleIdeas] = useState<string[]>([]);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<Plan | null>(null);
  const [pendingClose, setPendingClose] = useState<Plan | null>(null); // "¿cerrar o dejar abierto?"
  const [selectedUserProfile, setSelectedUserProfile] = useState<Plan | null>(null);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<Promotion | null>(null);

  // Match / Coincidence Engine States
  const [selectedPromoForMatches, setSelectedPromoForMatches] = useState<Promotion | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [lastPublishedPlan, setLastPublishedPlan] = useState<Plan | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [betaMessage, setBetaMessage] = useState({ title: '', desc: '' });
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  // Custom alert trigger
  const triggerBeta = (title: string, desc: string) => {
    setBetaMessage({ title, desc });
    setSuggestionText('');
    setSuggestionSent(false);
    setShowBetaModal(true);
  };

  // Función aún no disponible en el MVP: avisa e invita a mandar ideas.
  // El modal solo se cierra (no navega), así el usuario se queda donde estaba.
  const comingSoon = (feature: string) => {
    triggerBeta(feature, 'Próximamente. Estamos haciendo pruebas. Envíanos tu sugerencia.');
  };

  // Auth & Business States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginActionToResume, setLoginActionToResume] = useState<(() => void) | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [registerName, setRegisterName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [redeemPromo, setRedeemPromo] = useState<Promotion | null>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  // Formulario de "Editar Perfil" (se guarda en Firestore)
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editLinks, setEditLinks] = useState({ website: '', facebook: '', tiktok: '', linkedin: '' });

  // Link directo a WhatsApp (México +52 por defecto si dan 10 dígitos)
  const waLink = (phone: string, text: string) => {
    const digits = phone.replace(/\D/g, '');
    const full = digits.length === 10 ? `52${digits}` : digits;
    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
  };

  // Enlaces/redes: construye chips clicables desde un perfil (negocio o persona)
  // Chips de contacto/redes. color = solo texto (sin caja/contorno).
  // includeWhatsapp: solo para negocios; en personas el WhatsApp es PRIVADO
  // (se revela únicamente al unirse a un plan).
  const socialChips = (p: { website?: string; instagram?: string; facebook?: string; tiktok?: string; linkedin?: string; whatsapp?: string; phone?: string; location?: string }, opts?: { includeWhatsapp?: boolean }) => {
    const https = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
    const chips: { label: string; href: string; color: string }[] = [];
    if (p.website) chips.push({ label: 'Sitio web', href: https(p.website), color: 'text-sky-300' });
    if (p.instagram) chips.push({ label: 'Instagram', href: `https://instagram.com/${p.instagram.replace(/[@\s]/g, '')}`, color: 'text-pink-300' });
    if (p.facebook) chips.push({ label: 'Facebook', href: /^https?:/.test(p.facebook) ? p.facebook : `https://facebook.com/${p.facebook.replace(/[@\s]/g, '')}`, color: 'text-blue-300' });
    if (p.tiktok) chips.push({ label: 'TikTok', href: `https://tiktok.com/@${p.tiktok.replace(/[@\s]/g, '')}`, color: 'text-zinc-200' });
    if (p.linkedin) chips.push({ label: 'LinkedIn', href: /^https?:/.test(p.linkedin) ? p.linkedin : `https://linkedin.com/in/${p.linkedin.replace(/[@\s]/g, '')}`, color: 'text-sky-300' });
    const wa = p.whatsapp || p.phone;
    if (wa && opts?.includeWhatsapp) chips.push({ label: 'WhatsApp', href: waLink(wa, '¡Hola! Te contacto desde iogga.'), color: 'text-green-400' });
    if (p.location) chips.push({ label: 'Ubicación', href: `https://maps.google.com/?q=${encodeURIComponent(p.location)}`, color: 'text-zinc-300' });
    return chips;
  };

  // ---- Selector de fecha en 1 toque: Hoy · Mañana · días de la semana · 📅 ----
  const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dateOptions = (() => {
    const opts: { iso: string; label: string; chip: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dow = DOW[d.getDay()];
      opts.push({
        iso,
        label: i === 0 ? 'hoy' : i === 1 ? 'mañana' : `el ${dow}`,
        chip: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : dow.charAt(0).toUpperCase() + dow.slice(1, 3),
      });
    }
    return opts;
  })();
  const customDateLabel = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return `el ${d} de ${MONTHS[m - 1]}`;
  };

  // Nombre del invitado que publica sin registrarse (para firmar su invitación)
  const [guestName, setGuestName] = useState('');

  const planInputRef = useRef<HTMLInputElement>(null);
  const FIREFLY_IDEAS = ['Café', 'Cine', 'Tacos', 'Cerveza', 'Caminar', 'Alitas', 'Música', 'Picnic', 'Playa', 'Concierto'];

  // Platica: modo voz conversacional. La app pregunta cada paso, escucha tu
  // respuesta, la interpreta y avanza sola hasta terminar el plan.
  const [platicaOn, setPlaticaOn] = useState(false);
  const [platicaStatus, setPlaticaStatus] = useState('');
  const platicaCancel = useRef(false);
  // Pokayoke: pista de la barra (dictar / platicar por voz). Solo para quien aún no crea nada.
  const [barHintSeen, setBarHintSeen] = useState(() => {
    try { return !!localStorage.getItem('iogga_bar_hint_seen'); } catch { return false; }
  });
  const dismissBarHint = () => {
    setBarHintSeen(true);
    try { localStorage.setItem('iogga_bar_hint_seen', '1'); } catch {}
  };

  const parseTime = (t: string): string | null => {
    const s = t.toLowerCase();
    let m = s.match(/(\d{1,2})[:\s]?(\d{2})?\s*(am|pm|a\.m|p\.m|de la (?:tarde|noche|mañana))?/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3] || '';
    if (/pm|tarde|noche/.test(ap) && h < 12) h += 12;
    if (/am|mañana/.test(ap) && h === 12) h = 0;
    if (h > 23) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  // La plática avanza la pantalla visible paso a paso (para que el usuario vea
  // cómo se va llenando y seleccionando) y puede empezar desde cualquier paso.
  const runPlatica = async (fromStep = 0) => {
    platicaCancel.current = false;
    const cancelled = () => platicaCancel.current;
    const finish = () => { setPlaticaOn(false); setPlaticaStatus(''); };

    const ask = async (q: string): Promise<string | null> => {
      if (cancelled()) return null;
      setPlaticaStatus(q);
      await speakEs(q);
      if (cancelled()) return null;
      setPlaticaStatus('Escuchando…');
      return await listenEs();
    };
    const yesNo = async (q: string): Promise<boolean> => {
      const r = await ask(q);
      return !!r && /\bs[ií]\b|claro|va|dale|por supuesto|ok/i.test(r);
    };
    // Capturar texto libre con confirmación "¿así lo dejamos o lo cambiamos?"
    const capture = async (q: string, apply: (t: string) => void): Promise<void> => {
      let val = await ask(q);
      while (!cancelled()) {
        if (!val) { val = await ask('No te escuché bien. ' + q); continue; }
        apply(val);
        setPlaticaStatus('Entendí: "' + val + '"');
        await speakEs('Entendí: ' + val + '. ¿Así lo dejamos, o lo cambiamos?');
        if (cancelled()) return;
        setPlaticaStatus('Escuchando…');
        const c = await listenEs();
        if (c && /cambia|otra|no|corrige|de nuevo/i.test(c)) { val = await ask('Ok. Dímelo otra vez.'); continue; }
        return;
      }
    };

    // Paso 0: actividad (+ nombre y clave privada si no hay sesión)
    if (fromStep <= 0) {
      setCurrentPlanStep(0);
      await capture('Dime un plan o un deseo que te gustaría hacer hoy u otro día.', t => setNewPlan(p => ({ ...p, activity: t })));
      if (cancelled()) return finish();
      if (!currentUser || currentUser.isAnonymous) {
        if (await yesNo('No has iniciado sesión, y una invitación anónima puede dar desconfianza. ¿Quieres dejar tu nombre para que sepan que eres tú?')) {
          await capture('¿Cuál es tu nombre?', t => setGuestName(t));
        }
        if (cancelled()) return finish();
        if (await yesNo('¿Quieres dejar una clave privada, una frase para que confíen que eres tú y no un fraude?')) {
          await capture('Dime tu clave privada. Por ejemplo: soy tu primo Beto.', t => setNewPlan(p => ({ ...p, privateKey: t })));
        }
      }
      if (cancelled()) return finish();
    }

    // Paso 1: día y hora
    if (fromStep <= 1 && !cancelled()) {
      setCurrentPlanStep(1);
      let dl = ''; let tm = '';
      const dt = await ask('¿Qué día y a qué hora? Por ejemplo: hoy a las ocho de la noche.');
      if (dt) {
        const low = dt.toLowerCase();
        const opt = dateOptions.find(o => low.includes(o.label.replace('el ', '')) || low.includes(o.chip.toLowerCase()));
        if (opt) { setNewPlan(p => ({ ...p, date: opt.iso, dateLabel: opt.label })); dl = opt.label; }
        const parsed = parseTime(dt);
        if (parsed) { setNewPlan(p => ({ ...p, startTime: parsed })); tm = parsed; }
      }
      if (dl || tm) { setPlaticaStatus(`Anoté: ${dl} ${tm}`); await speakEs(`Anoté ${dl} ${tm}. Puedes ajustarlo con los botones si quieres.`); }
      if (cancelled()) return finish();
    }

    // Paso 2: presupuesto (+ comentario)
    if (fromStep <= 2 && !cancelled()) {
      setCurrentPlanStep(2);
      const bud = await ask('¿Cómo pagan? Puedes decir: tú invitas, cada quien paga, sin dinero, o no se necesita.');
      if (bud) {
        const b = bud.toLowerCase();
        const val = b.includes('invit') ? 'invites' : (b.includes('cada') ? 'split' : (b.includes('no se') || b.includes('necesita') ? 'not-needed' : (b.includes('sin') || b.includes('gratis') ? 'no-money' : null)));
        if (val) {
          setNewPlan(p => ({ ...p, budget: val as any }));
          const label = val === 'invites' ? 'tú invitas' : val === 'split' ? 'cada quien paga lo suyo' : val === 'no-money' ? 'sin presupuesto' : 'no se necesita dinero';
          setPlaticaStatus('Seleccioné: ' + label);
          await speakEs('Seleccioné: ' + label + '.');
        }
      }
      if (cancelled()) return finish();
      if (await yesNo('¿Quieres agregar un comentario sobre el dinero?')) {
        await capture('Dime tu comentario sobre el dinero.', t => setNewPlan(p => ({ ...p, budgetAmount: t })));
      }
      if (cancelled()) return finish();
    }

    // Paso 3: transporte (+ comentario)
    if (fromStep <= 3 && !cancelled()) {
      setCurrentPlanStep(3);
      const tr = await ask('¿Cómo llegan? Tienes carro, cada quien llega, no hay transporte, o no se necesita.');
      if (tr) {
        const t = tr.toLowerCase();
        const val = t.includes('carro') || t.includes('coche') ? 'has-transport' : (t.includes('cada') ? 'each-arrives' : ((t.includes('no se') || t.includes('necesita')) ? 'not-needed' : (t.includes('no') ? 'no-transport' : null)));
        if (val) {
          setNewPlan(p => ({ ...p, transport: val as any }));
          const label = val === 'has-transport' ? 'tengo carro' : val === 'each-arrives' ? 'cada quien llega' : 'no tengo transporte';
          setPlaticaStatus('Seleccioné: ' + label);
          await speakEs('Seleccioné: ' + label + '.');
        }
      }
      if (cancelled()) return finish();
      if (await yesNo('¿Quieres agregar un comentario sobre el transporte?')) {
        await capture('Dime tu comentario sobre el transporte.', t => setNewPlan(p => ({ ...p, transportNote: t })));
      }
      if (cancelled()) return finish();
    }

    // Paso 4: ubicación (+ otra opcional)
    if (fromStep <= 4 && !cancelled()) {
      setCurrentPlanStep(4);
      await capture('¿Dónde es el plan?', t => setNewPlan(p => ({ ...p, location: t })));
      if (cancelled()) return finish();
      if (await yesNo('¿Quieres agregar otra ubicación?')) {
        await capture('Dime la otra ubicación.', t => setNewPlan(p => ({ ...p, locations: [...(p.locations || []), t] })));
      }
      if (cancelled()) return finish();
    }

    // Paso 5: visibilidad (manual por ahora)
    setCurrentPlanStep(5);
    setPlaticaStatus('¡Listo!');
    await speakEs('En quién puede verlo tendrás que elegir a mano por ahora; pronto también será por voz.');
    finish();
  };

  const [platicaFromStep, setPlaticaFromStep] = useState(0);
  // Iniciar/continuar la plática desde un paso concreto.
  const startPlaticaAt = (step: number) => { setPlaticaFromStep(step); setPlaticaOn(true); };

  useEffect(() => {
    if (platicaOn) { void runPlatica(platicaFromStep); }
    else { platicaCancel.current = true; abortListen(); try { window.speechSynthesis?.cancel(); } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platicaOn]);

  // Borrador de plan: nunca se pierde nada sin preguntar
  const [askDraft, setAskDraft] = useState(false);
  const closeCreatePlan = () => {
    setShowCreatePlan(false);
    setEditingPlanId(null);
    setCurrentPlanStep(0);
    setNewPlan({ activity: '', startTime: '09:00', endTime: '12:00', location: '', budget: 'split', budgetAmount: '', transport: 'each-arrives', transportNote: '', guests: 'public', isPublic: true, image: undefined });
  };

  // Al cerrar el modal de crear plan, apagar micrófono y voz.
  useEffect(() => {
    if (!showCreatePlan) { platicaCancel.current = true; abortListen(); try { window.speechSynthesis?.cancel(); } catch {} setAskDraft(false); }
    else if (!editingPlanId) {
      // ¿Hay borrador guardado? Recuperarlo para continuar donde iba.
      try {
        const raw = localStorage.getItem('iogga_plan_draft');
        if (raw && !newPlan.activity) {
          const d = JSON.parse(raw);
          if (d?.plan) { setNewPlan(d.plan); setCurrentPlanStep(d.step || 0); if (d.guestName) setGuestName(d.guestName); }
          localStorage.removeItem('iogga_plan_draft');
          triggerBeta('Borrador recuperado', 'Continuamos donde te quedaste. Si quieres empezar de cero, borra los campos.');
        }
      } catch {}
      // Autorrellenar el nombre (firma) con lo que ya sabemos del usuario.
      if (!guestName.trim()) {
        const known = (currentUser && !currentUser.isAnonymous ? currentUser.name : '') || userProfile.name || '';
        if (known) setGuestName(known);
      }
    }
  }, [showCreatePlan]);

  // ---- Dictado por micrófono en cada paso: interpreta y selecciona/ajusta ----
  const applyDateTime = (t: string) => {
    const low = t.toLowerCase();
    const opt = dateOptions.find(o => low.includes(o.label.replace('el ', '')) || low.includes(o.chip.toLowerCase()));
    if (opt) setNewPlan(p => ({ ...p, date: opt.iso, dateLabel: opt.label }));
    const parsed = parseTime(t);
    if (parsed) setNewPlan(p => ({ ...p, startTime: parsed }));
  };
  const applyBudget = (t: string) => {
    const b = t.toLowerCase();
    const val = b.includes('invit') ? 'invites' : (b.includes('cada') ? 'split' : (b.includes('no se') || b.includes('necesita') ? 'not-needed' : (b.includes('sin') || b.includes('gratis') ? 'no-money' : null)));
    if (val) setNewPlan(p => ({ ...p, budget: val as any }));
  };
  const applyTransport = (t: string) => {
    const s = t.toLowerCase();
    const val = s.includes('carro') || s.includes('coche') ? 'has-transport' : (s.includes('cada') ? 'each-arrives' : ((s.includes('no se') || s.includes('necesita')) ? 'not-needed' : (s.includes('no') ? 'no-transport' : null)));
    if (val) setNewPlan(p => ({ ...p, transport: val as any }));
  };

  // Par de iconos de voz para un paso: ondas = platícalo desde aquí (o detener); micro = dictar.
  const VoicePair = ({ step, onDicta, tone = 'primary' }: { step: number; onDicta?: (t: string) => void; tone?: 'primary' | 'accent' }) => (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => { if (platicaOn) { setPlaticaOn(false); } else { startPlaticaAt(step); } }}
        title={platicaOn ? 'Detener la plática' : 'Platícalo por voz desde aquí'}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${platicaOn ? 'bg-iogga-primary text-white' : tone === 'accent' ? 'bg-iogga-accent/15 text-iogga-accent hover:bg-iogga-accent/25' : 'bg-iogga-primary/15 text-iogga-primary hover:bg-iogga-primary/25'}`}
      >
        {platicaOn && <span className="absolute inset-0 rounded-full bg-iogga-primary/40 animate-ping" />}
        <AudioLines size={16} className="relative z-10" />
      </button>
      {onDicta && <MicButton inline tone={tone} onText={onDicta} />}
    </div>
  );

  // Grupo ondas+micrófono DENTRO de una caja de texto (mismo formato que la
  // primera barra "¿Qué quieres hacer?"). Se coloca en un contenedor relative
  // y el input debe llevar pr-24. atTop = para textareas altas.
  const FieldVoice = ({ step, onDicta, atTop = false }: { step: number; onDicta: (t: string) => void; atTop?: boolean }) => (
    <div className={`absolute right-2.5 flex items-center gap-1.5 ${atTop ? 'top-3' : 'top-1/2 -translate-y-1/2'}`}>
      <button
        type="button"
        onClick={() => { if (platicaOn) setPlaticaOn(false); else startPlaticaAt(step); }}
        title={platicaOn ? 'Detener la plática' : 'Platícalo por voz'}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-iogga-primary/15 text-iogga-primary hover:bg-iogga-primary/25 transition-all active:scale-90"
      >
        <AudioLines size={16} />
      </button>
      <MicButton inline onText={onDicta} />
    </div>
  );

  // Arranque tipo "el cel parece apagado": pantalla negra, el usuario toca,
  // y el logo entra en fade in de 4s mientras suena el intro. El toque también
  // desbloquea el audio del navegador (por eso el sonido nunca falla aquí).
  const [showSplash, setShowSplash] = useState(!bootSkipIntro);
  const [splashRevealed, setSplashRevealed] = useState(false);
  const chimePlayed = useRef(false);

  const revealSplash = () => {
    if (splashRevealed) return;
    setSplashRevealed(true);
    chimePlayed.current = true;
    playIntroChime(); // el toque desbloquea el audio: la lluvia de notitas suena junto al logo
    setTimeout(() => setShowSplash(false), 13000); // tiempo para leer el mensaje con calma
  };

  useEffect(() => {
    // Si nadie toca en 5s, el logo aparece solo en fade in (sin sonido, por regla del navegador)
    const t = setTimeout(() => {
      if (!splashRevealed) {
        setSplashRevealed(true);
        setTimeout(() => setShowSplash(false), 13000);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [splashRevealed]);

  const playWelcomeChime = () => {
    if (chimePlayed.current) return;
    chimePlayed.current = true;
    playIntroChime();
  };

  // ---- Popup "Instala iogga": 1 clic en Android, guía de 2 pasos en iPhone ----
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const isStandalone = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Detecta el navegador para dar instrucciones pokayoke (dónde tocar exactamente).
  const installGuide = (() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    if (/SamsungBrowser/i.test(ua)) return { menu: 'las 3 rayas ☰ (abajo a la derecha)', action: '"Agregar página a" y luego "Pantalla de inicio"' };
    if (/FxiOS|Firefox/i.test(ua)) return { menu: 'los 3 puntos ⋮ (a la derecha)', action: '"Instalar" o "Agregar a la pantalla de inicio"' };
    if (/EdgA|Edg/i.test(ua)) return { menu: 'los 3 puntos ⋯ (abajo)', action: '"Agregar a teléfono" o "Aplicaciones → Instalar"' };
    if (/OPR|Opera/i.test(ua)) return { menu: 'los 3 puntos ⋮', action: '"Agregar a" y luego "Pantalla de inicio"' };
    // Chrome y la mayoría en Android
    return { menu: 'los 3 puntos ⋮ (arriba a la derecha)', action: '"Instalar aplicación" o "Agregar a la pantalla principal"' };
  })();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // guardamos el permiso de Chrome para instalar con nuestro propio botón
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // Link para el sitio web: iogga.com/?install=1 abre la app con el popup de instalación
    if (new URLSearchParams(window.location.search).get('install') === '1' && !isStandalone) {
      setIsIntro(false);
      setTimeout(() => setShowInstall(true), 800);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Ofrecer instalar en el momento correcto (tras un momento de valor), máximo 2 veces
  const maybeOfferInstall = () => {
    if (isStandalone) return;
    const seen = Number(localStorage.getItem('iogga_install_seen') || '0');
    if (seen >= 2) return;
    localStorage.setItem('iogga_install_seen', String(seen + 1));
    setTimeout(() => setShowInstall(true), 700);
  };

  // Categoría seleccionada en Explorar (modo persona) + clasificaciones por palabra clave
  const [personExploreCategory, setPersonExploreCategory] = useState('Todos');
  const [customCats, setCustomCats] = useState<string[]>([]);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Cada categoría agrupa varias palabras clave (para que se llene de verdad).
  const CAT_KEYS: Record<string, string[]> = {
    'Café': ['cafe', 'coworking', 'desayuno'],
    'Cine': ['cine', 'pelicula', 'estreno'],
    'Deporte': ['padel', 'tenis', 'bici', 'correr', 'caminar', 'gym', 'yoga', 'deporte', 'raqueta', 'ciclismo', 'futbol'],
    'Fiesta': ['after', 'bar', 'cerveza', 'antro', 'fiesta', 'concierto', 'musica', 'mezcal', 'boliche'],
    'Comida': ['sushi', 'tacos', 'pizza', 'comida', 'cena', 'alitas', 'postres'],
    'Aire libre': ['cerro', 'senderismo', 'parque', 'naturaleza', 'picnic', 'playa', 'roadtrip'],
    'Viaje': ['viaje', 'cancun', 'roadtrip', 'vacaciones', 'aventura'],
  };
  const PERSON_CATS = ['Todos', ...Object.keys(CAT_KEYS)];
  const matchesCategory = (p: Plan) => {
    if (personExploreCategory === 'Todos') return true;
    const hay = norm(`${p.activity} ${(p.tags || []).join(' ')} ${p.comment || ''}`);
    const keys = CAT_KEYS[personExploreCategory] || [norm(personExploreCategory)]; // categoría personalizada = su propia palabra
    return keys.some(k => hay.includes(k));
  };
  // ---- Caducidad: un plan se "apaga" al pasar su hora de fin ----
  // Sin fecha elegida, se asume el día en que se publicó.
  const planEndMs = (p: Plan): number => {
    const day = p.date || (() => { const d = new Date(p.timestamp || Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const hasEnd = !!p.endTime && p.endTime !== '00:00';
    const hasStart = !!p.startTime && p.startTime !== '00:00';
    const hm = hasEnd ? p.endTime : hasStart ? p.startTime : '23:59';
    const [h, m] = hm.split(':').map(Number);
    const d = new Date(`${day}T00:00:00`);
    d.setHours(isNaN(h) ? 23 : h, isNaN(m) ? 59 : m, 59, 0);
    if (!hasEnd && hasStart) d.setHours(d.getHours() + 2); // sin hora fin: 2h de vida tras el inicio
    return d.getTime();
  };
  const isExpiredPlan = (p: Plan) => !p.isSeed && Date.now() > planEndMs(p);

  // ---- Calificar al anfitrión al terminar el plan (se dispara con la hora de cierre) ----
  const [ratedPlanIds, setRatedPlanIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('iogga_rated') || '[]'); } catch { return []; }
  });
  const [pendingRating, setPendingRating] = useState<Plan | null>(null);
  useEffect(() => {
    if (!currentUser || pendingRating) return;
    // De los planes a los que me uní, ¿alguno ya cerró y aún no califico al anfitrión?
    const toRate = plans.find(p =>
      acceptedPlanIds.includes(p.id) && p.uid && p.uid !== currentUser.uid &&
      isExpiredPlan(p) && !ratedPlanIds.includes(p.id)
    );
    if (toRate) setPendingRating(toRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, acceptedPlanIds, currentUser?.uid, ratedPlanIds, pendingRating]);
  const submitRating = (plan: Plan, stars: number) => {
    if (plan.uid) void rateUser(plan.uid, stars);
    const next = [...ratedPlanIds, plan.id];
    setRatedPlanIds(next);
    try { localStorage.setItem('iogga_rated', JSON.stringify(next)); } catch {}
    setPendingRating(null);
  };

  // ¿Este plan es una invitación PARA MÍ? (de prueba, o me agregaron como invitado)
  const isInviteForMe = (p: Plan) => !isMyPlan(p) && (!!p.isInvitation || (!!currentUser && !!p.invitedUids?.includes(currentUser.uid)));
  // Vivo = no borrado, no cerrado y no caducado. Filtro de TODAS las vistas públicas.
  const isLivePlan = (p: Plan) => !p.deleted && !p.closed && !isExpiredPlan(p);
  // Refrescar cada minuto para que los planes se apaguen solos en pantalla
  const [, setExpiryTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setExpiryTick(x => x + 1), 60000); return () => clearInterval(t); }, []);

  const matchesPromoCategory = (pr: Promotion) => {
    if (personExploreCategory === 'Todos') return true;
    const hay = norm(`${pr.title} ${pr.description || ''} ${(pr.tags || []).join(' ')}`);
    const keys = CAT_KEYS[personExploreCategory] || [norm(personExploreCategory)];
    return keys.some(k => hay.includes(k));
  };

  // ---- Fotos sugeridas por actividad (solo se cargan miniaturas ligeras) ----
  const PHOTO_BANK: [RegExp, string[]][] = [
    [/caf|coffee|desayun/i, ['1509042239860-f550ce710b93', '1541167760496-162955ed8a9f', '1495474472287-4d71bcdd2085']],
    [/cine|peli|movie/i, ['1489599849927-2ee91cede3ba', '1585647347483-22b66260dfff', '1517604931442-7e0c8ed2963c']],
    [/taco|pastor/i, ['1565299585323-38d6b0865b47', '1551504734-5ee1c4a1479b', '1613514785940-daed07799d9b']],
    [/sushi|roll/i, ['1579871494447-9811cf80d66c', '1553621042-f6e147245754', '1611143669185-af224c5e3252']],
    [/yoga|medita/i, ['1544367567-0f2fcb009e0b', '1506126613408-eca07ce68773', '1599901860904-17e6ed7083a0']],
    [/boliche|bol/i, ['1538510127047-9744fd2fa212', '1628432136678-43ff9be34064', '1596727147705-61a532a659bd']],
    [/gym|ejercicio|pesas/i, ['1534438327276-14e5300c3a48', '1571019613454-1cb2f99b2d8b', '1517836357463-d25dfeac3438']],
    [/parque|picnic|aire/i, ['1511671782779-c97d3d27a1d4', '1526307616774-60d0098f7642', '1504280390367-361c6d9f38f4']],
    [/cerve|bar|alitas|chel/i, ['1514933651103-005eec06c04b', '1575037614876-c38a4d44f5b8', '1546726747-421c6d69c929']],
    [/museo|arte|cultura/i, ['1518998053502-5388618f9ee8', '1554907984-15263bfd63bd', '1580136579312-94651dfd596d']],
    [/concierto|música|musica|jam/i, ['1501281668745-f7f57925c3b4', '1470229722913-7c0e2dbbafd3', '1493225457124-a3eb161ffa5f']],
    [/scooter|bici|paseo|rodada/i, ['1558981403-c5f9899a28bc', '1571068316344-75bc76f77890', '1485965120184-e220f721d03e']],
  ];
  const suggestedPhotos = (activity: string): string[] => {
    const found = PHOTO_BANK.find(([re]) => re.test(activity || ''));
    const ids = found ? found[1] : ['1529156069898-49953e39b3ac', '1517457373958-b7bdd4587205', '1492684223066-81342ee5ff30'];
    return ids.map(id => `https://images.unsplash.com/photo-${id}`);
  };

  // ---- Fórmula universal del mensaje de invitación ----
  // Construye una frase natural con TODO lo que el usuario proporcionó,
  // saltándose con gramática correcta lo que no puso.
  const buildInviteMessage = (plan: Plan) => {
    const parts: string[] = [];
    const rawName = (plan.userName || '').trim();
    // Sin nombre real (sin sesión): hablamos de "alguien que te conoce".
    const isGeneric = !rawName || rawName === 'Alguien' || rawName === 'Tú' || rawName === GUEST_NAME;
    const firstName = isGeneric ? 'Alguien que te conoce' : rawName.split(' ')[0];
    parts.push(`${firstName} desea: ${plan.activity}.`);

    // Horario completo: "de 8:00 a 10:00" (o solo la hora de inicio si no hay fin)
    const hasEnd = plan.endTime && plan.endTime !== '00:00';
    const hasStart = plan.startTime && plan.startTime !== '00:00';
    const timePart = hasStart && hasEnd ? `de ${plan.startTime} a ${plan.endTime}` : hasStart ? `a las ${plan.startTime}` : '';
    const when = [plan.dateLabel, timePart].filter(Boolean).join(' ');
    // Ubicaciones: 2 → "aquí o acá"; 3+ → "a, b o c"
    const allPlaces = [plan.location, ...(plan.locations || [])].filter(l => l && l.trim());
    const place = allPlaces.length > 1
      ? allPlaces.slice(0, -1).join(', ') + ' o ' + allPlaces[allPlaces.length - 1]
      : allPlaces[0] || '';
    if (place && when) parts.push(`Estará en ${place} ${when}.`);
    else if (place) parts.push(`Estará en ${place}.`);
    else if (when) parts.push(`Será ${when}.`);

    const transport =
      plan.transport === 'has-transport' ? 'Tiene transporte' :
      plan.transport === 'each-arrives' ? 'Cada quien llega' :
      plan.transport === 'no-transport' ? 'Sin transporte' :
      plan.transport === 'not-needed' ? 'No se necesita transporte' : '';
    if (transport) parts.push(`${transport}${plan.transportNote ? ` (${plan.transportNote})` : ''}.`);

    const budget =
      plan.budget === 'invites' ? `Invita ${firstName}` :
      plan.budget === 'split' ? 'Cada quien paga lo suyo' :
      plan.budget === 'no-money' ? 'Sin presupuesto' :
      plan.budget === 'not-needed' ? 'No se necesita dinero' : '';
    if (budget) parts.push(`${budget}${plan.budgetAmount ? ` (${plan.budgetAmount})` : ''}.`);

    if (plan.comment) parts.push(`"${plan.comment}".`);

    const offerId = plan.inviterSelectedOfferId || userSelectedOfferIds[plan.id];
    const offer = offerId ? promos.find(p => p.id === offerId) : null;
    if (offer) parts.push(`Tiene una oferta: ${offer.title} en ${offer.businessName}.`);

    let msg = parts.join(' ');
    // Clave privada: la frase que dejó la persona para dar confianza (no entre comillas).
    if (plan.privateKey && plan.privateKey.trim()) msg += `\n\nClave privada: ${plan.privateKey.trim()}`;
    return msg;
  };

  // ---- Invitaciones virales por WhatsApp (sin acceso a contactos) ----
  // El link abre la app mostrando una invitación personalizada.
  const inviteText = (plan: Plan) => {
    const rawName = (plan.userName || '').trim();
    const isGeneric = !rawName || rawName === 'Alguien' || rawName === 'Tú' || rawName === GUEST_NAME;
    const who = isGeneric ? 'Alguien que te conoce' : rawName.split(' ')[0];
    const link = `${window.location.origin}/?inv=${plan.id}`;
    // La clave privada da confianza: aclara que el enlace no es virus ni fraude.
    const trust = plan.privateKey && plan.privateKey.trim()
      ? `Para que no desconfíes, la persona dejó esta clave privada para que sepas que no es virus ni fraude.\nClave privada: ${plan.privateKey.trim()}\n\n`
      : '';
    return `${who} tiene un plan que puede interesarte:\n\n${link}\n\n${trust}iogga es la app para salir del móvil y vivir lo espontáneo. Es web: sin descargas y sin ocupar espacio.`;
  };

  const sharePlanWhatsApp = (plan: Plan) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText(plan))}`, '_blank');
  };

  // Compartir una promoción por donde sea; el link siempre lleva a iogga.
  const promoShareText = (promo: Promotion) =>
    `🔥 ${promo.title} — ${promo.offer || ''} en ${promo.businessName}.\n${promo.description || ''}\n\nActívala en iogga: ${window.location.origin}/?promo=${promo.id}\n\niogga es la app para salir del móvil y vivir lo espontáneo.`;
  const sharePromo = async (promo: Promotion) => {
    const text = promoShareText(promo);
    const url = `${window.location.origin}/?promo=${promo.id}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: promo.title, text, url }); return; } catch { /* cancelado */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Si alguien llega con un link de invitación (?inv=ID), mostrarla de inmediato
  const [invitationPlan, setInvitationPlan] = useState<Plan | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invId = params.get('inv');
    if (invId) {
      fetchDocIn<Plan>('plans', invId).then(p => {
        if (p) { setInvitationPlan(p); setIsIntro(false); }
      });
    }
    // Enlace de una promoción compartida: abre su tarjeta en iogga.
    const promoId = params.get('promo');
    if (promoId) {
      const local = SEED_PROMOS.find(pr => pr.id === promoId);
      if (local) { setSelectedPromo(local); setIsIntro(false); }
      else fetchDocIn<Promotion>('promos', promoId).then(pr => { if (pr) { setSelectedPromo(pr); setIsIntro(false); } });
    }
  }, []);
  // Al abrir "Editar Perfil", precargar lo que ya tiene guardado
  useEffect(() => {
    if (showEditProfile) {
      setEditName(userProfile.name || currentUser?.name || '');
      setEditBio(userProfile.bio || '');
      setEditLocation(userProfile.location || '');
      setEditPhoto(userProfile.photoURL || '');
      setEditWhatsapp(userProfile.whatsapp || '');
      setEditInstagram(userProfile.instagram || '');
      setEditLinks({ website: userProfile.website || '', facebook: userProfile.facebook || '', tiktok: userProfile.tiktok || '', linkedin: userProfile.linkedin || '' });
    }
  }, [showEditProfile]);

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  ];

  // Contar visitas (para decidir si mostramos el intro en futuras aperturas).
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('iogga_visits') || '0');
      localStorage.setItem('iogga_visits', String(v + 1));
    } catch {}
  }, []);

  // Si veníamos de iniciar sesión con Google por redirección, completarlo
  useEffect(() => {
    void completeGoogleRedirect().then(u => {
      if (u) {
        setCurrentUser(u);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        triggerBeta('¡Sesión iniciada!', `Bienvenido${u.name ? `, ${u.name}` : ''} a iogga.`);
      }
    });
  }, []);

  // Mantener la sesión iniciada (Firebase recuerda al usuario entre visitas)
  useEffect(() => {
    const unsubscribe = watchAuth(user => {
      setCurrentUser(user);
      // Los invitados anónimos pueden publicar, pero no cuentan como "registrados"
      if (user && !user.isAnonymous) {
        setIsLoggedIn(true);
        // Usuario registrado: nada de recorrido ni popups de explicación
        setShowTutorial(false);
        try { localStorage.setItem('iogga_tutorial_completed', 'true'); } catch {}
      }
    });
    return unsubscribe;
  }, []);

  // Perfil extendido del usuario (bio, ubicación, foto) para el medidor de perfil
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  useEffect(() => {
    if (!currentUser) {
      setUserProfile({});
      return;
    }
    return watchProfile(currentUser.uid, setUserProfile);
  }, [currentUser?.uid]);

  // Al cargar el perfil, restaurar también el negocio guardado (una cuenta, dos caras)
  useEffect(() => {
    if (userProfile.business) {
      setBusinessProfile(prev => ({ ...prev, ...userProfile.business }));
      setHasBusiness(true);
    }
  }, [userProfile.business]);

  // ---- Amigos (seguir) y notificaciones reales ----
  const [following, setFollowing] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<Friend[]>([]);
  const [showFriends, setShowFriends] = useState<null | 'following' | 'followers'>(null);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendResults, setFriendResults] = useState<Friend[]>([]);
  const [allUsers, setAllUsers] = useState<Friend[]>([]); // universo real de iogga
  const [selectedFriend, setSelectedFriend] = useState<(Friend & { rating?: number }) | null>(null); // perfil de una persona
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [pendingFriendIds, setPendingFriendIds] = useState<string[]>([]);
  const [ioggaSent, setIoggaSent] = useState(false); // palomita "Enviado" en la pantalla final
  const [invitePreviewMore, setInvitePreviewMore] = useState(false); // "ver más" amigos en la pantalla final
  const [statusImg, setStatusImg] = useState<string | null>(null); // imagen 9:16 para el estado
  // Generar la imagen del estado cuando se abre "Revisa y publica"
  useEffect(() => {
    if (showMatchCelebration && lastPublishedPlan) {
      setStatusImg(null);
      // El protagonista es el texto de la invitación (sin la clave privada, que es privada)
      const msg = buildInviteMessage(lastPublishedPlan).split('\n\nClave privada:')[0];
      void buildStatusImage(msg, lastPublishedPlan.image).then(setStatusImg).catch(() => setStatusImg(null));
    }
  }, [showMatchCelebration, lastPublishedPlan?.id]);
  const [realNotifs, setRealNotifs] = useState<AppNotif[]>([]);
  const [invitePlan, setInvitePlan] = useState<Plan | null>(null); // ventana "invitar en iogga / WhatsApp"
  const [inviteSel, setInviteSel] = useState<string[]>([]); // amigos elegidos para invitar a ese plan
  // Abrir la ventana de invitar; conserva la selección si es el mismo plan
  const openInvite = (plan: Plan) => {
    setInvitePlan(prev => {
      if (!prev || prev.id !== plan.id) setInviteSel([]);
      return plan;
    });
  };
  const [confirmSel, setConfirmSel] = useState<string[]>([]); // unidos que el anfitrión acepta
  // Al abrir un plan mío, precargar a quiénes ya acepté (palomitas persistentes)
  useEffect(() => {
    if (selectedPlanForDetails) setConfirmSel(selectedPlanForDetails.confirmedUids || []);
  }, [selectedPlanForDetails?.id]);

  // Enviar la intención a los amigos de iogga seleccionados (notificación real)
  // Enviar invitación de iogga a amigos reales: manda la notificación (campana)
  // Y agrega sus uid a invitedUids del plan (para que aparezca en SU bandeja).
  const sendIoggaInvites = (plan: Plan, uids: string[]) => {
    const realIds = uids.filter(id => id && !id.startsWith('su_'));
    if (realIds.length === 0) return;
    realIds.forEach(fid => {
      void sendNotification({
        type: 'invite',
        to: fid,
        fromName: plan.userName,
        title: `${plan.userName.split(' ')[0]} tiene un plan`,
        message: buildInviteMessage(plan),
        planId: plan.id,
      });
    });
    const nextInvited = Array.from(new Set([...(plan.invitedUids || []), ...realIds]));
    void saveDocIn('plans', plan.id, { ...plan, invitedUids: nextInvited });
    // Reflejarlo también en memoria por si el snapshot tarda
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, invitedUids: nextInvited } : p));
  };
  const notifyPendingFriends = (plan: Plan) => sendIoggaInvites(plan, pendingFriendIds);

  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous) {
      setFollowing([]); setFollowers([]); setRealNotifs([]);
      return;
    }
    const u1 = watchFollowing(currentUser.uid, setFollowing);
    const u2 = watchFollowers(currentUser.uid, setFollowers);
    const u3 = watchNotifications(currentUser.uid, setRealNotifs);
    return () => { u1(); u2(); u3(); };
  }, [currentUser?.uid, currentUser?.isAnonymous]);

  // Al abrir "Amigos", cargar TODOS los registrados reales de iogga
  useEffect(() => {
    if (!showFriends) return;
    void listUsers(currentUser?.uid || '').then(setAllUsers);
  }, [showFriends, currentUser?.uid]);

  // Búsqueda de usuarios para agregar (con pequeño retardo)
  useEffect(() => {
    if (!currentUser || friendSearch.trim().length < 2) { setFriendResults([]); return; }
    const t = setTimeout(async () => {
      const res = await searchUsers(friendSearch, currentUser.uid);
      setFriendResults(res);
    }, 350);
    return () => clearTimeout(t);
  }, [friendSearch, currentUser?.uid]);

  // Seguidos de PRUEBA (usuarios semilla): se guardan localmente para la demo.
  const [seedFollowIds, setSeedFollowIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('iogga_seed_follows') || '[]'); } catch { return []; }
  });
  const persistSeedFollows = (ids: string[]) => { setSeedFollowIds(ids); try { localStorage.setItem('iogga_seed_follows', JSON.stringify(ids)); } catch {} };
  const isSeedUid = (uid: string) => uid.startsWith('su_');
  const isFollowing = (uid: string) => following.some(f => f.uid === uid) || seedFollowIds.includes(uid);
  const toggleFollow = async (f: Friend) => {
    if (isSeedUid(f.uid)) {
      persistSeedFollows(seedFollowIds.includes(f.uid) ? seedFollowIds.filter(id => id !== f.uid) : [...seedFollowIds, f.uid]);
      return;
    }
    if (!currentUser) { setShowLoginModal(true); return; }
    if (isFollowing(f.uid)) await unfollowUser(currentUser.uid, f.uid);
    else await followUser(currentUser, f);
  };
  // Amigos que sigo, incluyendo los de prueba (para que las listas se vean llenas).
  const followingAll: Friend[] = [
    ...following,
    ...SEED_USERS.filter(u => seedFollowIds.includes(u.uid)).map(u => ({ uid: u.uid, name: u.name, photo: u.photo })),
  ];
  // Seguidores (reales + algunos de prueba, para simular la experiencia).
  const followersAll: Friend[] = [
    ...followers,
    ...SEED_USERS.slice(0, 4).map(u => ({ uid: u.uid, name: u.name, photo: u.photo })),
  ];
  const unreadNotifs = realNotifs.filter(n => !n.read).length;
  // Sonido al llegar una notificación nueva (no en la carga inicial).
  const prevNotifCount = useRef<number | null>(null);
  useEffect(() => {
    if (prevNotifCount.current !== null && realNotifs.length > prevNotifCount.current) {
      try { playChime('campanitas'); } catch {}
    }
    prevNotifCount.current = realNotifs.length;
  }, [realNotifs.length]);

  // Ventas REALES del negocio (canjes validados) para las gráficas
  const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([]);
  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous) {
      setMyRedemptions([]);
      return;
    }
    return watchMyRedemptions(currentUser.uid, setMyRedemptions);
  }, [currentUser?.uid]);

  // Serie de ventas por día (últimos 7 días) a partir de canjes reales
  const salesSeries = (promoId?: string) => {
    const days: { name: string; sales: number }[] = [];
    const DOWS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const total = myRedemptions
        .filter(r => r.status === 'redeemed' && (r.redeemedAtMs || r.createdAtMs) >= start && (r.redeemedAtMs || r.createdAtMs) < end)
        .filter(r => !promoId || r.promoId === promoId)
        .reduce((s, r) => s + (r.priceAmount || 0), 0);
      days.push({ name: DOWS[d.getDay()], sales: total });
    }
    // Tendencia: promedio móvil de 3 días
    return days.map((d, i) => {
      const win = days.slice(Math.max(0, i - 2), i + 1);
      return { ...d, trend: Math.round(win.reduce((s, x) => s + x.sales, 0) / win.length) };
    });
  };

  // ¿Este plan es mío? (con Firebase: por dueño; en demo: el usuario de ejemplo)
  const isMyPlan = (p: Plan) => (p.uid ? p.uid === currentUser?.uid : p.userName === GUEST_NAME);

  // Medidor "completa tu perfil": 5 pasos sencillos
  const profileSteps: { label: string; done: boolean }[] = [
    { label: 'Crear tu cuenta', done: !!currentUser },
    { label: 'Tu nombre', done: !!(currentUser?.name && currentUser.name.length > 1) },
    { label: 'Tu foto real', done: !!userProfile.photoURL },
    { label: 'Tu WhatsApp (para coordinar tus planes)', done: !!userProfile.whatsapp },
    { label: 'Tu biografía', done: !!userProfile.bio },
    { label: 'Tu ubicación', done: !!userProfile.location },
  ];
  const profileDone = profileSteps.filter(s => s.done).length;

  // Analíticas REALES del negocio: suman los canjes QR validados de sus promos
  const myPromos = promos.filter(p => (p.uid ? p.uid === currentUser?.uid : !isFirebaseEnabled));
  // ¿Ya creó algo? (para mostrar pistas solo a quien aún no tiene plan ni oferta)
  const hasCreatedAnything = plans.some(p => isMyPlan(p)) || myPromos.length > 0;
  const bizTotals = {
    earnings: myPromos.reduce((s, p) => s + (p.totalEarnings || 0), 0),
    scans: myPromos.reduce((s, p) => s + (p.qrScans || 0), 0),
    sales: myPromos.reduce((s, p) => s + (p.salesCount || 0), 0),
  };
  const [selectedChannel, setSelectedChannel] = useState<'both' | 'whatsapp' | 'iogga'>('both');
  const [dismissedMatchIds, setDismissedMatchIds] = useState<string[]>([]);

  const ensureLoggedIn = (action: () => void) => {
    if (isLoggedIn) {
      action();
    } else {
      setLoginActionToResume(() => action);
      setShowLoginModal(true);
    }
  };

  // Coincidence / Link calculation functions
  // Coincidencias de la comunidad: planes p\u00fablicos con palabras similares al tuyo,
  // ordenados por qu\u00e9 tanto se parecen (usa el motor ligero, sin costo de IA).
  const getMatchingPlansForPlan = (targetPlan: Plan) => {
    if (!targetPlan || !targetPlan.activity) return [];
    const q = tokenize(`${targetPlan.activity} ${(targetPlan.tags || []).join(' ')} ${targetPlan.comment || ''}`);
    return plans
      .filter(p => p.id !== targetPlan.id && p.isPublic && !isMyPlan(p) && isLivePlan(p))
      .map(p => ({ p, score: similarity(q, `${p.activity} ${(p.tags || []).join(' ')} ${p.comment || ''}`) }))
      .filter(x => x.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .map(x => x.p);
  };

  const getMatchingPromosForPlan = (targetPlan: Plan) => {
    if (!targetPlan || !targetPlan.activity) return [];
    const q = tokenize(`${targetPlan.activity} ${(targetPlan.tags || []).join(' ')} ${targetPlan.comment || ''}`);
    return promos
      .map(pr => ({ pr, score: similarity(q, `${pr.title} ${pr.description || ''} ${(pr.tags || []).join(' ')}`) }))
      .filter(x => x.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .map(x => x.pr);
  };

  const getMatchingPlansForPromo = (targetPromo: Promotion) => {
    if (!targetPromo || !targetPromo.title) return [];
    const prWords = targetPromo.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
    return plans.filter(p => isLivePlan(p)).filter(p => {
      const activityNorm = p.activity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const pWords = activityNorm.split(/\s+/).filter(w => w.length > 2);
      const sharesWord = pWords.some(w => prWords.includes(w) || targetPromo.title.toLowerCase().includes(w));
      const sharesTag = p.tags.some(t => targetPromo.tags.includes(t) || targetPromo.title.toLowerCase().includes(t.toLowerCase()) || p.activity.toLowerCase().includes(t.toLowerCase()));
      return sharesWord || sharesTag;
    });
  };

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem('iogga_tutorial_completed'); } catch { return true; }
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialMode, setTutorialMode] = useState<UserMode>('person');

  useEffect(() => {
    if (!showTutorial) return;

    if (tutorialMode === 'person') {
      if (tutorialStep <= 2 || tutorialStep === 5) setActiveTab('home');
      else if (tutorialStep === 3) setActiveTab('search');
      else if (tutorialStep === 4) setActiveTab('profile');
    } else {
      if (tutorialStep === 0 || tutorialStep === 1 || tutorialStep >= 3) setActiveTab('home');
      else if (tutorialStep === 2) setActiveTab('search');
    }
  }, [tutorialStep, tutorialMode, showTutorial]);

  useEffect(() => {
    if (mode === 'business' && activeTab === 'search') {
      const interval = setInterval(() => {
        setGroupedPlans(prev => {
          const updated = prev.map(g => {
            // Randomly boost some plans to create a "fighting for first place" effect
            const boost = Math.random() > 0.8 ? Math.floor(Math.random() * 12) + 5 : (Math.random() > 0.5 ? 3 : -3);
            return {
              ...g,
              count: Math.max(5, g.count + boost)
            };
          });
          // Sort to trigger layout animation
          return [...updated].sort((a, b) => b.count - a.count);
        });
      }, 4000); // Swapping every 4 seconds as requested
      return () => clearInterval(interval);
    }
  }, [mode, activeTab]);

  const getPlanDescription = (plan: Plan) => {
    const budgetText = plan.budget === 'invites' ? 'él invita' : plan.budget === 'split' ? 'cada quien paga' : plan.budget === 'not-needed' ? 'no se necesita dinero' : 'sin costo';
    const transportText = plan.transport === 'has-transport' ? 'puede pasar por ti' : plan.transport === 'each-arrives' ? 'cada quien llega' : plan.transport === 'not-needed' ? 'no se necesita transporte' : 'busca ride';
    const budgetAmountText = plan.budgetAmount ? ` (${plan.budgetAmount})` : '';
    
    return `${plan.userName} quiere ${plan.activity} de ${plan.startTime} a ${plan.endTime}, en ${plan.location}, ${budgetText}${budgetAmountText} y ${transportText}.`;
  };

  useEffect(() => {
    const updateIdeas = () => {
      const shuffled = [...IDEAS].sort(() => 0.5 - Math.random());
      setVisibleIdeas(shuffled.slice(0, 12));
    };
    updateIdeas();
    // Solo refrescar en la intro; durante crear plan evita redibujar y cortar el dictado.
    if (!isIntro || showCreatePlan) return;
    const interval = setInterval(updateIdeas, 6000);
    return () => clearInterval(interval);
  }, [isIntro, showCreatePlan]);

  // Form states
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    activity: '',
    startTime: '09:00',
    endTime: '12:00',
    location: '',
    budget: 'split',
    transport: 'each-arrives',
    guests: 'public',
    isPublic: true,
    budgetAmount: '',
    transportNote: ''
  });

  const [newPromo, setNewPromo] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    price: '',
    offer: '',
    location: ''
  });

  useEffect(() => {
    const handleOpenCreatePromo = () => setShowCreatePromo(true);
    window.addEventListener('open-create-promo', handleOpenCreatePromo);
    return () => window.removeEventListener('open-create-promo', handleOpenCreatePromo);
  }, []);

  const handlePublishPlan = async () => {
    // Publicar NO exige registro: se crea una sesión silenciosa.
    // El registro se pide después, cuando alguien acepte su plan.
    let publisher = currentUser;
    if (isFirebaseEnabled && !publisher) {
      publisher = await ensureAnonSession();
      if (publisher) setCurrentUser(publisher);
    }
    if (isFirebaseEnabled && !publisher) {
      // Respaldo: si el acceso anónimo no está habilitado, pedir login normal
      setLoginActionToResume(() => { void handlePublishPlan(); });
      setShowLoginModal(true);
      return;
    }
    const publisherName = publisher && !publisher.isAnonymous
      ? publisher.name
      : (guestName.trim() || 'Alguien');
    const randomPhoto = `https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80`;

    if (editingPlanId) {
      const edited = plans.find(p => p.id === editingPlanId);
      if (edited) {
        const updated = {
          ...edited,
          activity: newPlan.activity || edited.activity,
          startTime: newPlan.startTime || edited.startTime,
          endTime: newPlan.endTime || edited.endTime,
          location: newPlan.location || edited.location,
          budget: newPlan.budget as any,
          budgetAmount: newPlan.budgetAmount,
          transport: newPlan.transport as any,
          transportNote: newPlan.transportNote,
          guests: newPlan.guests as any,
          isPublic: newPlan.isPublic ?? edited.isPublic,
          image: newPlan.image || edited.image,
          tags: (newPlan.activity || '').toLowerCase().split(' ')
        };
        void saveDocIn('plans', updated.id, updated);
      }
      setPlans(plans.map(p => p.id === editingPlanId ? {
        ...p,
        activity: newPlan.activity || p.activity,
        startTime: newPlan.startTime || p.startTime,
        endTime: newPlan.endTime || p.endTime,
        location: newPlan.location || p.location,
        budget: newPlan.budget as any,
        budgetAmount: newPlan.budgetAmount,
        transport: newPlan.transport as any,
        transportNote: newPlan.transportNote,
        guests: newPlan.guests as any,
        isPublic: newPlan.isPublic ?? p.isPublic,
        image: newPlan.image || p.image,
        tags: (newPlan.activity || '').toLowerCase().split(' ')
      } : p));
      setEditingPlanId(null);
    } else {
      const plan: Plan = {
        id: Math.random().toString(36).substr(2, 9),
        uid: publisher?.uid,
        whatsapp: userProfile.whatsapp || undefined,
        userName: publisherName,
        userAvatar: userProfile.photoURL || GENERIC_AVATAR,
        activity: newPlan.activity || 'Plan sin nombre',
        comment: newPlan.comment,
        privateKey: newPlan.privateKey?.trim() || undefined,
        date: newPlan.date,
        dateLabel: newPlan.dateLabel,
        locations: (newPlan.locations || []).filter(l => l.trim()),
        startTime: newPlan.startTime || '00:00',
        endTime: newPlan.endTime || '00:00',
        location: newPlan.location || 'Ubicación',
        budget: newPlan.budget as any,
        budgetAmount: newPlan.budgetAmount,
        transport: newPlan.transport as any,
        transportNote: newPlan.transportNote,
        guests: newPlan.guests as any,
        acceptedCount: 0,
        timestamp: Date.now(),
        isPublic: newPlan.isPublic ?? true,
        image: newPlan.image || randomPhoto,
        tags: (newPlan.activity || '').toLowerCase().split(' '),
        // A los amigos reales invitados les aparece en su bandeja "Invitaciones"
        invitedUids: selectedFriendIds.filter(id => !id.startsWith('su_')),
      };
      void saveDocIn('plans', plan.id, plan);
      setPendingFriendIds([...selectedFriendIds]); // se enviarán al confirmar en "Verifica tu mensaje"
      setPlans([plan, ...plans]);
      setLastPublishedPlan(plan);
      setIoggaSent(false);
      setInvitePreviewMore(false);
      setShowMatchCelebration(true);
    }
    setShowCreatePlan(false);
    setCurrentPlanStep(0);
    setActiveTab('active'); // Switch to active plans so they see it there too!
    setSelectedFriendIds([]);
    // Reset form
    setNewPlan({
      activity: '',
      startTime: '09:00',
      endTime: '12:00',
      location: '',
      budget: 'split',
      transport: 'each-arrives',
      guests: 'public',
      isPublic: true,
      image: undefined
    });
  };

  const handlePublishPromo = async () => {
    // Primera oferta GRATIS sin cuenta (sesión anónima); a partir de la 2ª, pedir login.
    const myCount = promos.filter(p => p.uid && p.uid === currentUser?.uid).length;
    if (isFirebaseEnabled && !isLoggedIn && !editingPromoId && myCount >= 1) {
      triggerBeta('Crea tu cuenta', 'Tu primera oferta ya está publicada. Para publicar más, inicia sesión gratis y así no pierdes tus ofertas.');
      setLoginActionToResume(() => { void handlePublishPromo(); });
      setShowLoginModal(true);
      return;
    }
    // Asegurar sesión (anónima) para poder guardar la primera oferta sin registro
    let publisher = currentUser;
    if (isFirebaseEnabled && !publisher) {
      publisher = await ensureAnonSession();
      if (publisher) setCurrentUser(publisher);
    }
    if (editingPromoId) {
      const edited = promos.find(p => p.id === editingPromoId);
      if (edited) {
        void saveDocIn('promos', edited.id, {
          ...edited,
          title: newPromo.title || edited.title,
          description: newPromo.description || edited.description,
          price: newPromo.price || edited.price,
          offer: newPromo.offer || edited.offer,
          location: newPromo.location || edited.location,
          image: promoImage || edited.image,
          tags: (newPromo.title || '').toLowerCase().split(' ')
        });
      }
      setPromos(promos.map(p => p.id === editingPromoId ? {
        ...p,
        title: newPromo.title || p.title,
        description: newPromo.description || p.description,
        price: newPromo.price || p.price,
        offer: newPromo.offer || p.offer,
        location: newPromo.location || p.location,
        image: promoImage || p.image,
        tags: (newPromo.title || '').toLowerCase().split(' ')
      } : p));
      setEditingPromoId(null);
    } else {
      const promo: Promotion = {
        id: Math.random().toString(36).substr(2, 9),
        uid: publisher?.uid,
        timestamp: Date.now(),
        businessName: businessProfile.name || currentUser?.name || 'Mi Negocio',
        businessLogo: businessProfile.logo || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80',
        title: newPromo.title || 'Promo',
        description: newPromo.description || '',
        price: newPromo.price || '$0',
        offer: newPromo.offer || '',
        image: promoImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        location: businessProfile.location || 'Chihuahua, MX',
        // Estadísticas reales: inician en cero y crecen con el uso
        realTimeSearchers: 0,
        qrScans: 0,
        salesCount: 0,
        totalEarnings: 0,
        tags: (newPromo.title || '').toLowerCase().split(' ')
      };
      void saveDocIn('promos', promo.id, promo);
      setPromos([promo, ...promos]);
    }
    setShowCreatePromo(false);
    setPromoImage(null);
    setNewPromo({
      title: '',
      description: '',
      price: '',
      offer: '',
      location: ''
    });
    setActiveTab('profile'); // al publicar, llevar al perfil del negocio
  };

  const handleStart = () => {
    // Estilo TikTok: entrar y explorar es libre, sin pedir cuenta.
    // El login solo aparece en momentos clave (publicar, aceptar, canjear).
    playWelcomeChime();
    setIsIntro(false);
    setShowCreatePlan(true);
    setActiveTab('search');
  };

  const handleSkipIntro = () => {
    playWelcomeChime();
    // Continue directly as guest (not logged in)
    setIsLoggedIn(false);
    setIsIntro(false);
    setActiveTab('search');
  };

  const handleAcceptPlan = (id: string) => {
    // Momento clave: aceptar un plan requiere cuenta (explorar sigue siendo libre)
    ensureLoggedIn(() => {
      setAcceptedPlanIds(prev => (prev.includes(id) ? prev : [...prev, id]));
      const plan = plans.find(p => p.id === id);
      if (currentUser) {
        void acceptPlanAs(id, currentUser, userProfile.photoURL);
      } else {
        void incrementPlanAccepted(id);
      }
      // Avisar EN VIVO al creador del plan que alguien se unió (notificación real).
      if (plan?.uid && currentUser && plan.uid !== currentUser.uid) {
        const me = (currentUser.name || 'Alguien').split(' ')[0];
        void sendNotification({
          type: 'accepted',
          to: plan.uid,
          fromName: currentUser.name || 'Alguien',
          title: `${me} se unió a tu plan`,
          message: `${me} se apuntó a "${plan.activity}". Pónganse de acuerdo.`,
          planId: plan.id,
        });
      }
      // Al unirte, si el creador dejó WhatsApp, abre el chat para coordinar.
      if (plan?.whatsapp) {
        window.open(waLink(plan.whatsapp, `¡Hola ${plan.userName}! Me uní a tu plan "${plan.activity}" en iogga. ¿Sigue en pie?`), '_blank');
      }
    });
  };

  const handleIgnorePlan = (id: string) => {
    setIgnoredPlanIds([...ignoredPlanIds, id]);
  };

  const handleEditPlan = (plan: Plan) => {
    setNewPlan({
      activity: plan.activity,
      startTime: plan.startTime,
      endTime: plan.endTime,
      location: plan.location,
      budget: plan.budget,
      transport: plan.transport,
      guests: plan.guests,
      isPublic: plan.isPublic,
      image: plan.image
    });
    setEditingPlanId(plan.id);
    setCurrentPlanStep(0);
    setShowCreatePlan(true);
  };

  const handleEditPromo = (promo: Promotion) => {
    setNewPromo({
      title: promo.title,
      description: promo.description,
      price: promo.price,
      offer: promo.offer,
      location: promo.location
    });
    setPromoImage(promo.image);
    setEditingPromoId(promo.id);
    setShowCreatePromo(true);
  };

  const handleDeletePlan = (id: string) => {
    void deleteDocIn('plans', id);
    setPlans(plans.filter(p => p.id !== id));
  };

  const handleVerOfertas = (plan: Plan) => {
    setActiveTab('search');
    setSearchFilter('promos');
    
    // Extract key food search terms from plan's activity or tags
    const activityLower = plan.activity.toLowerCase();
    let term = '';
    if (activityLower.includes('caf')) term = 'Café';
    else if (activityLower.includes('piz')) term = 'Pizza';
    else if (activityLower.includes('hambur')) term = 'Hamburguesa';
    else if (activityLower.includes('taco')) term = 'Tacos';
    else if (activityLower.includes('cerve') || activityLower.includes('chel') || activityLower.includes('alitas')) term = 'Cerveza';
    else if (activityLower.includes('comid') || activityLower.includes('cenar') || activityLower.includes('almorz') || activityLower.includes('restaurante')) term = 'Comida';
    else if (activityLower.includes('sush')) term = 'Sushi';
    else if (activityLower.includes('postr') || activityLower.includes('dulc') || activityLower.includes('pastel')) term = 'Postres';
    else {
      // Find any tags that might represent foods, or default to the first word
      const words = plan.activity.split(' ').filter(w => w.length > 3);
      term = words.length > 0 ? words[0] : plan.activity;
    }
    
    setSearchQuery(term);
    triggerBeta("Búsqueda de Ofertas", `Hemos asociado tu plan de "${plan.activity}" para buscar las mejores ofertas de ${term} en Chihuahua.`);
  };

  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [notificationsPerson, setNotificationsPerson] = useState<AppNotification[]>(MOCK_NOTIFICATIONS_PERSON);
  const [notificationsBusiness, setNotificationsBusiness] = useState<AppNotification[]>(MOCK_NOTIFICATIONS_BUSINESS);
  const [groupedPlans, setGroupedPlans] = useState(MOCK_GROUPED_PLANS);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (mode === 'person') {
      setActiveTab('home');
    } else {
      setActiveTab('analytics');
    }
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const handleOpenProfile = (e: any) => setSelectedUserProfile(e.detail);
    window.addEventListener('open-user-profile', handleOpenProfile);
    return () => window.removeEventListener('open-user-profile', handleOpenProfile);
  }, []);

  const [showBizWelcome, setShowBizWelcome] = useState(false);
  const [showPersonWelcome, setShowPersonWelcome] = useState(false);

  // Al terminar el splash, mostrar la bienvenida de persona (una sola vez).
  // Si el usuario nuevo verá el recorrido (tutorial), ese ya lo da la bienvenida.
  useEffect(() => {
    if (showSplash || showTutorial) return;
    try {
      if (!localStorage.getItem('iogga_person_welcome')) {
        localStorage.setItem('iogga_person_welcome', '1');
        const t = setTimeout(() => setShowPersonWelcome(true), 500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [showSplash, showTutorial]);

  const toggleMode = (newMode: UserMode) => {
    // Sin barreras: cualquiera puede entrar al modo negocio y explorar
    setMode(newMode);
    setShowModeMenu(false);
    if (newMode === 'business') {
      setHasBusiness(true);
      setActiveTab('analytics');
      // Primera vez sin perfil de negocio: bienvenida magnética (una sola vez)
      if (!businessProfile.name && !localStorage.getItem('iogga_biz_welcome')) {
        try { localStorage.setItem('iogga_biz_welcome', '1'); } catch {}
        setShowBizWelcome(true);
      }
    } else {
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-900">
      <div className={`app-container transition-all duration-700 ${isIntro ? 'bg-zinc-950' : (mode === 'person' ? 'bg-indigo-950' : 'bg-teal-950')} flex flex-col relative`}>
        {isIntro ? (
          <div onClickCapture={playWelcomeChime} className="flex flex-col items-center [justify-content:safe_center] p-8 pb-[max(3rem,env(safe-area-inset-bottom))] text-center relative overflow-y-auto no-scrollbar h-full">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-iogga-primary/20 blur-[120px] rounded-full" />
            
            <button 
              onClick={handleSkipIntro}
              className="absolute top-12 right-6 p-2.5 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all active:scale-90 border border-white/10 z-50"
            >
              <X size={20} />
            </button>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 relative z-10"
            >
              <Logo size="sm" />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full space-y-4 relative z-10"
            >
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">¿Cuál es tu plan hoy?</h2>
              
              <div className="relative" id="tutorial-intro-input">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles size={14} className="text-iogga-primary animate-pulse" />
                  <span className="text-[10px] font-black text-iogga-primary uppercase tracking-[0.2em]">Escribe, dicta o platícalo</span>
                </div>
                {/* Barra estilo chat: escribir + platica (voz) + dictar, dentro de la barra */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe tus planes o deseos"
                    value={newPlan.activity || ''}
                    onChange={e => setNewPlan({...newPlan, activity: e.target.value})}
                    className="w-full h-16 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setIsIntro(false); setShowCreatePlan(true); startPlaticaAt(0); }}
                      title="Platícalo por voz"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-iogga-primary/15 text-iogga-primary hover:bg-iogga-primary/25 transition-all active:scale-90"
                    >
                      <AudioLines size={16} />
                    </button>
                    <MicButton inline onText={t => setNewPlan(p => ({ ...p, activity: t }))} />
                  </div>
                </div>
                {/* Ideas flotando libres que cambian solas */}
                <FireflyWords onPick={w => setNewPlan({...newPlan, activity: w})} />

                {/* Pokayoke: pista de voz, solo para quien aún no crea nada */}
                {!hasCreatedAnything && !barHintSeen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-start gap-2 p-3 rounded-2xl bg-iogga-primary/10 border border-iogga-primary/25 text-left"
                  >
                    <Sparkles size={14} className="text-iogga-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-300 leading-snug flex-1">
                      Toca <Mic size={11} className="inline align-middle text-iogga-primary" /> para <b className="text-white">dictar</b>, o <AudioLines size={11} className="inline align-middle text-iogga-primary" /> para <b className="text-white">platicarlo por voz</b> y armar tu plan solo.
                    </p>
                    <button onClick={dismissBarHint} className="text-[10px] font-black text-iogga-primary uppercase tracking-widest shrink-0">Ok</button>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4 pt-4 relative z-10 w-full">
                <button 
                  onClick={handleStart}
                  className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-lg shadow-2xl shadow-iogga-primary/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  Comenzar ahora
                </button>
                
                <button 
                  onClick={handleSkipIntro}
                  className="w-full py-4 bg-white/5 text-zinc-500 rounded-[24px] font-bold text-sm hover:bg-white/10 transition-all active:scale-95 border border-white/10"
                >
                  Saltar
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="iphone-notch"></div>
            
            {/* Header */}
            <header className={`pt-10 px-6 pb-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${mode === 'person' ? 'bg-indigo-950/40 border-indigo-500/10' : 'bg-teal-950/40 border-teal-500/10'}`}>
              {/* Left: Logo & Mode */}
              <div className="flex items-center gap-3" id="tutorial-mode-switch">
              <div className="flex items-center gap-2 group relative">
              <button 
                onClick={handleRefresh}
                className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-all duration-500 shadow-lg active:scale-95 ${mode === 'person' ? 'bg-iogga-primary/10 text-iogga-primary' : 'bg-iogga-accent/10 text-iogga-accent'}`}
              >
                {mode === 'person'
                  ? (userProfile.photoURL
                      ? <img src={userProfile.photoURL} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                      : <User size={20} strokeWidth={2.5} className="shrink-0" />)
                  : (businessProfile.logo && businessProfile.name
                      ? <img src={businessProfile.logo} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                      : <Store size={20} strokeWidth={2.5} className="shrink-0" />)}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowModeMenu(!showModeMenu)}
                  className="flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-2xl text-white hover:opacity-80 transition-opacity" style={{ fontFamily: '"Quicksand", sans-serif', fontWeight: 600 }}>iogga</span>
                  <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-500 shrink-0 ${showModeMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModeMenu && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModeMenu(false)}
                        className="fixed inset-0 z-40"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <button 
                          onClick={() => toggleMode('person')}
                          className={`w-full p-4 flex items-center gap-3 transition-colors ${mode === 'person' ? 'bg-iogga-primary/20 text-iogga-primary' : 'text-white/60 hover:bg-white/5'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'person' ? 'bg-iogga-primary/20' : 'bg-white/5'}`}>
                            <User size={16} />
                          </div>
                          <span className="font-bold text-sm">Perfil Personal</span>
                        </button>
                        <button 
                          onClick={() => toggleMode('business')}
                          className={`w-full p-4 flex items-center gap-3 transition-colors ${mode === 'business' ? 'bg-iogga-accent/20 text-iogga-accent' : 'text-white/60 hover:bg-white/5'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'business' ? 'bg-iogga-accent/20' : 'bg-white/5'}`}>
                            <Store size={16} />
                          </div>
                          <span className="font-bold text-sm">Perfil Negocio</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {mode === 'business' && (
              <button
                onClick={() => ensureLoggedIn(() => setShowValidateModal(true))}
                title="Validar código QR de un cliente"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-iogga-accent/20 text-iogga-accent transition-colors shadow-lg active:scale-90"
              >
                <QrCode size={20} />
              </button>
            )}
            <button
              id="tutorial-create-btn"
              onClick={() => mode === 'person' ? setShowCreatePlan(true) : setShowCreatePromo(true)}
              className={`w-10 h-10 flex items-center justify-center rounded-full ${mode === 'person' ? 'bg-iogga-primary/20 text-iogga-primary' : 'bg-iogga-accent/20 text-iogga-accent'} transition-colors shadow-lg active:scale-90`}
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors relative active:scale-90 ${activeTab === 'notifications' ? (mode === 'person' ? 'bg-iogga-primary/20 text-iogga-primary' : 'bg-iogga-accent/20 text-iogga-accent') : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
            >
              <Bell size={20} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border border-zinc-900 flex items-center justify-center text-[10px] font-black text-white">{unreadNotifs}</span>
              )}
            </button>
            <button 
              onClick={() => setShowSettingsMenu(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-colors active:scale-90"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 relative">
          <AnimatePresence>
            {isRefreshing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 bg-white z-[100] pointer-events-none"
              />
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 space-y-6"
              >
                {mode === 'person' ? (
                  <>
                    {/* Header Section */}
                    <div className="flex items-center justify-between px-1">
                      <div id="tutorial-invitations-header">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                          Invitaciones <span className="text-xs font-bold bg-iogga-primary/20 text-iogga-primary px-2 py-1 rounded-full">{plans.filter(p => isInviteForMe(p) && isLivePlan(p) && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id)).length}</span>
                        </h2>
                        <p className="text-xs text-zinc-500">Tus planes y propuestas</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => comingSoon("Sugerencias con IA")} className="text-xs font-bold text-iogga-primary flex items-center gap-1 bg-iogga-primary/10 px-3 py-1.5 rounded-xl border border-iogga-primary/20 hover:scale-105 transition-transform">
                          <Sparkles size={12} />
                          IA
                        </button>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Busca invitaciones..." 
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-iogga-primary outline-none transition-all"
                        value={searchQuery || ''}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        {plans
                          .filter(p => isInviteForMe(p) && isLivePlan(p) && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id))
                          .filter(p => p.activity.toLowerCase().includes(searchQuery.toLowerCase()) || p.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(plan => (
                            <div key={plan.id} className="space-y-2">
                              <motion.div
                                layout
                                onClick={() => setSelectedInvitationId(selectedInvitationId === plan.id ? null : plan.id)}
                                className={`relative overflow-hidden p-4 rounded-[32px] border transition-all cursor-pointer ${selectedInvitationId === plan.id ? 'bg-zinc-900 border-iogga-primary shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                              >
                                {plan.isSeed && <SeedTag />}
                                {/* Tachita: descartar la invitación desde la tarjeta (pokayoke, como en notificaciones) */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleIgnorePlan(plan.id); }}
                                  className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center border border-white/10"
                                >
                                  <X size={14} />
                                </button>
                                <div className="flex items-center gap-4">
                                  <div 
                                    className="relative cursor-pointer hover:scale-105 transition-transform"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUserProfile(plan);
                                    }}
                                  >
                                    <img src={plan.userAvatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10" referrerPolicy="no-referrer" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <h3 
                                        className="font-bold text-white hover:text-iogga-primary transition-colors cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUserProfile(plan);
                                        }}
                                      >
                                        {plan.userName}
                                      </h3>
                                      <span className="text-[10px] text-zinc-500 font-medium">Hace 5 min</span>
                                    </div>
                                    <p className="text-sm text-zinc-200 font-medium leading-snug italic">
                                      "{getPlanDescription(plan)}"
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      {plan.id === 'inv1' && (
                                        <span className="text-[8px] font-black bg-iogga-primary/20 text-iogga-primary px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                          <Sparkles size={8} /> Match IA
                                        </span>
                                      )}
                                      <span className="text-[8px] font-bold bg-white/5 text-zinc-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{plan.location}</span>
                                    </div>
                                  </div>
                                  <ChevronRight size={20} className={`text-zinc-600 transition-transform ${selectedInvitationId === plan.id ? 'rotate-90' : ''}`} />
                                </div>

                                <AnimatePresence>
                                  {selectedInvitationId === plan.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-6 space-y-6">
                                        {renderPlanTechnicalDetails(plan)}

                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 px-1">
                                            <Sparkles size={14} className="text-iogga-primary" />
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Ofertas para este plan</h4>
                                          </div>
                                          <div className="flex flex-col gap-3">
                                            {promos.filter(p => p.tags.some(t => plan.tags.includes(t))).map(promo => {
                                              const isInviterSelected = plan.inviterSelectedOfferId === promo.id;
                                              const isUserSelected = userSelectedOfferIds[plan.id] === promo.id;
                                              
                                              return (
                                                <div 
                                                  key={promo.id} 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPromo(promo);
                                                  }}
                                                  className={`group/promo relative flex items-center gap-4 p-3 rounded-[28px] border transition-all duration-500 cursor-pointer overflow-hidden ${isUserSelected ? 'bg-iogga-primary/10 border-iogga-primary shadow-[0_0_20px_rgba(20,184,166,0.15)] scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'}`}
                                                >
                                                  {/* Selection Indicator (Circular) */}
                                                  <div className="absolute top-3 right-3 z-20">
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setUserSelectedOfferIds(prev => ({ ...prev, [plan.id]: promo.id }));
                                                      }}
                                                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-xl ${isUserSelected ? 'bg-iogga-primary border-iogga-primary scale-110 rotate-0' : 'bg-black/40 border-white/30 hover:border-white/60 -rotate-90'}`}
                                                    >
                                                      <Check size={16} className={`text-white transition-all duration-500 ${isUserSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                    </button>
                                                  </div>

                                                  {/* Image Section */}
                                                  <div className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                                                    <img src={promo.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/promo:scale-110" referrerPolicy="no-referrer" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                    {isInviterSelected && (
                                                      <div className="absolute bottom-0 left-0 right-0 bg-iogga-primary/90 backdrop-blur-sm py-1 text-center">
                                                        <span className="text-[6px] font-black text-white uppercase tracking-widest">Recomendado</span>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Content Section */}
                                                  <div className="flex-1 min-w-0 py-1">
                                                    <div className="flex flex-col h-full justify-between">
                                                      <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className="text-[8px] font-black text-iogga-primary uppercase tracking-[0.2em]">Oferta Especial</span>
                                                          {isInviterSelected && <Sparkles size={10} className="text-iogga-primary animate-pulse" />}
                                                        </div>
                                                        <h5 className="text-sm font-black text-white truncate uppercase tracking-tight group-hover/promo:text-iogga-primary transition-colors">{promo.title}</h5>
                                                        <p className="text-[10px] text-zinc-500 font-bold truncate">{promo.businessName}</p>
                                                      </div>
                                                      
                                                      <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-xs font-black text-white">{promo.price}</span>
                                                          <span className="text-[8px] font-bold text-zinc-600 line-through">S/ 45.00</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-iogga-primary">
                                                          <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover/promo:opacity-100 transition-opacity">Ver más</span>
                                                          <ArrowRight size={10} className="translate-x-[-4px] group-hover/promo:translate-x-0 transition-transform" />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleIgnorePlan(plan.id);
                                              setSelectedInvitationId(null);
                                            }}
                                            className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 text-xs font-bold hover:bg-white/10 transition-all"
                                          >
                                            Ignorar
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAcceptPlan(plan.id);
                                              setSelectedInvitationId(null);
                                            }}
                                            className="flex-[2] py-4 rounded-2xl bg-iogga-primary text-white text-xs font-black shadow-lg shadow-iogga-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                          >
                                            Aceptar Invitación
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </div>
                          ))}
                        
                        {plans.filter(p => isInviteForMe(p) && isLivePlan(p) && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id)).length === 0 && (
                          <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                              <MessageSquare size={32} className="text-zinc-700" />
                            </div>
                            <div>
                              <p className="text-white font-bold">No hay nuevas invitaciones</p>
                              <p className="text-xs text-zinc-500">¡Crea un plan para que otros te inviten!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h2 className="text-2xl font-black text-white">Dashboard</h2>
                        <p className="text-xs text-zinc-500">Resumen de tu negocio en vivo</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">En vivo</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4" id="tutorial-business-stats">
                      <div className="p-5 rounded-[32px] bg-zinc-900 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Búsquedas hoy</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-white">1,284</span>
                          <span className="text-xs font-bold text-green-500 mb-1">↑ 12%</span>
                        </div>
                      </div>
                      <div className="p-5 rounded-[32px] bg-zinc-900 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ventas</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-white">{bizTotals.sales}</span>
                          <span className="text-xs font-bold text-green-500 mb-1">● en vivo</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Tus Ofertas Activas</h3>
                        <Plus size={18} className="text-iogga-primary cursor-pointer" onClick={() => setShowCreatePromo(true)} />
                      </div>
                      <div className="space-y-3">
                        {myPromos.map(promo => (
                          <div key={promo.id} className="p-4 rounded-[32px] bg-white/5 border border-white/10 flex items-center gap-4">
                            <img src={promo.image} className="w-16 h-16 rounded-2xl object-cover" />
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-sm">{promo.title}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <div onClick={!isLoggedIn ? () => setShowLoginModal(true) : undefined} className="flex items-center gap-1 text-[10px] text-zinc-500">
                                  <Users size={10} />
                                  <span className={!isLoggedIn ? 'blur-[4px] select-none cursor-pointer' : ''}>{promo.realTimeSearchers}</span> Interesados
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                  <QrCode size={10} />
                                  {promo.qrScans} scans
                                </div>
                              </div>
                            </div>
                            <button onClick={() => comingSoon("Estadísticas del producto")} className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                              <BarChart3 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

                {activeTab === 'search' && (
                  <motion.div 
                    key="search"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 space-y-6"
                  >
                <div className="flex items-center justify-between px-1" id="tutorial-explore-header">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {mode === 'business' ? 'Tendencias en Vivo' : (searchFilter === 'plans' ? 'Planes Públicos' : 'Ofertas Públicas')}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {mode === 'business' ? 'Descubre qué planes están haciendo las personas ahora' : (searchFilter === 'plans' ? 'Explora planes públicos cerca de ti' : 'Encuentra las mejores ofertas disponibles')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${mode === 'person' ? 'bg-iogga-primary/10 text-iogga-primary border-iogga-primary/20' : 'bg-iogga-accent/10 text-iogga-accent border-iogga-accent/20'}`}>
                      <Globe size={20} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="text" 
                      placeholder={mode === 'business' ? "Busca tendencias o categorías..." : (searchFilter === 'plans' ? "Busca planes públicos..." : "Busca ofertas...")}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-iogga-primary outline-none"
                      value={searchQuery || ''}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {mode === 'person' ? (
                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => setSearchFilter('plans')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${searchFilter === 'plans' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500'}`}
                      >
                        Planes
                      </button>
                      <button
                        onClick={() => setSearchFilter('promos')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${searchFilter === 'promos' ? 'bg-iogga-accent/15 text-iogga-accent shadow-sm border border-iogga-accent/30' : 'text-zinc-500'}`}
                      >
                        <Store size={13} /> Ofertas
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {['Todos', 'Comida', 'Entretenimiento', 'Deporte', 'Salud', 'Hospedaje'].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setBusinessExploreCategory(cat)}
                          className={`px-6 py-2 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${businessExploreCategory === cat ? 'bg-iogga-primary border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {mode === 'person' && (
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {[...PERSON_CATS, ...customCats].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setPersonExploreCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${personExploreCategory === cat ? 'bg-iogga-primary text-white border-iogga-primary' : 'bg-white/5 text-white/40 border-white/10'}`}
                          >
                            {cat}
                          </button>
                        ))}
                        {/* Más +: crear una clasificación por palabra clave (vigilancia tecnológica) */}
                        {addingCat ? (
                          <input
                            autoFocus
                            value={newCat}
                            onChange={e => setNewCat(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && newCat.trim()) {
                                const c = newCat.trim();
                                setCustomCats(prev => prev.includes(c) ? prev : [...prev, c]);
                                setPersonExploreCategory(c);
                                setNewCat(''); setAddingCat(false);
                              } else if (e.key === 'Escape') { setNewCat(''); setAddingCat(false); }
                            }}
                            onBlur={() => { setNewCat(''); setAddingCat(false); }}
                            placeholder="palabra clave…"
                            className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 border border-iogga-primary/40 text-white placeholder:text-white/30 outline-none w-36"
                          />
                        ) : (
                          <button
                            onClick={() => setAddingCat(true)}
                            className="px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap border border-dashed border-iogga-primary/40 text-iogga-primary bg-iogga-primary/5"
                          >
                            Más +
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setShowTrends(!showTrends)}
                        className={`ml-2 p-2 rounded-xl border transition-all ${showTrends ? 'bg-iogga-accent/20 border-iogga-accent text-iogga-accent' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                      >
                        <TrendingUp size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {mode === 'business' ? (
                    <motion.div layout className="grid grid-cols-1 gap-4">
                      {groupedPlans
                        .filter(g => businessExploreCategory === 'Todos' || g.category === businessExploreCategory)
                        .filter(g => g.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) || g.category.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((group, index) => (
                          <GroupedPlanCard key={group.id} group={group} rank={index + 1} locked={!isLoggedIn} onUnlock={() => setShowLoginModal(true)} />
                        ))}
                    </motion.div>
                  ) : (
                    <>
                      {searchFilter === 'plans' ? (
                        <div className="grid grid-cols-2 gap-4">
                          {plans.filter(p => (searchSubFilter === 'public' ? p.isPublic : !p.isPublic) && matchesCategory(p) && isLivePlan(p)).length === 0 && (
                            <div className="col-span-2 py-16 flex flex-col items-center gap-4 text-center">
                              <div className="p-5 rounded-full bg-iogga-primary/10 border border-iogga-primary/20">
                                <Sparkles size={28} className="text-iogga-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-black text-white text-lg">Aún no hay planes por aquí</p>
                                <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">¡Sé de los primeros! Publica tu plan y deja que otros se unan.</p>
                              </div>
                              <button
                                onClick={() => setShowCreatePlan(true)}
                                className="px-6 py-3 bg-iogga-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                              >
                                Crear mi primer plan
                              </button>
                            </div>
                          )}
                          {plans
                            .filter(p => (searchSubFilter === 'public' ? p.isPublic : !p.isPublic) && matchesCategory(p) && isLivePlan(p))
                            .map((plan, index) => (
                              <motion.div 
                                key={plan.id} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedPlanForDetails(plan)}
                                className="relative aspect-[4/5] rounded-[32px] overflow-hidden group shadow-2xl cursor-pointer border border-white/10"
                              >
                                {plan.isSeed && <SeedTag />}
                                {acceptedPlanIds.includes(plan.id) && (
                                  <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-iogga-primary text-white flex items-center justify-center shadow-lg border-2 border-white/30" title="Ya estás unido">
                                    <Check size={16} />
                                  </div>
                                )}
                                <img src={plan.image || `https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=400&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div 
                                      className="shrink-0 cursor-pointer hover:scale-110 transition-transform"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUserProfile(plan);
                                      }}
                                    >
                                      <img src={plan.userAvatar} className="w-7 h-7 rounded-full border border-white/30" referrerPolicy="no-referrer" />
                                    </div>
                                    <span 
                                      className="text-[10px] font-bold text-white truncate drop-shadow-md hover:text-iogga-primary transition-colors cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUserProfile(plan);
                                      }}
                                    >
                                      {plan.userName}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-lg">{plan.activity}</h3>
                                  <div className="mt-2 flex items-center gap-1 text-[8px] text-white/70 font-bold uppercase tracking-widest">
                                    <MapPin size={8} className="shrink-0" />
                                    <span className="truncate">{plan.location}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-iogga-accent animate-pulse" />
                            <span className="text-[10px] font-black text-iogga-accent uppercase tracking-widest">Ofertas de negocios cerca de ti</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 border-l-2 border-iogga-accent/30 pl-3">
                          {promos.filter(matchesPromoCategory).map(promo => (
                            <PromoCard
                              key={promo.id}
                              promo={promo}
                              onClick={() => setSelectedPromo(promo)}
                              onBusinessClick={() => setSelectedBusinessProfile(promo)}
                            />
                          ))}
                          </div>
                          {promos.filter(matchesPromoCategory).length === 0 && (
                            <p className="col-span-2 text-xs text-zinc-500 text-center py-10">No hay ofertas en "{personExploreCategory}" todavía.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'active' && (
              <motion.div 
                key="active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-6"
              >
                <div className="flex items-center justify-between px-1" id="tutorial-my-plans-header">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {mode === 'person' ? 'Mis Planes' : 'Mis Ofertas'}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {mode === 'person' ? 'Gestiona tus planes activos' : 'Gestiona tus ofertas y productos'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl border ${mode === 'person' ? 'bg-iogga-primary/10 text-iogga-primary border-iogga-primary/20' : 'bg-iogga-accent/10 text-iogga-accent border-iogga-accent/20'}`}>
                    <LayoutGrid size={20} />
                  </div>
                </div>

                {/* Botón crear siempre visible: para empezar o sumar más */}
                <button
                  onClick={() => mode === 'person' ? setShowCreatePlan(true) : setShowCreatePromo(true)}
                  className={`w-full py-4 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg ${mode === 'person' ? 'bg-iogga-primary text-white shadow-iogga-primary/20' : 'bg-iogga-accent text-white shadow-iogga-accent/20'}`}
                >
                  <PlusCircle size={20} />
                  {mode === 'person' ? 'Crear un plan' : 'Crear una oferta'}
                </button>

                {mode === 'person' ? (
                  <div className="space-y-4">
                    {plans.filter(p => isMyPlan(p) && !p.deleted).map(plan => { const expired = isExpiredPlan(plan); return (
                      <div key={plan.id} className="space-y-2">
                        <div
                          onClick={() => setSelectedPlanForDetails(plan)}
                          className={`w-full text-left p-0 rounded-[32px] bg-zinc-900 border-2 text-white shadow-xl relative overflow-hidden transition-transform active:scale-[0.98] group cursor-pointer ${plan.closed ? 'border-emerald-500/70 shadow-emerald-500/10' : expired ? 'border-white/5 opacity-90' : 'border-white/10'}`}
                        >
                          <div className="h-48 w-full relative">
                            <img
                              src={plan.image || `https://picsum.photos/seed/${plan.id}/800/400`}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${expired ? 'grayscale opacity-60' : ''}`}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                              {plan.closed ? (
                                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1"><CheckCircle2 size={11} /> Cerrado</span>
                              ) : expired ? (
                                <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Caducado</span>
                              ) : (
                                <span className="px-3 py-1 bg-iogga-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Tu Plan Activo</span>
                              )}
                            </div>
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPlan(plan);
                                }}
                                className="p-2.5 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors border border-white/10"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInvite(plan);
                                }}
                                title="Agregar personas"
                                className="p-2.5 bg-green-500/20 backdrop-blur-md text-green-200 rounded-full hover:bg-green-500/40 transition-colors border border-green-500/20"
                              >
                                <UserPlus size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlan(plan.id);
                                }}
                                className="p-2.5 bg-red-500/20 backdrop-blur-md text-red-200 rounded-full hover:bg-red-500/40 transition-colors border border-red-500/20"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="p-6 relative z-10">
                            {/* Aviso de aceptados; sin cuenta: se ve borroso e invita a registrarse */}
                            {/* Indicador unificado: el número de unidos es el dato estrella
                                (mismo estilo que "personas buscando" en negocios) */}
                            {/* Fila de perfiles que aceptaron (swipe horizontal), arriba del aviso.
                                Los que ya aceptaste llevan palomita morada. */}
                            {!currentUser?.isAnonymous && (plan.acceptedBy?.length || 0) > 0 && (
                              <div className="flex gap-3 overflow-x-auto no-scrollbar mb-3 pb-1">
                                {plan.acceptedBy!.map((a, i) => {
                                  const ok = (plan.confirmedUids || []).includes(a.uid);
                                  return (
                                    <button
                                      key={i}
                                      onClick={(e) => { e.stopPropagation(); setSelectedPlanForDetails(plan); }}
                                      className="flex flex-col items-center gap-1 shrink-0 w-14"
                                    >
                                      <div className="relative">
                                        {a.photo ? <img src={a.photo} className="w-12 h-12 rounded-full object-cover border-2 border-white/10" referrerPolicy="no-referrer" /> : <div className="w-12 h-12 rounded-full bg-iogga-primary/20 text-iogga-primary flex items-center justify-center text-sm font-black">{a.name.charAt(0).toUpperCase()}</div>}
                                        {ok && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-iogga-primary text-white flex items-center justify-center border-2 border-zinc-900"><Check size={11} /></div>}
                                      </div>
                                      <span className="text-[9px] text-zinc-400 truncate w-full text-center">{a.name.split(' ')[0]}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Solo se muestra cuando HAY gente unida (el aviso genérico no aportaba) */}
                            {plan.acceptedCount > 0 && (
                              <button
                                onClick={(e) => {
                                  if (currentUser?.isAnonymous) { e.stopPropagation(); setIsRegistering(true); setShowLoginModal(true); }
                                }}
                                className="w-full mb-4 flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-left"
                              >
                                <span className={`text-4xl font-black text-emerald-400 leading-none shrink-0 ${currentUser?.isAnonymous ? 'blur-[7px] select-none' : ''}`}>{plan.acceptedCount}</span>
                                <p className="text-xs font-black uppercase tracking-wider text-emerald-300 leading-tight">
                                  {currentUser?.isAnonymous
                                    ? 'se unieron a tu plan — crea tu cuenta gratis para ver quiénes.'
                                    : `${plan.acceptedCount === 1 ? 'persona se unió' : 'personas se unieron'} a tu plan.`}
                                </p>
                              </button>
                            )}

                            <div className="mb-4">
                              <h3 className="text-2xl font-black mb-1">{plan.activity}</h3>
                              <p className="text-xs text-zinc-400 font-medium italic line-clamp-1">"{getPlanDescription(plan)}"</p>
                            </div>

                            {expired ? (
                              /* Caducado: renovar la hora lo vuelve a encender */
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditPlan(plan); setCurrentPlanStep(1); }}
                                className="w-full py-3.5 bg-iogga-primary text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                              >
                                <Clock size={14} /> Renovar hora para reactivarlo
                              </button>
                            ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPlan(plan);
                                }}
                                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                              >
                                <Edit3 size={14} />
                                Editar
                              </button>
                              {/* Un solo botón: abre coincidencias; el globo avisa cuántas hay */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
                                }}
                                className="relative flex-[2] py-3.5 bg-iogga-accent/20 hover:bg-iogga-accent/30 text-iogga-accent rounded-2xl font-black text-xs text-center border border-iogga-accent/20 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                              >
                                <LayoutGrid size={14} />
                                Coincidencias
                                {(() => { const nM = getMatchingPlansForPlan(plan).length + getMatchingPromosForPlan(plan).length + plan.acceptedCount; return nM > 0 ? (
                                  <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border border-zinc-900">{nM}</span>
                                ) : null; })()}
                                <ChevronDown size={15} className={`transition-transform duration-500 ${expandedPlanId === plan.id ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                            )}
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedPlanId === plan.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-2 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-iogga-accent animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                  <p className="text-xs font-black text-iogga-accent uppercase tracking-widest">Ofertas especiales para este plan</p>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                  {getMatchingPromosForPlan(plan).map(promo => (
                                    <div 
                                      key={promo.id}
                                      onClick={() => {
                                        setSelectedPlanForOffers(plan.id);
                                        setSelectedPromo(promo);
                                      }}
                                      className={`group/promo relative flex items-center gap-4 p-3 rounded-[28px] border transition-all duration-500 cursor-pointer overflow-hidden ${userSelectedOfferIds[plan.id] === promo.id ? 'bg-iogga-primary/10 border-iogga-primary shadow-[0_0_20px_rgba(20,184,166,0.15)] scale-[1.01]' : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'}`}
                                    >
                                      {/* Selection Indicator (Circular) */}
                                      <div className="absolute top-3 right-3 z-20">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setUserSelectedOfferIds(prev => ({ ...prev, [plan.id]: promo.id }));
                                          }}
                                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-xl ${userSelectedOfferIds[plan.id] === promo.id ? 'bg-iogga-primary border-iogga-primary scale-110' : 'bg-black/40 border-white/30 hover:border-white/60'}`}
                                        >
                                          <Check size={16} className={`text-white transition-all duration-500 ${userSelectedOfferIds[plan.id] === promo.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                        </button>
                                      </div>

                                      {/* Image Section */}
                                      <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                                        <img src={promo.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/promo:scale-110" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                      </div>

                                      {/* Content Section */}
                                      <div className="flex-1 min-w-0 py-1">
                                        <div className="flex flex-col h-full justify-between">
                                          <div>
                                            <h4 className="text-sm font-black text-white truncate uppercase tracking-tight group-hover/promo:text-iogga-primary transition-colors">{promo.title}</h4>
                                            <p className="text-iogga-accent font-black text-[10px] uppercase tracking-widest mb-1">{promo.offer}</p>
                                            <p className="text-[10px] text-zinc-500 truncate font-bold">{promo.businessName}</p>
                                          </div>
                                          
                                          <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs font-black text-white">{promo.price}</span>
                                            <div className="flex items-center gap-1 text-iogga-primary">
                                              <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover/promo:opacity-100 transition-opacity">Detalles</span>
                                              <ArrowRight size={10} className="translate-x-[-4px] group-hover/promo:translate-x-0 transition-transform" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {getMatchingPromosForPlan(plan).length === 0 && (
                                    <div className="w-full p-8 rounded-3xl bg-white/5 border border-dashed border-white/10 text-center">
                                      <p className="text-sm text-zinc-500 italic">No hay ofertas específicas aún...</p>
                                    </div>
                                  )}

                                  {/* Coincident users / Plans from other members (Swipe to Delete) */}
                                  <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                                        {(plan.activity.toLowerCase().includes('comid') || plan.activity.toLowerCase().includes('caf') || plan.activity.toLowerCase().includes('cenar') || plan.activity.toLowerCase().includes('restaurante')) 
                                          ? `Coincidencias de Comida (${getMatchingPlansForPlan(plan).filter(otherPlan => !dismissedMatchIds.includes(otherPlan.id)).length})` 
                                          : `Coincidencias de Comunidad (${getMatchingPlansForPlan(plan).filter(otherPlan => !dismissedMatchIds.includes(otherPlan.id)).length})`}
                                      </p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2.5">
                                      {getMatchingPlansForPlan(plan)
                                        .filter(otherPlan => !dismissedMatchIds.includes(otherPlan.id))
                                        .map(otherPlan => (
                                          <div key={otherPlan.id} className="relative overflow-hidden rounded-2xl bg-red-500/10">
                                            {/* Red Delete Background */}
                                            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-end px-5 text-white z-0">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-wider">Descartar</span>
                                                <Trash2 size={16} />
                                              </div>
                                            </div>

                                            {/* Draggable Foreground Card */}
                                            <motion.div 
                                              drag="x"
                                              dragDirectionLock
                                              dragConstraints={{ left: -100, right: 0 }}
                                              dragElastic={{ left: 0.1, right: 0.1 }}
                                              onDragEnd={(event, info) => {
                                                if (info.offset.x < -60) {
                                                  setDismissedMatchIds(prev => [...prev, otherPlan.id]);
                                                  triggerBeta("Coincidencia Ocultada", `Has descartado la coincidencia con ${otherPlan.userName}.`);
                                                }
                                              }}
                                              onClick={() => {
                                                setSelectedPlanForDetails(otherPlan);
                                              }}
                                              className="relative z-10 flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 hover:bg-zinc-800 transition-colors cursor-grab active:cursor-grabbing"
                                            >
                                              <img src={otherPlan.userAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0 pointer-events-none" referrerPolicy="no-referrer" />
                                              <div className="flex-1 min-w-0 pointer-events-none select-none">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-bold text-xs text-white block">{otherPlan.userName}</span>
                                                  <span className="text-[9px] text-zinc-500">{otherPlan.startTime} - {otherPlan.endTime}</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 truncate">{otherPlan.activity} @ {otherPlan.location}</p>
                                              </div>
                                              <div className="flex flex-col items-center shrink-0 text-zinc-500 pointer-events-none">
                                                <ChevronRight size={14} className="shrink-0 animate-pulse" />
                                                <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest leading-none">Deslizar</span>
                                              </div>
                                            </motion.div>
                                          </div>
                                        ))}
                                      {getMatchingPlansForPlan(plan).filter(otherPlan => !dismissedMatchIds.includes(otherPlan.id)).length === 0 && (
                                        <p className="text-[11px] text-zinc-600 italic pl-5 py-2">No hay coincidencias activas para este plan...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ); })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {promos.filter(p => (p.uid ? p.uid === currentUser?.uid : !isFirebaseEnabled)).length === 0 && (
                      <div className="py-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-5 rounded-full bg-iogga-accent/10 border border-iogga-accent/20">
                          <PackagePlus size={28} className="text-iogga-accent" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-white text-lg">Publica tu primera oferta</p>
                          <p className="text-xs text-zinc-500 max-w-[260px] leading-relaxed">Las personas con planes cerca de ti la verán al instante. Sin registro: solo se pide al validar canjes.</p>
                        </div>
                        <button
                          onClick={() => setShowCreatePromo(true)}
                          className="px-6 py-3 bg-iogga-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Crear oferta
                        </button>
                      </div>
                    )}
                    {promos.filter(p => (p.uid ? p.uid === currentUser?.uid : !isFirebaseEnabled)).map((promo, idx) => (
                      <motion.div
                        key={promo.id}
                        id={idx === 0 ? "tutorial-business-offer-card" : undefined}
                        animate={isWiggleMode ? { 
                          rotate: [0, -1, 1, -1, 1, 0],
                          transition: { repeat: Infinity, duration: 0.3 }
                        } : { rotate: 0 }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setIsWiggleMode(true);
                        }}
                        className="relative"
                      >
                        <div 
                          onClick={() => isWiggleMode ? null : handleEditPromo(promo)}
                          className={`p-0 rounded-[32px] bg-zinc-900 border border-white/10 flex flex-col group hover:bg-zinc-800 transition-all shadow-2xl overflow-hidden cursor-pointer ${isWiggleMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                          <div className="relative w-full h-48 shrink-0">
                            <img src={promo.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                            
                            {/* Top Left: View as Customer + Compartir */}
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPromo(promo);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-zinc-900/90 backdrop-blur-md rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all border border-white/20 shadow-2xl"
                              >
                                <Eye size={14} />
                                Ver cómo
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); void sharePromo(promo); }}
                                title="Compartir promoción"
                                className="p-2 bg-iogga-accent/90 backdrop-blur-md rounded-2xl text-white hover:bg-iogga-accent transition-all border border-white/20 shadow-2xl"
                              >
                                <Send size={14} />
                              </button>
                            </div>

                            {/* Top Right: Actions */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                              {isWiggleMode ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void deleteDocIn('promos', promo.id);
                                    setPromos(promos.filter(p => p.id !== promo.id));
                                  }}
                                  className="p-2.5 bg-red-500 text-white rounded-full shadow-2xl animate-bounce"
                                >
                                  <X size={14} />
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProductAnalytics(promo);
                                      setActiveTab('analytics');
                                    }}
                                    className="p-2.5 bg-zinc-900/90 backdrop-blur-md rounded-full hover:bg-zinc-800 transition-colors border border-white/20 text-iogga-primary shadow-2xl"
                                  >
                                    <BarChart3 size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPromo(promo);
                                    }}
                                    className="p-2.5 bg-zinc-900/90 backdrop-blur-md rounded-full hover:bg-zinc-800 transition-colors border border-white/20 text-white shadow-2xl"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  {/* Eliminar SIEMPRE visible (con confirmación) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`¿Eliminar la oferta "${promo.title}"? No se puede deshacer.`)) {
                                        void deleteDocIn('promos', promo.id);
                                        setPromos(promos.filter(p => p.id !== promo.id));
                                      }
                                    }}
                                    className="p-2.5 bg-red-500/90 backdrop-blur-md rounded-full hover:bg-red-500 transition-colors border border-white/20 text-white shadow-2xl"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>

                          {/* Bottom Left: Offer Badge */}
                          <div className="absolute bottom-4 left-4 z-10">
                            <div className="bg-iogga-accent text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/10">
                              {promo.offer}
                            </div>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                        </div>
                        <div className="p-6 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3 gap-4">
                            <h3 className="font-black text-xl text-white truncate flex-1">{promo.title}</h3>
                          </div>
                          <p className="text-sm text-zinc-400 font-medium line-clamp-2 mb-6">{promo.description || "Sin descripción disponible"}</p>
                          {/* Métricas claras: la tienen en su plan · bajaron QR · lo canjearon */}
                          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                            {/* En su plan: personas con planes relacionados (tocar para ver la lista) */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPromoForMatches(promo); }}
                              className="flex flex-col items-center p-2 rounded-2xl bg-iogga-primary/10 border border-iogga-primary/20 active:scale-95 transition-all"
                            >
                              <Users size={14} className="text-iogga-primary mb-1" />
                              <span className="text-lg font-black text-white leading-none">{getMatchingPlansForPromo(promo).length}</span>
                              <span className="text-[9px] font-bold text-iogga-primary/80 uppercase tracking-wider mt-1 text-center leading-tight">En su plan</span>
                            </button>
                            <div className="flex flex-col items-center p-2 rounded-2xl bg-white/5">
                              <QrCode size={14} className="text-iogga-accent mb-1" />
                              <span className="text-lg font-black text-white leading-none">{promo.qrScans}</span>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1 text-center leading-tight">QR bajados</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-2xl bg-emerald-500/10">
                              <CheckCircle2 size={14} className="text-emerald-400 mb-1" />
                              <span className="text-lg font-black text-emerald-400 leading-none">{promo.salesCount}</span>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1 text-center leading-tight">Canjeados</span>
                            </div>
                          </div>

                          {/* Sin sesión: la oferta existe pero aún no es pública */}
                          {!isLoggedIn && !promo.isSeed && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setIsRegistering(true); setShowLoginModal(true); }}
                              className="w-full mt-3 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left"
                            >
                              <Eye size={14} className="text-amber-400 shrink-0" />
                              <span className="text-[11px] text-amber-200 leading-snug flex-1">Solo tú la ves. Inicia sesión para publicarla a toda la comunidad.</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {isWiggleMode && (
                          <button 
                            onClick={() => setIsWiggleMode(false)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-800 text-white rounded-full border border-white/20 flex items-center justify-center shadow-xl z-20"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 space-y-6"
              >
                {mode === 'business' && !isLoggedIn && (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full p-4 rounded-3xl bg-iogga-accent/10 border border-iogga-accent/30 text-left flex items-center gap-3"
                  >
                    <Shield size={18} className="text-iogga-accent shrink-0" />
                    <p className="text-xs text-zinc-300 font-medium">Hay clientes interesados en tu negocio. <span className="text-iogga-accent font-black">Inicia sesión</span> para abrir tus notificaciones.</p>
                  </button>
                )}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-2xl font-black text-white">Notificaciones</h2>
                    <p className="text-xs text-zinc-500">
                      {mode === 'person' ? 'Lo que está pasando en tu mundo' : 'Novedades de tu negocio'}
                    </p>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                      className="p-2.5 bg-white/5 text-zinc-500 rounded-full hover:bg-white/10 transition-all border border-white/10"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    <AnimatePresence>
                      {showNotificationsMenu && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          <button 
                            onClick={() => {
                              // In a real app, this would update state
                              setShowNotificationsMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2"
                          >
                            <CheckCircle2 size={14} className="text-iogga-primary" />
                            Marcar todas como leídas
                          </button>
                          <button 
                            onClick={() => {
                              // In a real app, this would update state
                              setShowNotificationsMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-red-400 hover:bg-red-400/5 flex items-center gap-2 border-t border-white/5"
                          >
                            <Trash2 size={14} />
                            Eliminar todas
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Notificaciones REALES de iogga (invitaciones de amigos, en vivo) */}
                {realNotifs.length > 0 && (
                  <div className="space-y-3">
                    {realNotifs.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          void markNotificationRead(n.id);
                          if (n.planId) {
                            const p = plans.find(pl => pl.id === n.planId);
                            if (p) { setActiveTab('search'); setSelectedPlanForDetails(p); }
                            else fetchDocIn<Plan>('plans', n.planId).then(pl => { if (pl) { setActiveTab('search'); setSelectedPlanForDetails(pl); } });
                          }
                        }}
                        className={`w-full text-left p-5 rounded-[32px] border flex gap-4 transition-all ${n.read ? 'bg-white/5 border-white/5' : 'bg-zinc-900 border-iogga-primary/30 shadow-xl'}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-iogga-primary/20 text-iogga-primary flex items-center justify-center shrink-0">
                          <Sparkles size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-black text-sm truncate ${n.read ? 'text-zinc-400' : 'text-white'}`}>{n.title}</h3>
                            {!n.read && <span className="w-2.5 h-2.5 bg-iogga-primary rounded-full shrink-0" />}
                          </div>
                          <p className={`text-xs leading-relaxed line-clamp-2 ${n.read ? 'text-zinc-500' : 'text-zinc-300'}`}>{n.message}</p>
                          {n.planId && <span className="text-[10px] font-black text-iogga-primary uppercase tracking-widest mt-1 inline-block">Ver plan →</span>}
                        </div>
                      </button>
                    ))}
                    <div className="h-px bg-white/5 my-2" />
                  </div>
                )}

                <div className="space-y-3">
                  {(mode === 'person' ? notificationsPerson : notificationsBusiness).map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      className="relative group"
                    >
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -60) {
                            if (mode === 'person') {
                              setNotificationsPerson(prev => prev.filter(n => n.id !== notif.id));
                            } else {
                              setNotificationsBusiness(prev => prev.filter(n => n.id !== notif.id));
                            }
                          }
                        }}
                        className={`p-5 rounded-[32px] border flex gap-4 transition-all relative overflow-hidden group ${notif.isRead ? 'bg-white/5 border-white/5' : 'bg-zinc-900 border-white/10 shadow-xl'}`}
                      >
                        {/* Swipe Action Background (Visible when dragging) */}
                        <div className="absolute inset-0 bg-red-500 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-end px-8 text-white -z-10">
                          <Trash2 size={24} />
                        </div>
                        {!notif.isRead && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${notif.type === 'ai' ? 'bg-iogga-primary' : notif.type === 'success' ? 'bg-iogga-accent' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        )}
                        
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                          notif.type === 'ai' ? 'bg-iogga-primary/20 text-iogga-primary' :
                          notif.type === 'success' ? 'bg-iogga-accent/20 text-iogga-accent' :
                          notif.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          <notif.icon size={24} className="shrink-0" />
                        </div>

                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <h3 className={`font-black text-sm truncate ${notif.isRead ? 'text-zinc-400' : 'text-white'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-bold shrink-0">{notif.time}</span>
                          </div>
                          <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            {notif.message}
                          </p>
                          
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => { setActiveTab(mode === 'business' ? 'analytics' : 'active'); }}
                              className="px-3 py-1.5 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20 transition-all"
                            >
                              Ver detalle
                            </button>
                            {notif.category === 'plan' && (
                              <button
                                onClick={() => { setActiveTab(mode === 'business' ? 'analytics' : 'active'); }}
                                className="px-3 py-1.5 bg-iogga-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-iogga-primary/20"
                              >
                                Abrir
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Cerrar con tachita SIEMPRE visible (pokayoke, además del deslizar) */}
                        <button
                          onClick={() => {
                            if (mode === 'person') setNotificationsPerson(prev => prev.filter(n => n.id !== notif.id));
                            else setNotificationsBusiness(prev => prev.filter(n => n.id !== notif.id));
                          }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center border border-white/10"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 rounded-[40px] bg-gradient-to-br from-iogga-primary/10 to-iogga-accent/10 border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles size={32} className="text-iogga-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Sugerencia de la IA</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed px-4">
                      {mode === 'person' 
                        ? 'Parece que te gusta el deporte. Hay 3 nuevos planes de fútbol cerca de ti que podrían interesarte.' 
                        : 'Tu producto estrella está bajando en visualizaciones. ¿Qué tal si lanzas una oferta flash de 2 horas?'}
                    </p>
                  </div>
                  <button onClick={() => comingSoon("Optimizar con IA")} className="px-6 py-3 bg-white text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                    Optimizar ahora
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && mode === 'business' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 space-y-6"
              >
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-2xl font-black text-white">Analítica</h2>
                    <p className="text-xs text-zinc-500">Resumen de tu negocio</p>
                  </div>
                  <div className="p-2 bg-iogga-accent/10 text-iogga-accent rounded-xl border border-iogga-accent/20">
                    <TrendingUp size={20} />
                  </div>
                </div>

                {selectedProductAnalytics ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedProductAnalytics(null)} 
                        className="p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all active:scale-90 border border-white/10"
                      >
                        <ArrowRight size={20} className="rotate-180" />
                      </button>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Detalle de Producto</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Analítica específica</p>
                      </div>
                    </div>
                    
                    {/* Encabezado del producto */}
                    <div className="p-5 rounded-[28px] bg-gradient-to-br from-iogga-accent to-teal-600 text-white shadow-xl shadow-iogga-accent/20">
                      <div className="flex items-center gap-4">
                        <img src={selectedProductAnalytics.image} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" />
                        <div>
                          <h3 className="font-black text-lg leading-tight">{selectedProductAnalytics.title}</h3>
                          <p className="text-xs opacity-80">{selectedProductAnalytics.businessName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Métricas clave (tiles legibles sobre fondo oscuro) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ventas</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">${selectedProductAnalytics.totalEarnings.toLocaleString('es-MX')}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conversión</p>
                        <p className="text-2xl font-black text-white mt-1">{selectedProductAnalytics.qrScans > 0 ? Math.round((selectedProductAnalytics.salesCount / selectedProductAnalytics.qrScans) * 100) : 0}%</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">QR bajados</p>
                        <p className="text-2xl font-black text-iogga-accent mt-1">{selectedProductAnalytics.qrScans || 0}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">QR canjeados</p>
                        <p className="text-2xl font-black text-indigo-400 mt-1">{selectedProductAnalytics.salesCount || 0}</p>
                      </div>
                    </div>

                    {/* Gráfica sobre fondo oscuro (ahora sí legible) */}
                    <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-white uppercase tracking-widest">Ventas en el tiempo</p>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-iogga-accent"></div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Ventas</span>
                          </div>
                        </div>
                        <div className="h-48 w-full">
                          {salesSeries(selectedProductAnalytics?.id).some(d => d.sales > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesSeries(selectedProductAnalytics?.id)} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSalesProd" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.55}/>
                                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                              <YAxis hide domain={[0, 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} labelStyle={{ color: '#a1a1aa' }} formatter={(v: any) => [`$${v}`, 'Ventas']} />
                              <Area type="monotone" dataKey="sales" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorSalesProd)" strokeWidth={3} dot={{ r: 3, fill: '#2dd4bf' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                              <BarChart3 size={28} className="text-zinc-600" />
                              <p className="text-xs text-zinc-500 font-medium max-w-[200px]">Aún no hay ventas de este producto. Cada canje QR validado aparecerá aquí.</p>
                            </div>
                          )}
                        </div>
                    </div>

                    {/* Compartir la promoción por donde sea; el link lleva a iogga */}
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3 text-center">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Comparte tu promoción</p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed px-2">Compártela en WhatsApp, Instagram o donde sea. El enlace lleva a tu oferta en iogga para atraer más clientes.</p>
                        <button
                          onClick={() => sharePromo(selectedProductAnalytics)}
                          className="w-full py-4 bg-iogga-accent text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-iogga-accent/20 flex items-center justify-center gap-2"
                        >
                          <Send size={18} /> Compartir promoción
                        </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6 rounded-3xl bg-zinc-900 text-white space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Ventas</p>
                          <p className="text-4xl font-bold">${bizTotals.earnings.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-green-500 font-bold">● En vivo</span>
                          <span className="text-[10px] text-zinc-500">canjes QR validados</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <QrCode size={14} className="text-iogga-accent" />
                            <p className="text-xs text-zinc-400">QRs</p>
                          </div>
                          <p className="text-xl font-bold">{bizTotals.scans}</p>
                          <p className="text-[10px] text-zinc-500">Escaneos totales</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={14} className="text-indigo-400" />
                            <p className="text-xs text-zinc-400">Canjes</p>
                          </div>
                          <p className="text-xl font-bold">{bizTotals.sales}</p>
                          <p className="text-[10px] text-zinc-500">Clientes atendidos</p>
                        </div>
                      </div>

                      {/* Sales Chart */}
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ventas en el Tiempo</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-iogga-accent"></div>
                              <span className="text-[8px] text-zinc-500">Ventas</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-white/30"></div>
                              <span className="text-[8px] text-zinc-500">Tendencia</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-48 w-full">
                          {salesSeries().some(d => d.sales > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesSeries()} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                              <YAxis hide domain={[0, 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} labelStyle={{ color: '#a1a1aa' }} formatter={(v: any) => [`$${v}`, 'Ventas']} />
                              <Area type="monotone" dataKey="sales" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} dot={{ r: 3, fill: '#2dd4bf' }} />
                              <Line type="monotone" dataKey="trend" stroke="#ffffff40" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                              <BarChart3 size={28} className="text-zinc-600" />
                              <p className="text-xs text-zinc-500 font-medium max-w-[220px]">Aún no hay ventas. Cuando valides canjes QR, tus ventas por día aparecerán aquí.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mini Chart Mockup */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Actividad Semanal</p>
                        <div className="flex items-end justify-between h-20 gap-1">
                          {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                              <div 
                                className={`w-full rounded-t-lg transition-all duration-500 ${i === 3 ? 'bg-iogga-accent' : 'bg-white/10'}`}
                                style={{ height: `${h}%` }}
                              ></div>
                              <span className="text-[8px] text-zinc-500 font-bold">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">Por Producto</h3>
                        <button onClick={() => comingSoon("Ver todos")} className="text-xs font-bold text-iogga-accent uppercase tracking-widest">Ver todos</button>
                      </div>
                      <div className="space-y-3">
                        {promos.map(promo => (
                          <button 
                            key={promo.id} 
                            onClick={() => setSelectedProductAnalytics(promo)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img src={promo.image} className="w-12 h-12 rounded-xl object-cover" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-iogga-accent rounded-full flex items-center justify-center text-[8px] font-bold text-white border-2 border-zinc-950">
                                  {promo.salesCount}
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-sm text-white group-hover:text-iogga-accent transition-colors">{promo.title}</p>
                                <p className="text-xs text-zinc-500">{promo.realTimeSearchers} personas buscando</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">${promo.totalEarnings}</p>
                              <p className="text-[10px] text-zinc-500">Ventas totales</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                          <Sparkles size={20} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">Sugerencia de IA</p>
                          <p className="text-xs text-zinc-400">Basado en tendencias locales</p>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-300">
                        "Tu oferta de <span className="text-indigo-400 font-bold">2x1 en Latte</span> tiene un pico de búsqueda los jueves a las 10:00 AM. Considera activar una notificación push en ese horario."
                      </p>
                      <button onClick={() => comingSoon("Optimizar oferta")} className="w-full py-3 bg-indigo-500 text-white rounded-xl text-xs font-bold">
                        Optimizar Oferta
                      </button>
                    </section>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-0"
              >
                {mode === 'business' ? (
                  <div className="flex flex-col">
                    <div className="h-40 w-full relative bg-gradient-to-br from-iogga-accent/30 to-teal-800/30">
                      {businessProfile.cover && <img src={businessProfile.cover} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/40"></div>
                      <div className="absolute -bottom-10 left-6">
                        <div className="relative">
                          <img src={businessProfile.logo || GENERIC_AVATAR} className="w-20 h-20 rounded-2xl border-4 border-zinc-950 shadow-xl object-cover" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-iogga-accent border-2 border-zinc-950 rounded-full flex items-center justify-center shadow-lg">
                            <Store size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Mismo formato que el perfil de persona: números en fila */}
                    <div className="pt-12 px-6 space-y-5">
                      <div className="flex items-center justify-around">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white">{myPromos.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ofertas</span>
                        </div>
                        <button onClick={() => setShowFriends('followers')} className="flex flex-col items-center active:scale-95 transition-transform">
                          <span className="text-lg font-black text-white">{followersAll.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Seguidores</span>
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white">{(businessProfile.name ? 4.8 : 5).toFixed(1)}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Rating</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                          {businessProfile.name || 'Tu negocio'}
                          <Store size={16} className="text-teal-400/60" />
                        </h2>
                        <p className="text-zinc-500 text-xs">{businessProfile.name ? `@${businessProfile.name.toLowerCase().replace(/\s+/g, '_')}` : 'Configura tu negocio'}{businessProfile.location ? ` • ${businessProfile.location}` : ''}</p>
                        {businessProfile.bio && <p className="text-sm text-white/80 leading-snug pt-1">{businessProfile.bio}</p>}
                        {socialChips(businessProfile, { includeWhatsapp: true }).length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                            {socialChips(businessProfile, { includeWhatsapp: true }).map(c => (
                              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={`text-[12px] font-black active:scale-95 transition-all ${c.color}`}>{c.label}</a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Barra de acciones igual que en persona: Editar · Compartir */}
                      <div className="flex gap-2">
                        <button onClick={() => setShowEditBusinessProfile(true)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                          Editar negocio
                        </button>
                        <button
                          onClick={() => {
                            const text = `${businessProfile.name || 'Mi negocio'} en iogga: ${window.location.origin}\n\niogga es la app para salir del móvil y vivir lo espontáneo.`;
                            if ((navigator as any).share) { (navigator as any).share({ title: businessProfile.name || 'iogga', text }).catch(() => {}); }
                            else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Compartir
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-5">
                    {/* Cabecera estilo Instagram: foto + números en fila */}
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <button onClick={() => setShowEditProfile(true)} className="block">
                          <img src={userProfile.photoURL || GENERIC_AVATAR} className="w-20 h-20 rounded-full border-2 border-white/10 object-cover" referrerPolicy="no-referrer" />
                        </button>
                        <button onClick={() => setShowEditProfile(true)} className="absolute -bottom-1 -right-1 p-1.5 bg-zinc-800 rounded-full shadow-lg text-iogga-primary border border-white/10 active:scale-90 transition-transform">
                          <Edit3 size={13} />
                        </button>
                      </div>
                      <div className="flex-1 flex items-center justify-around">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white">{plans.filter(p => isMyPlan(p)).length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Planes</span>
                        </div>
                        <button onClick={() => setShowFriends('following')} className="flex flex-col items-center active:scale-95 transition-transform">
                          <span className="text-lg font-black text-white">{followingAll.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Amigos</span>
                        </button>
                        <button onClick={() => setShowFriends('followers')} className="flex flex-col items-center active:scale-95 transition-transform">
                          <span className="text-lg font-black text-white">{followersAll.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Seguidores</span>
                        </button>
                      </div>
                    </div>

                    {/* Nombre, usuario y bio */}
                    <div className="space-y-1">
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        {currentUser?.name || GUEST_NAME}
                        {currentUser && !currentUser.isAnonymous && (
                          <span className="text-[11px] text-yellow-500 font-bold flex items-center gap-0.5"><Star size={11} fill="currentColor" /> {bayesianRating((userProfile as any).ratingSum, (userProfile as any).ratingCount).toFixed(1)}</span>
                        )}
                      </h2>
                      <p className="text-zinc-500 text-xs">@{(currentUser?.name || GUEST_NAME).toLowerCase().replace(/\s+/g, '')}</p>
                      {userProfile.bio && <p className="text-sm text-white/80 leading-snug pt-1">{userProfile.bio}</p>}
                      {socialChips(userProfile).length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                          {socialChips(userProfile).map(c => (
                            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={`text-[12px] font-black active:scale-95 transition-all ${c.color}`}>{c.label}</a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones: Editar perfil · Compartir · Agregar amigos */}
                    <div className="flex gap-2">
                      <button onClick={() => setShowEditProfile(true)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                        Editar perfil
                      </button>
                      <button
                        onClick={() => {
                          const name = currentUser?.name || 'Alguien';
                          const text = `Encuéntrame en iogga: ${window.location.origin}\n\niogga es la app para salir del móvil y vivir lo espontáneo.`;
                          if ((navigator as any).share) { (navigator as any).share({ title: name, text }).catch(() => {}); }
                          else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Compartir
                      </button>
                      <button onClick={() => setShowFriends('following')} title="Agregar amigos" className="px-3 py-2.5 rounded-xl bg-iogga-primary/15 border border-iogga-primary/30 text-iogga-primary active:scale-95 transition-all">
                        <UserPlus size={16} />
                      </button>
                    </div>

                    {/* Sin sesión: acceso siempre visible también en el perfil */}
                    {!isLoggedIn && (
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="w-full py-4 rounded-2xl bg-iogga-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-iogga-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <User size={16} /> Iniciar sesión o registrarte
                      </button>
                    )}

                    {/* Cuadrícula de mis planes (como el feed de tu perfil) */}
                    {plans.filter(p => isMyPlan(p)).length > 0 && (
                      <div className="grid grid-cols-3 gap-1 pt-2">
                        {plans.filter(p => isMyPlan(p)).map(pl => (
                          <button key={pl.id} onClick={() => setSelectedPlanForDetails(pl)} className="aspect-square rounded-lg overflow-hidden relative active:scale-95 transition-transform">
                            <img src={pl.image || `https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=300&q=80`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-bold text-white truncate text-left">{pl.activity}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Medidor: Completa tu perfil (invitación, nunca obligación) */}
                {mode === 'person' && profileDone < profileSteps.length && (
                  <div className="px-6 pt-2">
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setIsRegistering(true);
                          setShowLoginModal(true);
                        } else {
                          setShowEditProfile(true);
                        }
                      }}
                      className="w-full p-5 rounded-3xl bg-gradient-to-r from-iogga-primary/20 to-iogga-accent/10 border border-iogga-primary/30 text-left space-y-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          {currentUser ? 'Completa tu perfil' : 'Crea tu cuenta gratis'}
                        </span>
                        <span className="text-xs font-black text-iogga-primary bg-iogga-primary/10 border border-iogga-primary/30 px-3 py-1 rounded-full">
                          {profileDone} de {profileSteps.length}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-iogga-primary to-iogga-accent transition-all duration-500"
                          style={{ width: `${(profileDone / profileSteps.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        Siguiente paso: <span className="text-white font-bold">{profileSteps.find(s => !s.done)?.label}</span> · Un perfil completo recibe más invitaciones ✨
                      </p>
                    </button>
                  </div>
                )}

                {!isStandalone && (
                  <div className="px-6 pt-4">
                    <button
                      onClick={() => setShowInstall(true)}
                      className="w-full p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-iogga-primary/15 text-iogga-primary">
                          <Smartphone size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-sm">Instalar iogga en tu celular</p>
                          <p className="text-[10px] text-zinc-500">Gratis · No ocupa espacio · Sin tiendas</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-zinc-500" />
                    </button>
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <section className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Análisis de Perfil IA</h3>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Tu perfil tiene un <span className="text-indigo-400 font-bold">85% de compatibilidad</span> con planes de aventura y café. ¡Sigue así!
                    </p>
                    <button onClick={() => comingSoon("Insights detallados")} className="w-full py-2 bg-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-bold border border-indigo-500/30">
                      Ver Insights Detallados
                    </button>
                  </section>

                  {/* Option: Tengo / No tengo negocio */}
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 text-red-400 rounded-xl">
                        <Store size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-sm">Tengo negocio</p>
                        <p className="text-[10px] text-zinc-500 leading-tight">Actívalo para crear el perfil de tu negocio</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBusiness}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setHasBusiness(val);
                          if (val) {
                            // Al activarlo, llevar directo a crear el perfil del negocio
                            toggleMode('business');
                            setActiveTab('profile');
                            setShowEditBusinessProfile(true);
                          } else {
                            setMode('person');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-iogga-accent after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-iogga-accent/20"></div>
                      <span className="ml-2 text-xs font-bold text-zinc-400 select-none uppercase tracking-wider">{hasBusiness ? 'Sí' : 'No'}</span>
                    </label>
                  </div>

                  <button 
                    onClick={() => {
                      if (!hasBusiness) {
                        triggerBeta("Función Inhabilitada", "La sección de negocios está inhabilitada porque marcaste la opción 'No tengo negocio' en tu perfil.");
                        return;
                      }
                      toggleMode(mode === 'person' ? 'business' : 'person');
                    }}
                    className={`w-full p-5 rounded-3xl flex items-center justify-between transition-all ${!hasBusiness ? 'bg-zinc-900 border border-white/5 text-zinc-500 opacity-50 cursor-not-allowed' : mode === 'person' ? 'bg-iogga-accent text-white' : 'bg-iogga-primary text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      {mode === 'person' ? <Store size={24} /> : <User size={24} />}
                      <div className="text-left">
                        <p className="font-bold">{!hasBusiness ? 'Modo Negocio Inhabilitado' : `Cambiar a ${mode === 'person' ? 'Negocio' : 'Personal'}`}</p>
                        <p className="text-xs opacity-80">{!hasBusiness ? 'Función comercial restringida' : `Gestiona tus ${mode === 'person' ? 'promociones' : 'planes'}`}</p>
                      </div>
                    </div>
                    {hasBusiness ? <ChevronRight size={20} /> : <ShieldAlert size={20} className="text-red-500/80 animate-pulse shrink-0" />}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <ProfileButton icon={<Wallet size={20} />} label="Billetera" onClick={() => comingSoon('Billetera')} />
                    <ProfileButton icon={<Users size={20} />} label="Amigos" onClick={() => setShowFriends('following')} />
                    <ProfileButton icon={<TrendingUp size={20} />} label="Actividad" onClick={() => comingSoon('Actividad')} />
                    <ProfileButton icon={<Bell size={20} />} label="Ajustes" onClick={() => setShowSettingsMenu(true)} />
                  </div>

                  <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Sparkles size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">IA Matchmaking</p>
                        <p className="text-xs text-zinc-400">Encuentra planes perfectos</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-indigo-500 rounded-full relative p-1 cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        <nav className="glass absolute bottom-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-40" id="tutorial-nav">
          {mode === 'person' ? (
            <>
              <NavButton 
                id="nav-home"
                active={activeTab === 'home'} 
                onClick={() => setActiveTab('home')} 
                icon={<Home size={26} />} 
                label="Inicio" 
                color="text-iogga-primary" 
              />
              <NavButton 
                id="nav-search"
                active={activeTab === 'search'} 
                onClick={() => setActiveTab('search')} 
                icon={<Globe size={26} />} 
                label="Explora" 
                color="text-iogga-primary" 
              />
              <NavButton 
                id="nav-active"
                active={activeTab === 'active'} 
                onClick={() => setActiveTab('active')} 
                icon={<LayoutGrid size={26} />} 
                label="Mis Planes" 
                color="text-iogga-primary" 
              />
              <NavButton 
                id="nav-profile"
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
                onDoubleClick={() => toggleMode('business')}
                icon={
                  <div className="relative">
                    <img src={userProfile.photoURL || GENERIC_AVATAR} className="w-7 h-7 rounded-full border border-white/20 object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-iogga-primary rounded-full border border-zinc-950 flex items-center justify-center shadow-lg">
                      <User size={8} className="text-white" />
                    </div>
                  </div>
                } 
                label="Perfil" 
                color="text-iogga-primary" 
              />
            </>
          ) : (
            <>
              <NavButton 
                id="nav-analytics"
                active={activeTab === 'analytics'} 
                onClick={() => setActiveTab('analytics')} 
                icon={<BarChart3 size={26} />} 
                label="Analítica" 
                color="text-iogga-accent" 
              />
              <NavButton
                id="nav-search"
                active={activeTab === 'search'}
                onClick={() => setActiveTab('search')}
                icon={<Globe size={26} />}
                label="Explora"
                color="text-iogga-accent"
              />
              {/* Escáner de canjes: siempre al centro, como Authenticator */}
              <button
                id="nav-scan"
                onClick={() => ensureLoggedIn(() => setShowValidateModal(true))}
                className="relative -mt-8 w-16 h-16 rounded-full bg-iogga-accent text-white flex flex-col items-center justify-center shadow-2xl shadow-iogga-accent/40 border-4 border-zinc-950 active:scale-90 transition-transform"
              >
                <QrCode size={26} />
                <span className="absolute -bottom-5 text-[9px] font-black uppercase tracking-widest text-iogga-accent">Escanear</span>
              </button>
              <NavButton
                id="nav-active"
                active={activeTab === 'active'}
                onClick={() => setActiveTab('active')}
                icon={<LayoutGrid size={26} />}
                label="Mis Ofertas"
                color="text-iogga-accent"
              />
              <NavButton 
                id="nav-profile"
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
                onDoubleClick={() => toggleMode('person')}
                icon={
                  <div className="relative">
                    <img src={businessProfile.logo || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80"} className="w-7 h-7 rounded-lg border border-white/20 object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-iogga-accent rounded-full border border-zinc-950 flex items-center justify-center shadow-lg">
                      <Store size={8} className="text-white" />
                    </div>
                  </div>
                } 
                label="Perfil" 
                color="text-iogga-accent" 
              />
            </>
          )}
        </nav>

        {/* Modals */}
        <AnimatePresence>
          {showCreatePlan && (
            <Modal
              onClose={() => {
                // Pokayoke: si ya escribió algo, preguntar antes de perderlo
                if (!editingPlanId && (newPlan.activity || newPlan.location || newPlan.comment)) {
                  setAskDraft(true);
                  return;
                }
                closeCreatePlan();
              }}
              onBack={currentPlanStep > 0 ? () => setCurrentPlanStep(currentPlanStep - 1) : undefined}
              title={editingPlanId ? "Editar Plan" : "Crear Plan"}
            >
              {/* ¿Guardar borrador? — nunca se pierde nada sin preguntar */}
              {askDraft && (
                <div className="mb-5 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <p className="text-sm font-black text-white">¿Guardamos tu plan como borrador?</p>
                  <p className="text-xs text-zinc-400">Podrás continuarlo la próxima vez que toques +.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { try { localStorage.setItem('iogga_plan_draft', JSON.stringify({ plan: newPlan, step: currentPlanStep, guestName })); } catch {} setAskDraft(false); closeCreatePlan(); triggerBeta('Borrador guardado', 'Tu plan te espera: toca + para continuarlo.'); }}
                      className="flex-1 py-3 rounded-2xl bg-iogga-primary text-white text-[11px] font-black uppercase tracking-widest active:scale-95"
                    >
                      Guardar borrador
                    </button>
                    <button
                      onClick={() => { try { localStorage.removeItem('iogga_plan_draft'); } catch {} setAskDraft(false); closeCreatePlan(); }}
                      className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-black uppercase tracking-widest active:scale-95"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={() => setAskDraft(false)}
                      className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest active:scale-95"
                    >
                      Seguir editando
                    </button>
                  </div>
                </div>
              )}
              {/* Platica por voz: la app pregunta y tú respondes hablando */}
              {platicaOn && (
                <div className="mb-5 p-5 rounded-3xl bg-iogga-primary/10 border border-iogga-primary/30 text-center space-y-3">
                  {(() => { const listening = /escuchando/i.test(platicaStatus); return (
                  <div className="flex justify-center">
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${listening ? 'bg-red-500 text-white' : 'bg-iogga-primary/20 text-iogga-primary'}`}>
                      {listening && (
                        <>
                          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
                          <span className="absolute -inset-2 rounded-full border-2 border-red-400/40 animate-pulse" />
                        </>
                      )}
                      <Mic size={28} className="relative z-10" />
                    </div>
                  </div>
                  ); })()}
                  <p className="text-sm font-bold text-white leading-snug min-h-[40px] flex items-center justify-center">{platicaStatus || 'Preparando…'}</p>
                  <button
                    onClick={() => { platicaCancel.current = true; abortListen(); try { window.speechSynthesis?.cancel(); } catch {} setPlaticaOn(false); setPlaticaStatus(''); }}
                    className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full active:scale-95"
                  >
                    Terminar platica
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex gap-1 mb-4">
                  {[0, 1, 2, 3, 4, 5, 6].map(step => (
                    <div 
                      key={step} 
                      className={`h-1 flex-1 rounded-full transition-all ${step <= currentPlanStep ? 'bg-iogga-primary' : 'bg-white/10'}`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {currentPlanStep === 0 && (
                    <motion.div 
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <label className="text-lg font-bold text-white block">¿Qué quieres hacer?</label>
                      <div className="relative">
                        <input
                          ref={planInputRef}
                          type="text"
                          placeholder="Escribe tus planes o deseos"
                          className="w-full h-16 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium"
                          value={newPlan.activity || ''}
                          onChange={e => setNewPlan({...newPlan, activity: e.target.value})}
                          autoFocus
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { if (platicaOn) setPlaticaOn(false); else startPlaticaAt(0); }}
                            title={platicaOn ? 'Detener la plática' : 'Platícalo por voz'}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-iogga-primary/15 text-iogga-primary hover:bg-iogga-primary/25 transition-all active:scale-90"
                          >
                            <AudioLines size={16} />
                          </button>
                          <MicButton inline onText={t => setNewPlan(p => ({ ...p, activity: t }))} />
                        </div>
                      </div>

                      {/* Luciérnagas: ideas flotando libres (sin caja), que cambian solas */}
                      <FireflyWords onPick={w => setNewPlan({...newPlan, activity: w})} />

                      {/* Pokayoke: pista de voz, solo para quien aún no crea nada */}
                      {!hasCreatedAnything && !barHintSeen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 p-3 rounded-2xl bg-iogga-primary/10 border border-iogga-primary/25"
                        >
                          <Sparkles size={14} className="text-iogga-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-zinc-300 leading-snug flex-1">
                            Toca <Mic size={11} className="inline align-middle text-iogga-primary" /> para <b className="text-white">dictar</b>, o <AudioLines size={11} className="inline align-middle text-iogga-primary" /> para <b className="text-white">platicarlo por voz</b> y armar tu plan solo.
                          </p>
                          <button onClick={dismissBarHint} className="text-[10px] font-black text-iogga-primary uppercase tracking-widest shrink-0">Ok</button>
                        </motion.div>
                      )}
                      {(!currentUser || currentUser.isAnonymous) && (
                        <>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Tu nombre (para firmar tu invitación)"
                              className="w-full h-14 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                              value={guestName}
                              onChange={e => setGuestName(e.target.value)}
                            />
                            <FieldVoice step={0} onDicta={t => setGuestName(t)} />
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Clave privada (para que confíen: 'soy tu primo Beto')"
                              className="w-full h-14 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                              value={newPlan.privateKey || ''}
                              onChange={e => setNewPlan({ ...newPlan, privateKey: e.target.value })}
                            />
                            <FieldVoice step={0} onDicta={t => setNewPlan(p => ({ ...p, privateKey: t }))} />
                          </div>
                        </>
                      )}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Comentario (opcional). Ej. Lleven suéter"
                          className="w-full h-14 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                          value={newPlan.comment || ''}
                          onChange={e => setNewPlan({...newPlan, comment: e.target.value})}
                        />
                        <FieldVoice step={0} onDicta={t => setNewPlan(p => ({ ...p, comment: t }))} />
                      </div>
                    </motion.div>
                  )}

                  {currentPlanStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-bold text-white block">¿Qué día y a qué hora?</label>
                        <VoicePair step={1} onDicta={applyDateTime} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">¿Qué día?</label>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                          {dateOptions.map(opt => (
                            <button
                              key={opt.iso}
                              onClick={() => setNewPlan({...newPlan, date: opt.iso, dateLabel: opt.label})}
                              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${newPlan.date === opt.iso ? 'bg-iogga-primary border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                            >
                              {opt.chip}
                            </button>
                          ))}
                          <label className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer relative ${newPlan.date && !dateOptions.some(o => o.iso === newPlan.date) ? 'bg-iogga-primary border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                            📅 Otra
                            <input
                              type="date"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              min={dateOptions[0].iso}
                              value={newPlan.date || ''}
                              onChange={e => e.target.value && setNewPlan({...newPlan, date: e.target.value, dateLabel: customDateLabel(e.target.value)})}
                            />
                          </label>
                        </div>
                      </div>
                      {/* Inicio arriba, fin abajo (apiladas para que no se empalmen) */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 tracking-wider"><Clock size={12}/> Inicio</label>
                          <div className="relative">
                            <input type="time" className="time-clean w-full h-16 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white text-base font-medium" value={newPlan.startTime || ''} onChange={e => setNewPlan({...newPlan, startTime: e.target.value})} />
                            <FieldVoice step={1} onDicta={t => { const p = parseTime(t); if (p) setNewPlan(np => ({ ...np, startTime: p })); }} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 tracking-wider"><Clock size={12}/> Fin</label>
                          <div className="relative">
                            <input type="time" className="time-clean w-full h-16 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white text-base font-medium" value={newPlan.endTime || ''} onChange={e => setNewPlan({...newPlan, endTime: e.target.value})} />
                            <FieldVoice step={1} onDicta={t => { const p = parseTime(t); if (p) setNewPlan(np => ({ ...np, endTime: p })); }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentPlanStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-bold text-white block">¿Cómo pagamos?</label>
                        <VoicePair step={2} onDicta={applyBudget} />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setNewPlan({...newPlan, budget: 'invites'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.budget === 'invites' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">Yo invito</p>
                          <p className="text-xs opacity-60">Yo me encargo de los gastos</p>
                        </button>
                        <button 
                          onClick={() => setNewPlan({...newPlan, budget: 'split'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.budget === 'split' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">Cada quien</p>
                          <p className="text-xs opacity-60">Dividimos la cuenta</p>
                        </button>
                        <button
                          onClick={() => setNewPlan({...newPlan, budget: 'no-money'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.budget === 'no-money' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">Sin presupuesto</p>
                          <p className="text-xs opacity-60">No cuento con dinero para este plan</p>
                        </button>
                        <button
                          onClick={() => setNewPlan({...newPlan, budget: 'not-needed'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.budget === 'not-needed' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">No se necesita</p>
                          <p className="text-xs opacity-60">El dinero no es tema en este plan</p>
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Comentario sobre el presupuesto (opcional)</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ej. Traigan para la propina, la entrada es libre…"
                            className="w-full h-16 pl-6 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                            value={newPlan.budgetAmount || ''}
                            onChange={e => setNewPlan({...newPlan, budgetAmount: e.target.value})}
                          />
                          <FieldVoice step={2} onDicta={t => setNewPlan(p => ({ ...p, budgetAmount: t }))} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentPlanStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-bold text-white block">¿Cómo llegamos?</label>
                        <VoicePair step={3} onDicta={applyTransport} />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setNewPlan({...newPlan, transport: 'has-transport'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.transport === 'has-transport' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">Tengo carro</p>
                          <p className="text-xs opacity-60">Puedo pasar por alguien</p>
                        </button>
                        <button 
                          onClick={() => setNewPlan({...newPlan, transport: 'each-arrives'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.transport === 'each-arrives' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">Cada quien llega</p>
                          <p className="text-xs opacity-60">Nos vemos en el lugar</p>
                        </button>
                        <button
                          onClick={() => setNewPlan({...newPlan, transport: 'no-transport'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.transport === 'no-transport' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">No tengo transporte</p>
                          <p className="text-xs opacity-60">Busco quién me lleve</p>
                        </button>
                        <button
                          onClick={() => setNewPlan({...newPlan, transport: 'not-needed'})}
                          className={`p-4 rounded-2xl border text-left transition-all ${newPlan.transport === 'not-needed' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold">No se necesita</p>
                          <p className="text-xs opacity-60">El transporte no es tema en este plan</p>
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notas de transporte</label>
                        <div className="relative">
                          <textarea
                            placeholder={
                              newPlan.transport === 'has-transport' ? "Ej. Yo paso por todos o cabemos 3..." :
                              newPlan.transport === 'no-transport' ? "Ej. Yo pongo para la gas..." :
                              "Ej. Nos vemos en la entrada..."
                            }
                            className="w-full h-24 pl-6 pr-24 py-4 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium resize-none"
                            value={newPlan.transportNote || ''}
                            onChange={e => setNewPlan({...newPlan, transportNote: e.target.value})}
                          />
                          <FieldVoice step={3} atTop onDicta={t => setNewPlan(p => ({ ...p, transportNote: t }))} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentPlanStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-bold text-white block">¿Dónde nos vemos?</label>
                        <VoicePair step={4} onDicta={t => setNewPlan(p => ({ ...p, location: t }))} />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                          type="text"
                          placeholder="Ej. Centro, Plaza, Starbucks..."
                          className="w-full h-16 pl-12 pr-24 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium"
                          value={newPlan.location || ''}
                          onChange={e => setNewPlan({...newPlan, location: e.target.value})}
                          autoFocus
                        />
                        <FieldVoice step={4} onDicta={t => setNewPlan(p => ({ ...p, location: t }))} />
                      </div>
                      {(newPlan.locations || []).map((loc, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Ubicación ${i + 2}`}
                            className="flex-1 h-14 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                            value={loc}
                            onChange={e => {
                              const locs = [...(newPlan.locations || [])];
                              locs[i] = e.target.value;
                              setNewPlan({...newPlan, locations: locs});
                            }}
                          />
                          <button
                            onClick={() => setNewPlan({...newPlan, locations: (newPlan.locations || []).filter((_, j) => j !== i)})}
                            className="w-14 h-14 rounded-[20px] bg-white/5 border border-white/10 text-zinc-500 flex items-center justify-center active:scale-90"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setNewPlan({...newPlan, locations: [...(newPlan.locations || []), '']})}
                        className="w-full py-3 bg-white/5 border border-dashed border-white/15 text-zinc-400 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus size={14} />
                        Agregar otra ubicación
                      </button>
                    </motion.div>
                  )}

                  {currentPlanStep === 5 && (
                    <motion.div 
                      key="step5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-bold text-white block">¿Quién puede verlo?</label>
                        <VoicePair step={5} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={() => setNewPlan({...newPlan, isPublic: true, guests: 'public'})}
                          className={`p-4 rounded-2xl border text-center transition-all ${newPlan.isPublic ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold text-sm">Público</p>
                          <p className="text-[10px] opacity-60">Todos</p>
                        </button>
                        <button 
                          onClick={() => setNewPlan({...newPlan, isPublic: false, guests: 'friends'})}
                          className={`p-4 rounded-2xl border text-center transition-all ${!newPlan.isPublic && newPlan.guests === 'friends' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold text-sm">Amigos</p>
                          <p className="text-[10px] opacity-60">Contactos</p>
                        </button>
                        <button 
                          onClick={() => setNewPlan({...newPlan, isPublic: false, guests: 'groups'})}
                          className={`p-4 rounded-2xl border text-center transition-all ${!newPlan.isPublic && newPlan.guests === 'groups' ? 'bg-iogga-primary/20 border-iogga-primary text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          <p className="font-bold text-sm">Grupos</p>
                          <p className="text-[10px] opacity-60">Seleccionar</p>
                        </button>
                      </div>

                      {/* Amigos: lista de iogga inline con casillas redondas + buscador */}
                      {!newPlan.isPublic && newPlan.guests === 'friends' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                        >
                          <p className="text-xs font-bold text-iogga-primary uppercase tracking-widest">Invitar amigos de iogga</p>
                          {/* Buscador */}
                          <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              value={friendSearch}
                              onChange={(e) => setFriendSearch(e.target.value)}
                              placeholder="Buscar en iogga…"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-iogga-primary/40"
                            />
                          </div>
                          {(() => {
                            const q = friendSearch.trim().toLowerCase();
                            // Combina tus amigos con resultados de búsqueda, sin duplicar
                            const byId: Record<string, Friend> = {};
                            following.forEach(f => { byId[f.uid] = f; });
                            if (q.length >= 2) friendResults.forEach(f => { if (!byId[f.uid]) byId[f.uid] = f; });
                            let list = Object.values(byId);
                            if (q) list = list.filter(f => f.name.toLowerCase().includes(q));
                            if (list.length === 0) {
                              return q.length >= 2 ? (
                                <p className="text-xs text-zinc-400 leading-relaxed">Nadie con ese nombre. Compárteles tu plan por WhatsApp al publicar.</p>
                              ) : (
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Aún no tienes amigos en iogga. Búscalos arriba o compárteles tu plan por WhatsApp al publicar.
                                </p>
                              );
                            }
                            return (
                              <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                                {list.map(f => {
                                  const sel = selectedFriendIds.includes(f.uid);
                                  return (
                                    <button
                                      key={f.uid}
                                      onClick={() => setSelectedFriendIds(prev => sel ? prev.filter(id => id !== f.uid) : [...prev, f.uid])}
                                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${sel ? 'bg-iogga-primary/15 border-iogga-primary/40' : 'bg-white/5 border-white/10'}`}
                                    >
                                      {f.photo ? <img src={f.photo} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white">{f.name.charAt(0).toUpperCase()}</div>}
                                      <span className="text-sm text-white flex-1 text-left">{f.name}</span>
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${sel ? 'bg-iogga-primary text-white' : 'border-2 border-white/20'}`}>
                                        {sel && <Check size={14} />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          <p className="text-[10px] text-zinc-600">Les llegará una notificación en iogga. También podrás compartir por WhatsApp al publicar.</p>
                        </motion.div>
                      )}

                      {/* Grupos: aún no disponibles */}
                      {!newPlan.isPublic && newPlan.guests === 'groups' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center"
                        >
                          <Users size={26} className="mx-auto text-zinc-500 mb-2" />
                          <p className="text-sm text-zinc-300 font-bold">No hay grupos creados</p>
                          <p className="text-[11px] text-zinc-500 mt-1">Al rato vemos cómo crearlos.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {currentPlanStep === 6 && (
                    <motion.div 
                      key="step6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <label className="text-lg font-bold text-white block">Dale un toque visual</label>
                      <div className="relative">
                        <button
                          onClick={async () => {
                            const img = await pickImage(900);
                            if (img) setNewPlan({...newPlan, image: img});
                          }}
                          className="w-full aspect-video rounded-3xl bg-white/5 flex flex-col items-center justify-center border-2 border-dashed border-white/10 text-zinc-500 overflow-hidden relative group"
                        >
                          {newPlan.image ? (
                            <img src={newPlan.image} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <PlusCircle size={32} />
                              <p className="text-xs mt-2 font-bold uppercase tracking-widest">Subir Foto</p>
                            </>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">{newPlan.image ? 'Cambiar Foto' : 'Subir Foto'}</span>
                          </div>
                        </button>
                        {/* Botecito sobre la foto: otra forma pokayoke de quitarla */}
                        {newPlan.image && (
                          <button
                            onClick={() => setNewPlan({...newPlan, image: undefined})}
                            title="Quitar foto"
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-xl border border-white/20 active:scale-90 transition-all z-10"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      {newPlan.image && (
                        <button
                          onClick={() => setNewPlan({...newPlan, image: undefined})}
                          className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          Quitar foto
                        </button>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sugerencias para "{newPlan.activity || 'tu plan'}"</p>
                        <div className="grid grid-cols-3 gap-2">
                          {suggestedPhotos(newPlan.activity || '').map(url => (
                            <button
                              key={url}
                              onClick={() => setNewPlan({...newPlan, image: `${url}?auto=format&fit=crop&w=800&q=80`})}
                              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${newPlan.image?.startsWith(url) ? 'border-iogga-primary' : 'border-white/10'}`}
                            >
                              <img src={`${url}?auto=format&fit=crop&w=200&q=60`} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(newPlan.activity || 'plan con amigos')}`, '_blank')}
                        className="w-full py-3 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Search size={14} />
                        Buscar imagen en Google
                      </button>
                      <p className="text-[10px] text-zinc-600 text-center">Elige una sugerencia, sube la tuya, o busca en Google (guárdala y súbela).</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-4">
                  {currentPlanStep < 6 ? (
                    <button
                      onClick={() => {
                        const next = currentPlanStep + 1;
                        setCurrentPlanStep(next);
                        // Si la plática está activa, córtala y arranca con la pregunta de la pantalla siguiente.
                        if (platicaOn) {
                          platicaCancel.current = true; abortListen(); try { window.speechSynthesis?.cancel(); } catch {}
                          setPlaticaOn(false);
                          setPlaticaFromStep(next);
                          setTimeout(() => setPlaticaOn(true), 200);
                        }
                      }}
                      disabled={currentPlanStep === 0 && !newPlan.activity}
                      className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-base shadow-xl shadow-iogga-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      onClick={() => { void handlePublishPlan(); }}
                      className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-base shadow-xl shadow-iogga-primary/20 active:scale-95 transition-transform"
                    >
                      {editingPlanId ? 'Guardar Cambios' : 'Revisar mi invitación'}
                    </button>
                  )}
                </div>
              </div>
            </Modal>
          )}

          {showCreatePromo && (
            <Modal onClose={() => {
              setShowCreatePromo(false);
              setEditingPromoId(null);
              setPromoImage(null);
              setNewPromo({
                title: '',
                description: '',
                price: '',
                offer: '',
                location: ''
              });
            }} title={editingPromoId ? "Editar oferta" : "Publicar oferta"}>
              <div className="space-y-6">
                <button
                  onClick={async () => {
                    const img = await pickImage(900);
                    if (img) setPromoImage(img);
                  }}
                  className="w-full aspect-video rounded-2xl bg-white/5 flex flex-col items-center justify-center border-2 border-dashed border-white/10 text-zinc-500 overflow-hidden relative group"
                >
                  {promoImage ? (
                    <img src={promoImage} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <PlusCircle size={32} />
                      <p className="text-xs mt-2 font-bold uppercase tracking-widest">Subir Foto Real</p>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Cambiar Foto</span>
                  </div>
                </button>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Información del Producto</label>
                    <button 
                      onClick={() => {
                        setNewPromo({
                          ...newPromo,
                          title: "Combo Especial de Verano",
                          description: "Disfruta de nuestra selección premium con un descuento exclusivo por tiempo limitado. ¡No te lo pierdas!",
                          price: "$199",
                          offer: "20% OFF"
                        });
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-iogga-accent uppercase tracking-widest bg-iogga-accent/10 px-3 py-1.5 rounded-full border border-iogga-accent/20"
                    >
                      <Sparkles size={12} />
                      Generar con IA
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Título del producto" 
                      className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-accent outline-none text-base font-medium" 
                      value={newPromo.title || ''} 
                      onChange={e => setNewPromo({...newPromo, title: e.target.value})} 
                    />
                    <textarea 
                      placeholder="Descripción" 
                      className="w-full h-24 px-6 py-4 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-accent outline-none text-base font-medium resize-none" 
                      value={newPromo.description || ''} 
                      onChange={e => setNewPromo({...newPromo, description: e.target.value})} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Precio" 
                        className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-accent outline-none text-base font-medium" 
                        value={newPromo.price || ''} 
                        onChange={e => setNewPromo({...newPromo, price: e.target.value})} 
                      />
                      <input 
                        type="text" 
                        placeholder="Oferta (Ej. 2x1)" 
                        className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-accent outline-none text-base font-medium" 
                        value={newPromo.offer || ''} 
                        onChange={e => setNewPromo({...newPromo, offer: e.target.value})} 
                      />
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ubicación" 
                    className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-accent outline-none text-base font-medium" 
                    value={newPromo.location || ''} 
                    onChange={e => setNewPromo({...newPromo, location: e.target.value})} 
                  />
                </div>
                <button 
                  onClick={handlePublishPromo}
                  className="w-full py-4 bg-iogga-accent text-white rounded-2xl font-bold text-lg shadow-lg shadow-iogga-accent/20 active:scale-95 transition-transform"
                >
                  {editingPromoId ? 'Guardar Cambios' : 'Publicar oferta'}
                </button>

                {editingPromoId && (
                  <button 
                    onClick={() => {
                      setPromos(promos.filter(p => p.id !== editingPromoId));
                      setShowCreatePromo(false);
                      setEditingPromoId(null);
                    }}
                    className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold text-lg border border-red-500/20 active:scale-95 transition-transform"
                  >
                    Eliminar Producto
                  </button>
                )}
              </div>
            </Modal>
          )}

          {showEditProfile && (
            <Modal onClose={() => setShowEditProfile(false)} title="Editar Perfil">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <img src={editPhoto || userProfile.photoURL || GENERIC_AVATAR} className="w-24 h-24 rounded-full border-4 border-iogga-primary/20 shadow-xl object-cover" referrerPolicy="no-referrer" />
                    <button
                      onClick={async () => {
                        const img = await pickImage(300, 0.8);
                        if (img) setEditPhoto(img);
                      }}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-iogga-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-900"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Toca la cámara y sube tu foto real</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nombre Completo</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Tu nombre" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-iogga-primary transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Biografía</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Cuéntanos de ti: ¿qué planes te gustan?" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium outline-none focus:ring-2 focus:ring-iogga-primary transition-all h-24 resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Ubicación</label>
                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Ej. Chihuahua, MX" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-iogga-primary transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">WhatsApp (10 dígitos)</label>
                    <input type="tel" value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} placeholder="Ej. 6141234567" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-iogga-primary transition-all" />
                    <p className="text-[10px] text-zinc-600 ml-4">Solo lo verán quienes acepten tus planes, para coordinar directo.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Instagram (opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
                      <input type="text" value={editInstagram} onChange={e => setEditInstagram(e.target.value.replace(/[@\s]/g, ''))} placeholder="tu_usuario" className="w-full p-4 pl-9 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-iogga-primary transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Sitios y redes (opcional)</label>
                    {[{k:'website',ph:'Sitio web (https://…)'},{k:'facebook',ph:'Facebook'},{k:'tiktok',ph:'TikTok'},{k:'linkedin',ph:'LinkedIn'}].map(({k,ph}) => (
                      <input key={k} type="text" value={(editLinks as any)[k]} onChange={e => setEditLinks({...editLinks, [k]: e.target.value})} placeholder={ph} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium outline-none focus:ring-2 focus:ring-iogga-primary transition-all text-sm" />
                    ))}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (currentUser) {
                      await saveProfile(currentUser.uid, {
                        name: editName.trim() || currentUser.name,
                        bio: editBio.trim(),
                        location: editLocation.trim(),
                        photoURL: editPhoto || userProfile.photoURL || null,
                        whatsapp: editWhatsapp.replace(/\D/g, ''),
                        instagram: editInstagram.replace(/[@\s]/g, ''),
                        website: editLinks.website.trim(),
                        facebook: editLinks.facebook.trim(),
                        tiktok: editLinks.tiktok.trim(),
                        linkedin: editLinks.linkedin.trim(),
                      }).catch(() => {});
                      if (editName.trim()) setCurrentUser({ ...currentUser, name: editName.trim() });
                    }
                    setShowEditProfile(false);
                  }}
                  className="w-full py-4 bg-iogga-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-iogga-primary/20 active:scale-95 transition-transform"
                >
                  Guardar Cambios
                </button>
              </div>
            </Modal>
          )}

          {showEditBusinessProfile && (
            <Modal onClose={() => setShowEditBusinessProfile(false)} title="Editar Perfil de Negocio">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">1. Portada, logo y fotos</label>
                  {/* Portada arriba (ancha), como en las apps de negocios */}
                  <button
                    onClick={async () => {
                      const img = await pickImage(900);
                      if (img) setBusinessProfile({...businessProfile, cover: img});
                    }}
                    className="w-full aspect-video rounded-2xl bg-white/5 border-2 border-dashed border-white/15 overflow-hidden relative group flex flex-col items-center justify-center text-zinc-500"
                  >
                    {businessProfile.cover ? (
                      <img src={businessProfile.cover} className="w-full h-full object-cover" />
                    ) : (
                      <><PlusCircle size={28} /><span className="text-[10px] font-bold uppercase tracking-widest mt-2">Subir portada</span></>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{businessProfile.cover ? 'Cambiar portada' : 'Subir portada'}</span>
                    </div>
                  </button>
                  {/* Logo debajo */}
                  <button
                    onClick={async () => {
                      const img = await pickImage(300, 0.8);
                      if (img) setBusinessProfile({...businessProfile, logo: img});
                    }}
                    className="aspect-square rounded-full bg-white/5 border-2 border-dashed border-white/15 overflow-hidden relative group w-20 mx-auto flex flex-col items-center justify-center text-zinc-500"
                  >
                    {businessProfile.logo ? (
                      <img src={businessProfile.logo} className="w-full h-full object-cover" />
                    ) : (
                      <><PlusCircle size={18} /><span className="text-[7px] font-bold uppercase tracking-widest mt-1">Logo</span></>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[7px] font-bold text-white uppercase tracking-widest text-center">{businessProfile.logo ? 'Cambiar' : 'Logo'}</span>
                    </div>
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">2. Datos del negocio</label>
                  <input
                    type="text"
                    value={businessProfile.name || ''}
                    onChange={e => setBusinessProfile({...businessProfile, name: e.target.value})}
                    placeholder="Nombre del Negocio"
                    className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none"
                  />
                  <textarea 
                    value={businessProfile.bio || ''}
                    onChange={e => setBusinessProfile({...businessProfile, bio: e.target.value})}
                    placeholder="Descripción"
                    className="w-full h-24 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">3. Contacto</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={businessProfile.phone || ''}
                      onChange={e => setBusinessProfile({...businessProfile, phone: e.target.value})}
                      placeholder="Teléfono"
                      className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none"
                    />
                    <input 
                      type="text" 
                      value={businessProfile.instagram || ''}
                      onChange={e => setBusinessProfile({...businessProfile, instagram: e.target.value})}
                      placeholder="Instagram"
                      className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={businessProfile.location || ''}
                    onChange={e => setBusinessProfile({...businessProfile, location: e.target.value})}
                    placeholder="Dirección o ubicación"
                    className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sitios y redes</label>
                  {[
                    { k: 'website', ph: 'Sitio web (https://…)' },
                    { k: 'facebook', ph: 'Facebook (usuario o link)' },
                    { k: 'tiktok', ph: 'TikTok (usuario)' },
                    { k: 'linkedin', ph: 'LinkedIn (usuario o link)' },
                  ].map(({ k, ph }) => (
                    <input
                      key={k}
                      type="text"
                      value={(businessProfile as any)[k] || ''}
                      onChange={e => setBusinessProfile({ ...businessProfile, [k]: e.target.value })}
                      placeholder={ph}
                      className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none text-sm"
                    />
                  ))}
                </div>

                <button
                  onClick={async () => {
                    let owner = currentUser;
                    if (isFirebaseEnabled && !owner) {
                      owner = await ensureAnonSession();
                      if (owner) setCurrentUser(owner);
                    }
                    if (owner) {
                      await saveBusinessProfile(owner.uid, businessProfile).catch(() => {});
                    }
                    setHasBusiness(true);
                    setShowEditBusinessProfile(false);
                  }}
                  className="w-full py-4 bg-iogga-accent text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
                >
                  Guardar Cambios
                </button>
              </div>
            </Modal>
          )}

          {selectedPlanForDetails && (
            <Modal onClose={() => setSelectedPlanForDetails(null)} title="Detalles del Plan">
              <div className="space-y-6">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={selectedPlanForDetails.image || `https://picsum.photos/seed/${selectedPlanForDetails.id}/800/400`} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 flex items-center justify-between right-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="cursor-pointer hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserProfile(selectedPlanForDetails);
                        }}
                      >
                        <img src={selectedPlanForDetails.userAvatar} className="w-10 h-10 rounded-full border-2 border-white/30" referrerPolicy="no-referrer" />
                      </div>
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserProfile(selectedPlanForDetails);
                        }}
                      >
                        <span className="text-sm font-bold text-white block">{selectedPlanForDetails.userName}</span>
                        <span className="text-[10px] text-white/60 uppercase tracking-widest">Anfitrión</span>
                      </div>
                    </div>
                    {isMyPlan(selectedPlanForDetails) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanForDetails(null);
                          handleEditPlan(selectedPlanForDetails);
                        }}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors border border-white/20 text-white shadow-lg"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                  <p className="text-lg font-black text-white leading-relaxed italic">
                    "{isMyPlan(selectedPlanForDetails) ? buildInviteMessage(selectedPlanForDetails) : getPlanDescription(selectedPlanForDetails)}"
                  </p>

                  {isMyPlan(selectedPlanForDetails) && (
                    <div className="space-y-2">
                      <button
                        onClick={() => openInvite(selectedPlanForDetails)}
                        className="w-full py-4 bg-iogga-primary text-white rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-iogga-primary/20 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} />
                        Agregar personas
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const p = selectedPlanForDetails;
                            setSelectedPlanForDetails(null);
                            handleEditPlan(p);
                          }}
                          className="py-3.5 bg-white/5 border border-white/10 text-white rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit3 size={15} /> Editar
                        </button>
                        <button
                          onClick={() => {
                            handleDeletePlan(selectedPlanForDetails.id);
                            setSelectedPlanForDetails(null);
                          }}
                          className="py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={15} /> Cancelar plan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quiénes se unieron: visible con cuenta; borroso si publicaste sin registrarte */}
                  {isMyPlan(selectedPlanForDetails) && (selectedPlanForDetails.acceptedBy?.length || 0) > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Se unieron ({selectedPlanForDetails.acceptedBy!.length})
                      </p>
                      {currentUser?.isAnonymous ? (
                        <button
                          onClick={() => {
                            setSelectedPlanForDetails(null);
                            setIsRegistering(true);
                            setShowLoginModal(true);
                          }}
                          className="w-full p-4 rounded-2xl bg-iogga-primary/10 border border-iogga-primary/30 flex items-center gap-3 text-left"
                        >
                          <div className="flex -space-x-2">
                            {selectedPlanForDetails.acceptedBy!.slice(0, 3).map((a, i) => (
                              <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-950 blur-[3px]" />
                            ))}
                          </div>
                          <p className="text-xs text-zinc-300 font-medium flex-1">
                            <span className="blur-[5px] select-none">{selectedPlanForDetails.acceptedBy![0].name}</span> y más se unieron — <span className="text-iogga-primary font-black">crea tu cuenta gratis para verlos</span>
                          </p>
                        </button>
                      ) : (
                        <>
                          <p className="text-[11px] text-zinc-500 -mt-1">Selecciona a quién aceptas. Solo a ellos les llegará el aviso.</p>
                          <div className="space-y-2">
                            {selectedPlanForDetails.acceptedBy!.map((a, i) => {
                              const sel = confirmSel.includes(a.uid);
                              return (
                                <div key={i} className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-colors ${sel ? 'bg-iogga-primary/15 border-iogga-primary/40' : 'bg-white/5 border-white/5'}`}>
                                  <button
                                    onClick={() => setConfirmSel(prev => sel ? prev.filter(x => x !== a.uid) : [...prev, a.uid])}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${sel ? 'bg-iogga-primary text-white' : 'border-2 border-white/25'}`}
                                  >
                                    {sel && <Check size={16} />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedUserProfile({
                                        id: 'joined-' + a.uid, userName: a.name,
                                        userAvatar: a.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=6366f1&color=fff`,
                                        activity: `Se unió a "${selectedPlanForDetails.activity}"`,
                                      } as any);
                                      setSelectedPlanForDetails(null);
                                    }}
                                    className="flex items-center gap-3 flex-1 text-left"
                                  >
                                    {a.photo ? <img src={a.photo} className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-9 h-9 rounded-full bg-iogga-primary/20 text-iogga-primary flex items-center justify-center text-xs font-black">{a.name.charAt(0).toUpperCase()}</div>}
                                    <span className="text-sm font-bold text-white">{a.name}</span>
                                    <ChevronRight size={15} className="text-zinc-500 ml-auto" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => {
                              const plan = selectedPlanForDetails;
                              // Avisar solo a los NUEVOS aceptados (no a los que ya lo estaban)
                              const already = plan.confirmedUids || [];
                              confirmSel.filter(uid => !already.includes(uid)).forEach(uid => sendNotification({ type:'accepted', to: uid, fromName: plan.userName, title: `${plan.userName.split(' ')[0]} te aceptó en su plan`, message: `¡Estás dentro! ${buildInviteMessage(plan)}`, planId: plan.id }));
                              // Guardar la selección para que quede con palomita al volver
                              const updated = { ...plan, confirmedUids: confirmSel };
                              void saveDocIn('plans', plan.id, updated);
                              setPlans(prev => prev.map(p => p.id === plan.id ? updated : p));
                              setSelectedPlanForDetails(updated);
                              setSelectedPlanForDetails(null);
                              // Ofrecer cerrar o dejar abierto
                              setPendingClose(updated);
                            }}
                            disabled={confirmSel.length === 0}
                            className="w-full py-4 bg-iogga-primary text-white rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Aceptar seleccionados {confirmSel.length > 0 ? `(${confirmSel.length})` : ''}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {renderPlanTechnicalDetails(selectedPlanForDetails)}

                  {selectedPlanForDetails.transportNote && (
                    <div className="p-4 rounded-2xl bg-iogga-primary/5 border border-iogga-primary/10 italic text-sm text-zinc-400">
                      "{selectedPlanForDetails.transportNote}"
                    </div>
                  )}
                </div>

                {isMyPlan(selectedPlanForDetails) ? (
                  // Es TU plan: no puedes unirte al tuyo; muestra acciones útiles.
                  <div className="flex gap-4">
                    <button
                      onClick={() => { const p = selectedPlanForDetails; setSelectedPlanForDetails(null); handleEditPlan(p); }}
                      className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Edit3 size={16} /> Editar
                    </button>
                    <button
                      onClick={() => { const p = selectedPlanForDetails; setSelectedPlanForDetails(null); openInvite(p); }}
                      className="flex-[2] py-4 rounded-2xl bg-green-500 text-white font-black shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <UserPlus size={16} /> Invitar personas
                    </button>
                  </div>
                ) : (
                  acceptedPlanIds.includes(selectedPlanForDetails.id) ? (
                    // Ya te uniste: confirmación clara (palomita morada) y salir.
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedPlanForDetails(null)}
                        className="w-full py-4 rounded-2xl bg-iogga-primary/15 text-iogga-primary border border-iogga-primary/40 font-black flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        <CheckCircle2 size={16} /> Ya estás unido
                      </button>
                    </div>
                  ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        handleIgnorePlan(selectedPlanForDetails.id);
                        setSelectedPlanForDetails(null);
                      }}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 transition-all text-xs uppercase"
                    >
                      Ignorar
                    </button>
                    <button
                      onClick={() => handleAcceptPlan(selectedPlanForDetails.id)}
                      className="flex-[2] py-4 rounded-2xl bg-iogga-primary text-white font-black shadow-lg shadow-iogga-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <CheckCircle2 size={16} /> Unirme al plan
                    </button>
                  </div>
                  )
                )}
              </div>
            </Modal>
          )}

          {selectedPromo && (
            <Modal onClose={() => setSelectedPromo(null)} title="Tu Invitación Especial">
              <div className="space-y-6">
                {/* Main Offer Card */}
                <div className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                  <img src={selectedPromo.image} className="w-full h-56 object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-iogga-accent text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        Oferta Exclusiva
                      </span>
                      {selectedPromo.price && (
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/10">
                          {selectedPromo.price}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white leading-tight">{selectedPromo.title}</h3>
                      <p className="text-zinc-300 text-sm line-clamp-2">{selectedPromo.description}</p>
                    </div>
                  </div>
                </div>

                {/* Business Profile & Info */}
                <div className="bg-white/5 rounded-[32px] p-5 border border-white/10 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={selectedPromo.businessLogo} className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" referrerPolicy="no-referrer" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-iogga-accent rounded-full border-2 border-zinc-900 flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white leading-none mb-1">{selectedPromo.businessName}</h4>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-bold">{(selectedPromo.businessStats?.rating ?? 4.8).toFixed(1)}</span>
                          </div>
                          <span className="text-zinc-500 text-xs">•</span>
                          <span className="text-zinc-400 text-xs font-medium">{selectedPromo.businessStats?.followers || '1.2k'} seguidores</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedBusinessProfile(selectedPromo)}
                      className="p-3 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-colors border border-white/5"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>

                  {/* Tags & Social Proof */}
                  <div className="flex flex-wrap gap-2">
                    {selectedPromo.tags.map(tag => (
                      <span key={tag} className="text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/10 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                    <div className="flex items-center gap-1.5 bg-iogga-accent/10 px-2 py-1 rounded-full border border-iogga-accent/20">
                      <Check size={10} className="text-iogga-accent" />
                      <span className="text-[8px] font-black text-iogga-accent uppercase tracking-widest">
                        {selectedPromo.salesCount}+ canjeados hoy
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="p-2 bg-iogga-primary/10 rounded-xl">
                        <MapPin size={16} className="text-iogga-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Ubicación</span>
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{selectedPromo.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="p-2 bg-iogga-accent/10 rounded-xl">
                        <Navigation size={16} className="text-iogga-accent" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Distancia</span>
                        <span className="text-xs font-bold text-white">0.8 km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones: obtener la promo genera el QR real (descargable) */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {expandedPlanId && (
                    <button
                      onClick={() => {
                        setUserSelectedOfferIds({ ...userSelectedOfferIds, [expandedPlanId]: selectedPromo.id });
                        setSelectedPromo(null);
                      }}
                      className={`w-full py-5 rounded-[24px] font-black text-lg transition-all active:scale-95 shadow-2xl ${userSelectedOfferIds[expandedPlanId] === selectedPromo.id ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-iogga-accent text-white shadow-iogga-accent/30'}`}
                    >
                      {userSelectedOfferIds[expandedPlanId] === selectedPromo.id ? 'Promo Seleccionada' : 'Seleccionar Promo'}
                    </button>
                  )}
                  <button
                    onClick={() => ensureLoggedIn(() => setRedeemPromo(selectedPromo))}
                    className="w-full py-5 bg-iogga-accent text-white rounded-[24px] font-black text-base uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-iogga-accent/30"
                  >
                    <QrCode size={20} />
                    Obtener promoción
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center">Generas tu código QR y lo puedes descargar para presentarlo en el local.</p>
                </div>
              </div>
            </Modal>
          )}

          {showSettingsMenu && (
            <Modal onClose={() => setShowSettingsMenu(false)} title="Configuración">
              <div className="space-y-6">
                {/* Interruptor de modo estilo Uber/DiDi: siempre a la mano */}
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    toggleMode(mode === 'person' ? 'business' : 'person');
                  }}
                  className={`w-full p-5 rounded-3xl flex items-center justify-between transition-all active:scale-[0.98] ${mode === 'person' ? 'bg-iogga-accent text-white shadow-xl shadow-iogga-accent/20' : 'bg-iogga-primary text-white shadow-xl shadow-iogga-primary/20'}`}
                >
                  <div className="flex items-center gap-3">
                    {mode === 'person' ? <Store size={22} /> : <User size={22} />}
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-wide">{mode === 'person' ? 'Cambiar a Negocio' : 'Cambiar a Personal'}</p>
                      <p className="text-[10px] opacity-80">{mode === 'person' ? 'Publica ofertas y valida canjes QR' : 'Vuelve a tus planes personales'}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} />
                </button>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Cuenta y Seguridad</p>
                  <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                    <SettingsItem
                      icon={<User size={18} />}
                      label="Editar Perfil"
                      tone="personal"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowEditProfile(true);
                      }}
                    />
                    <SettingsItem icon={<Download size={18} />} label="Instalar la app en tu celular" onClick={() => { setShowSettingsMenu(false); setShowInstall(true); }} />
                    <SettingsItem icon={<Shield size={18} />} label="Aviso de Privacidad" onClick={() => { setShowSettingsMenu(false); setShowLegal('privacy'); }} />
                    <SettingsItem icon={<CheckCircle2 size={18} />} label="Términos y Condiciones" onClick={() => { setShowSettingsMenu(false); setShowLegal('terms'); }} />
                    <SettingsItem icon={<Bell size={18} />} label="Notificaciones" />
                    <SettingsItem icon={<Smartphone size={18} />} label="Dispositivos" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Pagos y Negocio</p>
                  <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                    <SettingsItem 
                      icon={<CreditCard size={18} />} 
                      label="Métodos de Pago" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        triggerBeta("Métodos de Pago", "La pasarela de pago segura de iogga en Chihuahua se encuentra en ambiente sandbox de prueba para este MVP. Pronto estará disponible en producción.");
                      }} 
                    />
                    <SettingsItem 
                      icon={<Wallet size={18} />} 
                      label="Billetera iogga" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        triggerBeta("Billetera iogga", "La Billetera Inteligente iogga está vinculada a tu cuenta de demostración. Saldos y comisiones reales de negocio se habilitarán en la versión final de lanzamiento.");
                      }}
                    />
                    <SettingsItem
                      icon={<Store size={18} />}
                      label="Editar Perfil de Negocio"
                      tone="business"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowEditBusinessProfile(true);
                      }}
                    />
                    <SettingsItem 
                      icon={<TrendingUp size={18} />} 
                      label="Suscripción Premium" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        triggerBeta("Suscripción Premium", "La suscripción iogga Business Premium te dará visibilidad X10 y estadísticas predictivas por IA. Tu suscripción de MVP ya está pre-activada gratis para pruebas.");
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">General</p>
                  <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                    <SettingsItem 
                      icon={<Globe size={18} />} 
                      label="Idioma y Región" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        triggerBeta("Idioma y Región", "Iogga está configurada por defecto en Español (México) para la región Chihuahua Centro. Soporte multi-idioma se agregará próximamente.");
                      }}
                    />
                    <SettingsItem 
                      icon={<HelpCircle size={18} />} 
                      label="Centro de Ayuda" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        triggerBeta("Centro de Ayuda", "Contacta a admin@iogga.com si requieres asistencia técnica adicional durante tus pruebas de MVP.");
                      }}
                    />
                    <SettingsItem 
                      icon={<PackagePlus size={18} />} 
                      label="Novedades" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        triggerBeta("Novedades de la Versión", "¡Bienvenido a iogga v2.4 (Chihuahua MVP)! Hemos agregado el motor inteligente Spark Matcher de coincidencia en tiempo real entre planes y negocios.");
                      }}
                    />
                  </div>
                </div>

                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      logoutUser();
                      // Limpiar TODA la sesión para que no quede rastro del usuario.
                      setIsLoggedIn(false);
                      setCurrentUser(null);
                      setUserProfile({});
                      setBusinessProfile({ name: '', bio: '', logo: '', cover: '', location: '', phone: '', email: '', website: '', instagram: '', facebook: '', tiktok: '', linkedin: '' });
                      setHasBusiness(false);
                      setMode('person');
                      setFollowing([]);
                      setFollowers([]);
                      setAcceptedPlanIds([]);
                      setShowSettingsMenu(false);
                      setActiveTab('home');
                      setIsIntro(true);
                      try { localStorage.removeItem('iogga_visits'); } catch {}
                    }}
                    className="w-full p-5 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center gap-2 font-bold border border-red-500/20 active:scale-95 transition-transform"
                  >
                    <LogOut size={20} />
                    Cerrar Sesión
                  </button>
                ) : (
                  /* Sin sesión: aquí va el acceso, no "cerrar sesión" */
                  <button
                    onClick={() => { setShowSettingsMenu(false); setShowLoginModal(true); }}
                    className="w-full p-5 rounded-3xl bg-iogga-primary text-white flex items-center justify-center gap-2 font-black border border-white/10 shadow-lg shadow-iogga-primary/20 active:scale-95 transition-transform"
                  >
                    <User size={20} />
                    Iniciar sesión o registrarte
                  </button>
                )}
                
                <p className="text-center text-[10px] text-zinc-600 font-medium">iogga v2.4.0 • Hecho con amor en Chihuahua</p>
              </div>
            </Modal>
          )}

          {selectedUserProfile && (
            <UserProfileModal
              user={selectedUserProfile}
              onClose={() => setSelectedUserProfile(null)}
              onComingSoon={comingSoon}
            />
          )}

          {selectedBusinessProfile && (
            <BusinessProfileModal
              business={selectedBusinessProfile}
              offers={promos.filter(p => p.businessName === selectedBusinessProfile.businessName)}
              onOpenOffer={(p) => { setSelectedBusinessProfile(null); setSelectedPromo(p); }}
              waLink={waLink}
              onClose={() => setSelectedBusinessProfile(null)}
              appMode={mode}
              onComingSoon={comingSoon}
              onStartBusinessFlow={() => {
                setMode('business');
                setActiveTab('active');
                setShowCreatePromo(true);
              }}
            />
          )}

          {/* Coincidence / Match Celebration Modal for Users */}
          {showMatchCelebration && lastPublishedPlan && (
            <Modal onClose={() => { setPendingFriendIds([]); setShowMatchCelebration(false); setActiveTab('active'); }} title="Revisa y publica">
              <div className="space-y-6">

                {/* ── CAJA IOGGA: vista previa + invitados + botón, TODO adentro ── */}
                <div className="rounded-[28px] border border-iogga-primary/25 bg-iogga-primary/5 overflow-hidden">
                  <div className="px-4 py-3 bg-iogga-primary/15 flex items-center gap-2">
                    <Sparkles size={16} className="text-iogga-primary" />
                    <p className="text-base font-black text-white tracking-tight">Así se verá en iogga</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* El corazón: la invitación escrita, antes de todo */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[15px] text-white leading-relaxed whitespace-pre-line">{buildInviteMessage(lastPublishedPlan)}</p>
                    </div>
                    {/* La tarjeta tal cual la verán */}
                    <div className="rounded-[28px] overflow-hidden pointer-events-none select-none">
                      <PlanCard plan={lastPublishedPlan} />
                    </div>

                    {/* Invitados de iogga (dentro de la misma caja) */}
                    <p className="text-xs font-black text-iogga-primary uppercase tracking-widest">Enviar a amigos de iogga</p>
                    {!isLoggedIn ? (
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-400 leading-relaxed">Inicia sesión para ver si conoces gente dentro de iogga y enviarles tu plan al instante.</p>
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="w-full py-4 bg-iogga-primary text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-iogga-primary/20"
                        >
                          Iniciar sesión
                        </button>
                      </div>
                    ) : (
                      <>
                        {following.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {(invitePreviewMore ? following : following.slice(0, 5)).map(f => {
                                const sel = pendingFriendIds.includes(f.uid);
                                return (
                                  <button
                                    key={f.uid}
                                    onClick={() => setPendingFriendIds(prev => sel ? prev.filter(id => id !== f.uid) : [...prev, f.uid])}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${sel ? 'bg-iogga-primary/15 border-iogga-primary/40' : 'bg-white/5 border-white/10'}`}
                                  >
                                    {f.photo ? <img src={f.photo} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white">{f.name.charAt(0).toUpperCase()}</div>}
                                    <span className="text-sm text-white flex-1 text-left">{f.name}</span>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${sel ? 'bg-iogga-primary text-white' : 'border-2 border-white/20'}`}>
                                      {sel && <Check size={14} />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {/* Ver más + botón de agregar más (estilo etiquetar en IG) */}
                            <div className="flex items-center justify-between">
                              {following.length > 5 ? (
                                <button onClick={() => setInvitePreviewMore(v => !v)} className="text-[11px] font-black text-iogga-primary">
                                  {invitePreviewMore ? 'Ver menos' : `Ver más (${following.length - 5})`}
                                </button>
                              ) : <span />}
                              <button onClick={() => setShowFriends('following')} className="flex items-center gap-1.5 text-[11px] font-black text-iogga-primary bg-iogga-primary/10 px-3 py-1.5 rounded-full border border-iogga-primary/25 active:scale-95">
                                <UserPlus size={13} /> Agregar más
                              </button>
                            </div>
                          </>
                        ) : (
                          <button onClick={() => setShowFriends('following')} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-iogga-primary/10 border border-dashed border-iogga-primary/30 text-iogga-primary text-xs font-black uppercase tracking-widest active:scale-95">
                            <UserPlus size={15} /> Agregar amigos
                          </button>
                        )}
                        <button
                          onClick={() => {
                            notifyPendingFriends(lastPublishedPlan);
                            setIoggaSent(true);
                          }}
                          disabled={pendingFriendIds.length === 0 || ioggaSent}
                          className={`w-full py-4 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${ioggaSent ? 'bg-green-500/20 text-green-300 border border-green-400/30' : pendingFriendIds.length === 0 ? 'bg-white/5 text-zinc-600 border border-white/10' : 'bg-iogga-primary text-white shadow-lg shadow-iogga-primary/20 active:scale-95'}`}
                        >
                          {ioggaSent ? <><Check size={18} /> Enviado</> : <><Send size={18} /> Enviar en iogga {pendingFriendIds.length > 0 ? `(${pendingFriendIds.length})` : ''}</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── CAJA WHATSAPP: vista previa + botón, TODO adentro ── */}
                <div className="rounded-[28px] border border-green-500/25 bg-green-500/5 overflow-hidden">
                  <div className="px-4 py-3 bg-green-500/15 flex items-center gap-2">
                    <MessageSquare size={16} className="text-green-400" />
                    <p className="text-base font-black text-white tracking-tight">Así se verá en WhatsApp</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="rounded-2xl bg-[#0b141a] p-3">
                      <div className="max-w-[88%] ml-auto bg-[#005c4b] rounded-2xl rounded-tr-md px-3 py-2 shadow">
                        <p className="text-[13px] text-white whitespace-pre-line leading-snug">{inviteText(lastPublishedPlan)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sharePlanWhatsApp(lastPublishedPlan)}
                      className="w-full py-4 bg-green-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Invitar por WhatsApp
                    </button>
                  </div>
                </div>

                {/* ── CAJA ESTADO: imagen 9:16 para WhatsApp/Instagram + botón adentro ── */}
                <div className="rounded-[28px] border border-fuchsia-500/25 bg-fuchsia-500/5 overflow-hidden">
                  <div className="px-4 py-3 bg-fuchsia-500/15 flex items-center gap-2">
                    <Camera size={16} className="text-fuchsia-400" />
                    <p className="text-base font-black text-white tracking-tight">Así se verá en tu estado</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {statusImg ? (
                      <img src={statusImg} className="w-40 mx-auto rounded-2xl border border-white/10 shadow-2xl" alt="Estado iogga" />
                    ) : (
                      <div className="w-40 h-72 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 text-xs">Generando…</div>
                    )}
                    <p className="text-[11px] text-zinc-400 text-center leading-snug">Súbela a tu estado de WhatsApp o Instagram: lleva tu plan, el logo y el link de iogga.</p>
                    <button
                      onClick={() => { if (statusImg) void shareStatusImage(statusImg, `${window.location.origin}/?inv=${lastPublishedPlan.id}`); }}
                      disabled={!statusImg}
                      className="w-full py-4 bg-fuchsia-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-fuchsia-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Camera size={18} />
                      Compartir en tu estado
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setPendingFriendIds([]); setShowMatchCelebration(false); setActiveTab('active'); maybeOfferInstall(); }}
                  className="w-full py-3 text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  {ioggaSent ? 'Listo — ver mis planes' : 'Ver mis planes'}
                </button>
              </div>
            </Modal>
          )}

          {/* Business Matches / Customer demands list explorer */}
          {selectedPromoForMatches && (
            <Modal onClose={() => setSelectedPromoForMatches(null)} title="Demandas Coincidentes">
              <div className="space-y-6">
                <div className="p-5 rounded-[32px] bg-white/5 border border-white/10 flex gap-4 items-center">
                  <img src={selectedPromoForMatches.image} className="w-16 h-16 rounded-2xl object-cover" />
                  <div>
                    <h3 className="font-black text-sm text-white uppercase tracking-tight">{selectedPromoForMatches.title}</h3>
                    <p className="text-xs text-iogga-accent font-bold mt-1 font-sans">{selectedPromoForMatches.offer}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Users size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-sans">Usuarios Buscando hoy ({getMatchingPlansForPromo(selectedPromoForMatches).length})</span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {getMatchingPlansForPromo(selectedPromoForMatches).map(mPlan => {
                      const idSeed = `${mPlan.id}-${selectedPromoForMatches.id}`;
                      const alreadyNotified = acceptedPlanIds.includes(idSeed);
                      return (
                        <div key={mPlan.id} className="p-4 rounded-[28px] bg-white/5 border border-white/10 flex flex-col gap-3 justify-between">
                          <div className="flex gap-3 items-center">
                            <img src={mPlan.userAvatar} className="w-10 h-10 rounded-xl object-cover" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs text-white block">{mPlan.userName}</span>
                              <p className="text-[10px] text-zinc-400 truncate font-semibold italic mt-0.5">"Planea: {mPlan.activity}"</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-sans">Medio: Cupón por Match</span>
                            <button
                              disabled={alreadyNotified}
                              onClick={() => {
                                setAcceptedPlanIds([...acceptedPlanIds, idSeed]);
                                // Put a customized invitation for this user
                                const newInv: Plan = {
                                  id: Math.random().toString(),
                                  userName: selectedPromoForMatches.businessName || 'La Cabalita',
                                  userAvatar: selectedPromoForMatches.businessLogo || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80',
                                  activity: `¡Te regalamos un cupón especial: ${selectedPromoForMatches.offer} para probar ${selectedPromoForMatches.title}!`,
                                  startTime: mPlan.startTime,
                                  endTime: mPlan.endTime,
                                  location: selectedPromoForMatches.location,
                                  acceptedCount: 1,
                                  timestamp: Date.now(),
                                  isPublic: false,
                                  image: selectedPromoForMatches.image,
                                  tags: [],
                                  budget: 'no-money',
                                  transport: 'each-arrives',
                                  guests: 'public'
                                };
                                setPlans([newInv, ...plans]);
                              }}
                              className={`px-4 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all min-h-[32px] ${alreadyNotified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-iogga-accent text-zinc-950 font-black hover:scale-105 active:scale-95'}`}
                            >
                              {alreadyNotified ? '¡Cupón Enviado!' : 'Ofrecer Cupón'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {getMatchingPlansForPromo(selectedPromoForMatches).length === 0 && (
                      <div className="p-8 rounded-[28px] bg-white/5 border border-dashed border-white/10 text-center">
                        <p className="text-xs text-zinc-500 italic font-sans animate-pulse">Buscando usuarios planificando actividades similares hoy en Chihuahua...</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPromoForMatches(null)}
                  className="w-full py-4 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 min-h-[44px]"
                >
                  Volver a Mis Ofertas
                </button>
              </div>
            </Modal>
          )}

          {/* Beta Notice Modal */}
          {showBetaModal && (
            <Modal onClose={() => setShowBetaModal(false)} title={betaMessage.title || "Módulo Beta"}>
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full mx-auto flex items-center justify-center border border-amber-500/20">
                  <Sparkles size={28} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-md font-black text-white uppercase tracking-tight">{betaMessage.title || 'Módulo en Beta'}</h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans">
                    {betaMessage.desc || "Esta función se encuentra en beta para la validación de iogga. El servicio en vivo se activará pronto."}
                  </p>
                </div>

                {suggestionSent ? (
                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> ¡Gracias! Recibimos tu idea 💜
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <textarea
                      value={suggestionText}
                      onChange={e => setSuggestionText(e.target.value)}
                      placeholder="Envía tus ideas o sugerencias…"
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 outline-none focus:ring-2 focus:ring-iogga-primary h-24 resize-none"
                    />
                    <button
                      onClick={async () => {
                        if (!suggestionText.trim()) { setShowBetaModal(false); return; }
                        let u = currentUser;
                        if (isFirebaseEnabled && !u) u = await ensureAnonSession();
                        const ok = await saveFeedback(suggestionText.trim(), betaMessage.title || 'general', u);
                        if (ok) { setSuggestionSent(true); setSuggestionText(''); }
                        else { setShowBetaModal(false); }
                      }}
                      className="w-full py-4 bg-iogga-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Enviar sugerencia
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowBetaModal(false)}
                  className="w-full py-3 text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </Modal>
          )}

          {/* Simple Login & Signup Modal */}
          {showLoginModal && (
            <Modal onClose={() => setShowLoginModal(false)} title={isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}>
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-4 rounded-full bg-iogga-primary/10 text-iogga-primary border border-iogga-primary/20 mb-2">
                    <User size={28} />
                  </div>
                  <h3 className="font-lexend font-black text-xl text-white tracking-tight uppercase">
                    {isRegistering ? "Regístrate en iogga" : "Bienvenido de vuelta"}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans">
                    {isRegistering ? "Únete a la comunidad de planes espejo en Chihuahua." : "Inicia sesión para crear planes, guardar coincidencias y conectar."}
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthError('');

                  // Sin Firebase configurado: modo demo (entra cualquiera)
                  if (!isFirebaseEnabled) {
                    setIsLoggedIn(true);
                    setShowLoginModal(false);
                    triggerBeta("¡Sesión Iniciada! (Modo Demo)", "Estás en modo demo: aún no hay base de datos conectada, nada se guarda de forma permanente.");
                    if (loginActionToResume) {
                      loginActionToResume();
                      setLoginActionToResume(null);
                    }
                    return;
                  }

                  setAuthBusy(true);
                  try {
                    const user = isRegistering
                      ? await registerUser(registerName.trim() || loginEmail.split('@')[0], loginEmail.trim(), loginPassword)
                      : await loginUser(loginEmail.trim(), loginPassword);
                    setCurrentUser(user);
                    setIsLoggedIn(true);
                    setShowLoginModal(false);
                    setLoginPassword('');
                    triggerBeta(
                      isRegistering ? "¡Cuenta Creada!" : "¡Sesión Iniciada!",
                      `Bienvenido${user.name ? `, ${user.name}` : ''} a iogga Chihuahua.`
                    );
                    if (loginActionToResume) {
                      loginActionToResume();
                      setLoginActionToResume(null);
                    }
                  } catch (err) {
                    setAuthError(authErrorMessage(err));
                  } finally {
                    setAuthBusy(false);
                  }
                }} className="space-y-4">
                  {isRegistering && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-sans">Tu Nombre</label>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        required
                        placeholder="¿Cómo te llamas?"
                        value={registerName}
                        onChange={e => setRegisterName(e.target.value)}
                        className="w-full h-14 px-5 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-sans">Correo Electrónico</label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="tu@correo.com"
                      value={loginEmail || ''}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full h-14 px-5 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-sans">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete={isRegistering ? 'new-password' : 'current-password'}
                        required
                        placeholder="••••••••"
                        value={loginPassword || ''}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full h-14 pl-5 pr-14 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <p className="text-xs font-bold text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-2xl py-3 px-4">
                      {authError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={authBusy}
                    className="w-full py-4 bg-iogga-primary text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-iogga-primary/20 active:scale-95 transition-all min-h-[48px] mt-2 disabled:opacity-50"
                  >
                    {authBusy ? "Un momento…" : isRegistering ? "Crear mi Cuenta" : "Entrar ahora"}
                  </button>

                  {/* Registrarse SIEMPRE visible y destacado (para quien aún no tiene cuenta) */}
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={() => { setAuthError(''); setIsRegistering(true); }}
                      className="w-full py-4 bg-violet-500/15 text-violet-300 border border-violet-400/40 rounded-[20px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Regístrate ahora — es gratis
                    </button>
                  )}

                  {/* Recuperar contraseña (solo al iniciar sesión) */}
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!loginEmail.trim()) { setAuthError('Escribe tu correo arriba y toca de nuevo para enviarte el enlace.'); return; }
                        if (!isFirebaseEnabled) { triggerBeta('Modo demo', 'La recuperación de contraseña funciona con la base de datos conectada.'); return; }
                        try {
                          await resetPassword(loginEmail.trim());
                          triggerBeta('Revisa tu correo', `Te enviamos un enlace a ${loginEmail.trim()} para restablecer tu contraseña.`);
                        } catch (err) {
                          setAuthError(authErrorMessage(err));
                        }
                      }}
                      className="w-full text-center text-xs font-bold text-zinc-400 hover:text-white transition-all"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}

                  {/* Salida visible: que nadie sienta que tiene que registrarse para entrar */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setShowLoginModal(false);
                      if (loginActionToResume) { loginActionToResume(); setLoginActionToResume(null); }
                    }}
                    className="w-full text-center text-xs font-bold text-zinc-400 hover:text-white underline underline-offset-4 transition-all"
                  >
                    Continuar sin iniciar sesión
                  </button>
                </form>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs font-bold text-iogga-primary hover:underline transition-all block text-center bg-transparent border-none outline-none cursor-pointer"
                  >
                    {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : ""}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest font-sans">o</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {isFirebaseEnabled && (
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={async () => {
                        setAuthError('');
                        setAuthBusy(true);
                        try {
                          const user = await loginWithGoogle();
                          setCurrentUser(user);
                          setIsLoggedIn(true);
                          setShowLoginModal(false);
                          triggerBeta("¡Sesión Iniciada!", `Bienvenido${user.name ? `, ${user.name}` : ''} a iogga Chihuahua.`);
                          if (loginActionToResume) {
                            loginActionToResume();
                            setLoginActionToResume(null);
                          }
                        } catch (err) {
                          const code = (err as { code?: string })?.code || '';
                          if (!code.includes('popup-closed') && !code.includes('cancelled')) {
                            setAuthError(authErrorMessage(err));
                          }
                        } finally {
                          setAuthBusy(false);
                        }
                      }}
                      className="w-full py-4 bg-white text-zinc-900 rounded-[20px] font-black text-sm tracking-wide active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 40.4 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                      Continuar con Google
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setShowLoginModal(false);
                      if (loginActionToResume) {
                        loginActionToResume();
                        setLoginActionToResume(null);
                      }
                    }}
                    className="w-full py-4 bg-white/5 border border-white/10 text-zinc-400 hover:text-white rounded-[20px] font-bold text-xs uppercase tracking-widest active:scale-95 transition-all min-h-[44px]"
                  >
                    Continuar sin Iniciar Sesión (Saltar)
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* QR real: canje del cliente y validación del negocio */}
        {redeemPromo && (
          <RedeemQRModal
            promo={{ id: redeemPromo.id, title: redeemPromo.title, businessName: redeemPromo.businessName, uid: redeemPromo.uid || null, price: redeemPromo.price }}
            user={currentUser}
            onClose={() => setRedeemPromo(null)}
          />
        )}
        {showValidateModal && <ValidateCodeModal validatorUid={currentUser?.uid || null} onClose={() => setShowValidateModal(false)} />}

        {/* Invitación recibida por link compartido (iogga.com/?inv=ID) */}
        {invitationPlan && (
          <div className="fixed inset-0 z-[320] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="relative w-full sm:max-w-md bg-zinc-950 border border-iogga-primary/30 rounded-t-[32px] sm:rounded-[32px] overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {invitationPlan.image && (
                <div className="h-44 w-full relative">
                  <img src={invitationPlan.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                </div>
              )}
              <div className="p-6 pb-10 space-y-5 -mt-6 relative">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <img src={invitationPlan.userAvatar} className="w-16 h-16 rounded-full border-4 border-iogga-primary shadow-xl object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-white mt-1">Intención compartida ✨</h3>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed px-2">
                    {buildInviteMessage(invitationPlan)}
                  </p>
                  <p className="text-xs font-bold text-iogga-primary/90 leading-relaxed px-4">
                    Deja el scroll. Vive la sorpresa. Los mejores recuerdos empiezan con un "me apunto". ✨
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  {invitationPlan.whatsapp ? (
                    <a
                      href={waLink(invitationPlan.whatsapp, `¡Hola ${invitationPlan.userName}! Vi tu invitación a "${invitationPlan.activity}" en iogga y ¡me apunto! 🙌`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        handleAcceptPlan(invitationPlan.id);
                        setInvitationPlan(null);
                        maybeOfferInstall();
                      }}
                      className="w-full py-5 bg-green-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest text-center active:scale-95 transition-all shadow-xl shadow-green-500/20"
                    >
                      ✓ Me apunto — Avisar por WhatsApp
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        handleAcceptPlan(invitationPlan.id);
                        setInvitationPlan(null);
                        maybeOfferInstall();
                      }}
                      className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-iogga-primary/20"
                    >
                      ✓ Me apunto
                    </button>
                  )}
                  <button
                    onClick={() => setInvitationPlan(null)}
                    className="w-full py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-[20px] font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Solo explorar iogga
                  </button>
                </div>

                <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  🔒 Al aceptar solo se comparte tu nombre — nada más. iogga es web:
                  no se descarga, no ocupa espacio y tus datos están protegidos. ✨
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Popup de instalación: 1 clic (Android) o guía de 2 pasos (iPhone) */}
        {showInstall && !isStandalone && (
          <div className="fixed inset-0 z-[340] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInstall(false)} />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full sm:max-w-md bg-zinc-950 border border-iogga-primary/30 rounded-t-[32px] sm:rounded-[32px] p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-5 text-center"
            >
              <div className="flex justify-center">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-iogga-primary/30 to-iogga-accent/20 border border-iogga-primary/30">
                  <Smartphone size={32} className="text-iogga-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-2xl text-white">Instala iogga en tu pantalla</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-[300px] mx-auto">
                  Gratis · no ocupa espacio · sin tiendas de apps. Queda con su ícono, como cualquier app.
                </p>
              </div>

              {installEvent ? (
                // Android/Chrome: instalación real en un toque
                <button
                  onClick={async () => {
                    installEvent.prompt();
                    await installEvent.userChoice.catch(() => {});
                    setInstallEvent(null);
                    setShowInstall(false);
                  }}
                  className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-base active:scale-95 transition-all shadow-xl shadow-iogga-primary/30 flex items-center justify-center gap-2"
                >
                  <Download size={22} /> Instalar ahora
                </button>
              ) : isIOS ? (
                // iPhone (Safari): Apple no permite instalar solo; guía visual de 2 pasos
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                    <span className="w-9 h-9 rounded-full bg-iogga-primary text-white text-base font-black flex items-center justify-center shrink-0">1</span>
                    <p className="text-sm text-zinc-200 leading-snug">
                      Toca el botón <span className="font-black text-white">Compartir</span>
                      <span className="inline-flex items-center justify-center w-8 h-8 mx-1 rounded-lg bg-[#0a84ff] text-white align-middle" aria-label="compartir">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>
                      </span>
                      abajo en la barra de <span className="font-black text-white">Safari</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                    <span className="w-9 h-9 rounded-full bg-iogga-primary text-white text-base font-black flex items-center justify-center shrink-0">2</span>
                    <p className="text-sm text-zinc-200 leading-snug">
                      Baja y elige
                      <span className="inline-flex items-center gap-1 mx-1 px-2 py-1 rounded-lg bg-white/10 text-white font-black align-middle text-xs">
                        Agregar a inicio
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 text-center pt-1">✨ Listo. iogga aparecerá en tu pantalla de inicio.</p>
                </div>
              ) : (
                // Android u otros: instrucciones según el navegador detectado
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                    <span className="w-9 h-9 rounded-full bg-iogga-primary text-white text-base font-black flex items-center justify-center shrink-0">1</span>
                    <p className="text-sm text-zinc-200 leading-snug">
                      Abre el menú:
                      <span className="inline-flex items-center justify-center w-8 h-8 mx-1 rounded-lg bg-white/10 text-white align-middle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                      </span>
                      <span className="font-black text-white">{installGuide.menu}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                    <span className="w-9 h-9 rounded-full bg-iogga-primary text-white text-base font-black flex items-center justify-center shrink-0">2</span>
                    <p className="text-sm text-zinc-200 leading-snug">
                      Dentro, toca <span className="font-black text-white">{installGuide.action}</span>.
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 text-center pt-1">✨ Listo. iogga aparecerá en tu pantalla de inicio. Si no ves la opción, busca ahí mismo el botón de <span className="font-bold text-zinc-300">Compartir</span>.</p>
                </div>
              )}

              <button
                onClick={() => setShowInstall(false)}
                className="w-full py-3 text-zinc-500 font-bold text-xs uppercase tracking-widest"
              >
                Ahora no
              </button>
            </motion.div>
          </div>
        )}

        {/* Ventana para invitar a un plan: elegir iogga (amigos) o WhatsApp */}
        {invitePlan && (
          <Modal onClose={() => { setInvitePlan(null); }} title="Invitar a tu plan">
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-white leading-relaxed">{buildInviteMessage(invitePlan)}</p>
              </div>

              {/* Opción 1: invitar amigos de iogga (les llega notificación real) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-iogga-primary uppercase tracking-widest">Invitar en iogga</p>
                  <button onClick={() => { setInvitePlan(null); setInviteSel([]); setShowFriends('following'); }} className="text-[10px] font-black text-iogga-primary flex items-center gap-1 bg-iogga-primary/10 px-2.5 py-1 rounded-full border border-iogga-primary/20"><UserPlus size={11} /> Agregar</button>
                </div>
                {following.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar">
                    {following.map(f => {
                      const sel = inviteSel.includes(f.uid);
                      return (
                        <button key={f.uid} onClick={() => setInviteSel(prev => sel ? prev.filter(x => x !== f.uid) : [...prev, f.uid])} className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${sel ? 'bg-iogga-primary/15 border-iogga-primary/40' : 'bg-white/5 border-white/10'}`}>
                          {f.photo ? <img src={f.photo} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white">{f.name.charAt(0).toUpperCase()}</div>}
                          <span className="text-sm text-white flex-1 text-left">{f.name}</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${sel ? 'bg-iogga-primary text-white' : 'border-2 border-white/20'}`}>{sel && <Check size={14} />}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">Aún no tienes amigos en iogga. <button onClick={() => { setInvitePlan(null); setShowFriends('following'); }} className="text-iogga-primary font-bold underline">Agrégalos</button>.</p>
                )}
                <button
                  onClick={() => {
                    sendIoggaInvites(invitePlan, inviteSel);
                    const n = inviteSel.length;
                    setInvitePlan(null); setInviteSel([]);
                    triggerBeta('¡Enviado en iogga!', n > 0 ? `Se envió la invitación a ${n} ${n === 1 ? 'amigo' : 'amigos'}. Les llegará a su campana y a sus invitaciones.` : 'Selecciona amigos para invitarlos en iogga.');
                  }}
                  disabled={inviteSel.length === 0}
                  className="w-full py-4 bg-iogga-primary text-white rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Enviar en iogga {inviteSel.length > 0 ? `(${inviteSel.length})` : ''}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" /><span className="text-[10px] text-zinc-600 font-bold">O</span><div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Opción 2: WhatsApp */}
              <button
                onClick={() => {
                  // WhatsApp además envía la invitación por iogga a los seleccionados
                  sendIoggaInvites(invitePlan, inviteSel);
                  sharePlanWhatsApp(invitePlan);
                  setInvitePlan(null); setInviteSel([]);
                }}
                className="w-full py-4 bg-green-500 text-white rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> Invitar por WhatsApp
              </button>
            </div>
          </Modal>
        )}

        {/* Amigos: buscar, seguir y ver tus listas (estilo Instagram) */}
        {showFriends && (
          <Modal onClose={() => { setShowFriends(null); setFriendSearch(''); }} title="Amigos en iogga">
            <div className="space-y-5">
              {(!currentUser || currentUser.isAnonymous) && (
                <button onClick={() => { setShowFriends(null); setIsRegistering(true); setShowLoginModal(true); }} className="w-full p-3 rounded-2xl bg-iogga-primary/10 border border-iogga-primary/25 text-left flex items-center gap-2">
                  <Shield size={16} className="text-iogga-primary shrink-0" />
                  <span className="text-xs text-zinc-300 leading-snug">Explora la comunidad. <span className="text-iogga-primary font-black">Inicia sesión</span> para guardar tus amigos.</span>
                </button>
              )}
              {(
                <>
                  {/* Buscar usuarios para agregar */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        value={friendSearch}
                        onChange={e => setFriendSearch(e.target.value)}
                        placeholder="Buscar personas por nombre…"
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-iogga-primary text-sm font-medium"
                      />
                    </div>
                    {/* Universo de iogga: todos (semilla + reales), foto, nombre y ranking */}
                    {(() => {
                      const q = friendSearch.trim().toLowerCase();
                      const byId: Record<string, { uid: string; name: string; photo?: string | null; rating?: number }> = {};
                      // Usuarios REALES registrados primero; luego los de prueba
                      allUsers.forEach(u => { byId[u.uid] = u; });
                      SEED_USERS.forEach(u => { if (!byId[u.uid]) byId[u.uid] = u; });
                      friendResults.forEach(f => { if (!byId[f.uid]) byId[f.uid] = f; });
                      let list = Object.values(byId);
                      if (q) list = list.filter(u => u.name.toLowerCase().includes(q));
                      return list.map(f => (
                        <div key={f.uid} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                          {/* Tocar la persona abre su perfil (estilo Instagram) */}
                          <button onClick={() => setSelectedFriend(f)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                            {f.photo ? <img src={f.photo} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-10 h-10 rounded-full bg-iogga-primary/20 text-iogga-primary flex items-center justify-center font-black">{f.name.charAt(0).toUpperCase()}</div>}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold text-white block truncate">{f.name}</span>
                              {typeof f.rating === 'number' && (
                                <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-0.5"><Star size={9} fill="currentColor" /> {f.rating.toFixed(1)}</span>
                              )}
                            </div>
                          </button>
                          <button onClick={() => toggleFollow(f as Friend)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all ${isFollowing(f.uid) ? 'bg-white/10 text-zinc-300' : 'bg-iogga-primary text-white'}`}>
                            {isFollowing(f.uid) ? 'Siguiendo' : 'Agregar'}
                          </button>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Pestañas */}
                  <div className="flex gap-2">
                    <button onClick={() => setShowFriends('following')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showFriends === 'following' ? 'bg-iogga-primary text-white' : 'bg-white/5 text-zinc-400'}`}>Amigos ({followingAll.length})</button>
                    <button onClick={() => setShowFriends('followers')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showFriends === 'followers' ? 'bg-iogga-primary text-white' : 'bg-white/5 text-zinc-400'}`}>Seguidores ({followersAll.length})</button>
                  </div>

                  {/* Lista */}
                  <div className="space-y-2">
                    {(showFriends === 'following' ? followingAll : followersAll).map(f => (
                      <div key={f.uid} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                        {f.photo ? <img src={f.photo} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-10 h-10 rounded-full bg-iogga-primary/20 text-iogga-primary flex items-center justify-center font-black">{f.name.charAt(0).toUpperCase()}</div>}
                        <span className="text-sm font-bold text-white flex-1">{f.name}</span>
                        {showFriends === 'following' ? (
                          <button onClick={() => toggleFollow(f)} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-zinc-300 active:scale-95">Quitar</button>
                        ) : !isFollowing(f.uid) ? (
                          <button onClick={() => toggleFollow(f)} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-iogga-primary text-white active:scale-95">Seguir</button>
                        ) : null}
                      </div>
                    ))}
                    {(showFriends === 'following' ? followingAll : followersAll).length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-6">
                        {showFriends === 'following' ? 'Aún no tienes amigos. Búscalos arriba o invítalos por WhatsApp.' : 'Aún no tienes seguidores.'}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}

        {/* Cerrar el plan o dejarlo abierto (tras aceptar a las personas) */}
        {pendingClose && (
          <Modal onClose={() => setPendingClose(null)} title="¿Ya está tu grupo?">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={30} />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed px-2">Ya avisaste a las personas que aceptaste. ¿Cierras el plan o lo dejas abierto por si se suman más?</p>
              <button
                onClick={() => {
                  const updated = { ...pendingClose, closed: true };
                  void saveDocIn('plans', pendingClose.id, updated);
                  setPlans(prev => prev.map(p => p.id === pendingClose.id ? updated : p));
                  setPendingClose(null);
                  triggerBeta('Plan cerrado', 'Tu grupo quedó listo. Ya no recibirás más. Cerrar no afecta tu calificación.');
                }}
                className="w-full py-4 bg-emerald-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                Cerrar plan
              </button>
              <button
                onClick={() => setPendingClose(null)}
                className="w-full py-4 bg-white/10 text-white rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              >
                Dejarlo abierto
              </button>
            </div>
          </Modal>
        )}

        {/* Calificar al anfitrión al terminar el plan (peer rating, justo) */}
        {pendingRating && (
          <Modal onClose={() => setPendingRating(null)} title="¿Qué tal estuvo el plan?">
            <div className="space-y-5 text-center">
              <img src={pendingRating.userAvatar} className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-white/10" referrerPolicy="no-referrer" />
              <div>
                <p className="text-sm text-zinc-400">Califica a</p>
                <h3 className="text-xl font-black text-white">{pendingRating.userName}</h3>
                <p className="text-xs text-zinc-500 mt-1">por "{pendingRating.activity}"</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => submitRating(pendingRating, s)} className="p-1 active:scale-90 transition-transform text-yellow-500 hover:scale-110" title={`${s} estrellas`}>
                    <Star size={38} fill="currentColor" />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">Toca una estrella. Tu opinión ayuda a que iogga sea confiable.</p>
              <button onClick={() => setPendingRating(null)} className="w-full py-2.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Ahora no</button>
            </div>
          </Modal>
        )}

        {/* Perfil de una persona (desde Agregar amigos) — básico estilo Instagram */}
        {selectedFriend && (
          <Modal onClose={() => setSelectedFriend(null)} title="Perfil">
            <div className="space-y-5 text-center">
              {selectedFriend.photo ? (
                <img src={selectedFriend.photo} className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-white/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-iogga-primary/20 text-iogga-primary flex items-center justify-center text-3xl font-black mx-auto">{selectedFriend.name.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <h3 className="text-xl font-black text-white">{selectedFriend.name}</h3>
                <p className="text-xs text-zinc-500">@{selectedFriend.name.toLowerCase().replace(/\s+/g, '')}</p>
                {typeof selectedFriend.rating === 'number' && (
                  <p className="text-xs text-yellow-500 font-bold flex items-center justify-center gap-1 mt-1"><Star size={12} fill="currentColor" /> {selectedFriend.rating.toFixed(1)}</p>
                )}
              </div>
              {/* Sus planes públicos activos (si los hay) */}
              {(() => { const theirPlans = plans.filter(p => p.uid === selectedFriend.uid && p.isPublic && isLivePlan(p)); return theirPlans.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {theirPlans.slice(0, 6).map(pl => (
                    <button key={pl.id} onClick={() => { setSelectedFriend(null); setShowFriends(null); setSelectedPlanForDetails(pl); }} className="aspect-square rounded-lg overflow-hidden relative">
                      <img src={pl.image || `https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=200&q=80`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              ) : <p className="text-xs text-zinc-500 italic">Sin planes públicos por ahora.</p>; })()}
              <button
                onClick={() => toggleFollow(selectedFriend)}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all ${isFollowing(selectedFriend.uid) ? 'bg-white/10 text-zinc-300' : 'bg-iogga-primary text-white shadow-lg shadow-iogga-primary/20'}`}
              >
                {isFollowing(selectedFriend.uid) ? 'Dejar de seguir' : 'Agregar amigo'}
              </button>
            </div>
          </Modal>
        )}

        {/* Bienvenida a iogga para Negocios: popup grande en verde */}
        {showBizWelcome && (
          <div className="fixed inset-0 z-[340] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowBizWelcome(false)} />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] } }}
              className="relative w-full sm:max-w-md bg-zinc-950 border border-iogga-accent/30 rounded-t-[32px] sm:rounded-[32px] p-7 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-5 text-center"
            >
              <div className="flex justify-center">
                <div className="p-4 rounded-3xl bg-iogga-accent/15 border border-iogga-accent/30 text-iogga-accent">
                  <Store size={34} />
                </div>
              </div>
              <h2 className="font-black text-white leading-[1.05]" style={{ fontSize: '2.1rem' }}>
                iogga para <span className="text-iogga-accent">negocios</span>
              </h2>
              <p className="text-lg text-zinc-200 leading-snug font-medium">
                Se acabó pagar por prospectos inciertos. Aquí ves <span className="font-black text-white">personas que YA están buscando tu producto ahora mismo</span> y les mandas tu promoción.
              </p>
              <p className="text-sm text-iogga-accent font-bold">Clientes reales en tiempo real, no leads. 🧲</p>
              <button
                onClick={() => setShowBizWelcome(false)}
                className="w-full py-5 bg-iogga-accent text-white rounded-[24px] font-black text-base active:scale-95 transition-all shadow-xl shadow-iogga-accent/30"
              >
                Empezar
              </button>
            </motion.div>
          </div>
        )}

        {/* Bienvenida a iogga (persona): popup grande morado, primera vez */}
        {showPersonWelcome && (
          <div className="fixed inset-0 z-[340] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowPersonWelcome(false)} />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] } }}
              className="relative w-full sm:max-w-md bg-zinc-950 border border-iogga-primary/30 rounded-t-[32px] sm:rounded-[32px] p-7 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-5 text-center"
            >
              <div className="flex justify-center">
                <div className="p-4 rounded-3xl bg-iogga-primary/15 border border-iogga-primary/30 text-iogga-primary">
                  <Sparkles size={34} />
                </div>
              </div>
              <h2 className="font-black text-white leading-[1.05]" style={{ fontSize: '2.1rem' }}>
                Bienvenido a <span className="text-iogga-primary">iogga</span>
              </h2>
              <p className="text-lg text-zinc-200 leading-snug font-medium">
                La app para <span className="font-black text-white">salir del móvil y vivir lo espontáneo</span>. Comparte tu intención —"un café", "vamos al cine"— y quien quiera se suma.
              </p>
              <p className="text-sm text-iogga-primary font-bold">Sin chats interminables: solo acción. ✨</p>
              <button
                onClick={() => setShowPersonWelcome(false)}
                className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-base active:scale-95 transition-all shadow-xl shadow-iogga-primary/30"
              >
                Empezar
              </button>
            </motion.div>
          </div>
        )}

        {/* Legales: Aviso de Privacidad y Términos (textos genéricos de MVP) */}
        {showLegal && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLegal(null)} />
            <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-white uppercase tracking-tight">
                  {showLegal === 'privacy' ? 'Aviso de Privacidad' : 'Términos y Condiciones'}
                </h3>
                <button onClick={() => setShowLegal(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
                  <X size={18} />
                </button>
              </div>
              {showLegal === 'privacy' ? (
                <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                  <p><span className="text-white font-bold">iogga</span> (en adelante "la Plataforma"), con base en Chihuahua, México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
                  <p><span className="text-white font-bold">Datos que recabamos:</span> nombre, correo electrónico, número de WhatsApp (opcional), fotografía de perfil (opcional), ubicación aproximada y la actividad que publiques en la Plataforma (planes, promociones y canjes).</p>
                  <p><span className="text-white font-bold">Finalidades:</span> crear y administrar tu cuenta; conectar planes personales con promociones comerciales; permitir la validación de códigos de canje entre usuarios y negocios; y mostrar estadísticas de uso a los negocios.</p>
                  <p><span className="text-white font-bold">Compartición:</span> tu nombre y foto son visibles para otros usuarios. Tu número de WhatsApp solo se muestra a quienes interactúan con tus planes, para coordinar directamente. No vendemos tus datos a terceros.</p>
                  <p><span className="text-white font-bold">Derechos ARCO:</span> puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo a <span className="text-white">admin@iogga.com</span>. También puedes eliminar tu cuenta en cualquier momento.</p>
                  <p><span className="text-white font-bold">Seguridad:</span> los datos se almacenan en la infraestructura de Google Firebase con controles de acceso y cifrado en tránsito.</p>
                  <p className="text-zinc-600">Última actualización: julio de 2026. Este aviso puede actualizarse; los cambios se publicarán en la Plataforma.</p>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                  <p>Al usar <span className="text-white font-bold">iogga</span> aceptas estos términos. Si no estás de acuerdo, no uses la Plataforma.</p>
                  <p><span className="text-white font-bold">1. El servicio.</span> iogga conecta planes personales con promociones de negocios en tiempo real. iogga no es parte de las transacciones entre usuarios y negocios: los precios, la calidad y la entrega de productos o servicios son responsabilidad exclusiva del negocio.</p>
                  <p><span className="text-white font-bold">2. Tu cuenta.</span> Debes ser mayor de 18 años. Eres responsable de la información que publiques y de mantener la confidencialidad de tu acceso.</p>
                  <p><span className="text-white font-bold">3. Códigos de canje.</span> Los códigos QR generados por la Plataforma son personales, válidos por 24 horas y de un solo uso. Su validación es realizada por el negocio correspondiente. iogga no garantiza la disponibilidad de una promoción al momento del canje.</p>
                  <p><span className="text-white font-bold">4. Encuentros entre usuarios.</span> Los planes se realizan bajo tu propia responsabilidad. Te recomendamos reunirte en lugares públicos y verificar la identidad de las personas. iogga no supervisa los encuentros ni se hace responsable de lo que ocurra en ellos.</p>
                  <p><span className="text-white font-bold">5. Contenido.</span> No publiques contenido ilegal, ofensivo o engañoso. Podemos retirar contenido y suspender cuentas que violen estos términos.</p>
                  <p><span className="text-white font-bold">6. Responsabilidad.</span> La Plataforma se ofrece "tal cual", en etapa MVP. En la medida permitida por la ley, iogga no será responsable por daños indirectos derivados del uso del servicio.</p>
                  <p><span className="text-white font-bold">7. Contacto.</span> admin@iogga.com · Chihuahua, México.</p>
                  <p className="text-zinc-600">Última actualización: julio de 2026.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )}

    {/* Arranque: pantalla negra (parece apagado) -> tocas -> el logo entra en
        fade in de 4s mientras suena el intro. El toque desbloquea el audio. */}
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: 'easeInOut' } }}
          onClick={revealSplash}
          className="fixed inset-0 z-[500] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {/* Fase 1: negro total, sin nada (el cel parece apagado). Espera el toque. */}
          {/* Fase 2: el logo oficial entra muy suave (fade in lento de 4s) */}
          {splashRevealed && (
            <div className="flex flex-col items-center gap-6 px-8 max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 4, ease: [0.22, 0.61, 0.36, 1] } }}
                className="flex flex-col items-center gap-5"
              >
                <div className="w-28 h-28 rounded-full bg-white shadow-[0_0_70px_rgba(255,255,255,0.28)]" />
                <span
                  className="text-white leading-none"
                  style={{ fontFamily: '"Quicksand", sans-serif', fontWeight: 600, fontSize: '3.4rem', letterSpacing: '-0.01em' }}
                >
                  iogga
                </span>
              </motion.div>
              {/* El mensaje de iogga entra sutil, sincronizado, después del logo */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 2.2, delay: 3, ease: 'easeInOut' } }}
                className="text-center text-base leading-relaxed"
                style={{ color: '#a5b4fc' }}
              >
                {IOGGA_WELCOME}
              </motion.p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Tutorial Overlay */}
    {showTutorial && (
      <TutorialOverlay 
        step={tutorialStep}
        setStep={setTutorialStep}
        mode={tutorialMode}
        setMode={setTutorialMode}
        onClose={() => {
          setShowTutorial(false);
          localStorage.setItem('iogga_tutorial_completed', 'true');
        }}
        appMode={mode}
        setAppMode={setMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isIntro={isIntro}
        setIsIntro={setIsIntro}
      />
    )}
  </div>
</div>
);
}

function TutorialOverlay({ step, setStep, mode, setMode, onClose, appMode, setAppMode, activeTab, setActiveTab, isIntro, setIsIntro }: { 
  step: number, 
  setStep: React.Dispatch<React.SetStateAction<number>>, 
  mode: UserMode, 
  setMode: React.Dispatch<React.SetStateAction<UserMode>>, 
  onClose: () => void,
  appMode: UserMode,
  setAppMode: React.Dispatch<React.SetStateAction<UserMode>>,
  activeTab: string,
  setActiveTab: (tab: any) => void,
  isIntro: boolean,
  setIsIntro: (val: boolean) => void
}) {
  const [rect, setRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const steps = {
    person: [
      {
        title: "iogga ✨",
        description: "La app para salir del móvil y entrar en la vida. Crea momentos mágicos, sin chats, espontáneamente. Comparte tu intención y deja que la magia haga el resto.",
        targetId: null,
        icon: <Sparkles className="text-iogga-primary" size={32} />
      },
      {
        title: "Escribe tu Plan",
        description: "Aquí es donde empieza la magia. Toca aquí para escribir lo que quieres hacer hoy.",
        targetId: 'tutorial-intro-input',
        icon: <Edit3 className="text-iogga-accent" size={32} />,
        onEnter: () => setIsIntro(true)
      },
      {
        title: "Tus Invitaciones",
        description: "Aquí verás quién te ha invitado a sus planes. ¡Alguien quiere compartir contigo!",
        targetId: 'nav-home',
        icon: <MessageSquare className="text-iogga-primary" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setActiveTab('home');
        }
      },
      {
        title: "Explora Planes",
        description: "¡Sal de la rutina! Aquí exploras planes de otras personas cerca de ti en tiempo real.",
        targetId: 'nav-search',
        icon: <Search className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setActiveTab('search');
        }
      },
      {
        title: "Tus Planes",
        description: "Aquí ves tus planes organizados y tus compromisos aceptados en un solo lugar.",
        targetId: 'nav-active',
        icon: <CheckCircle2 className="text-iogga-primary" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setActiveTab('active');
        }
      },
      {
        title: "¿Tienes un Negocio?",
        description: "Puedes cambiar al perfil de negocio aquí para publicar tus productos y conectar con clientes.",
        targetId: 'tutorial-mode-switch',
        icon: <Briefcase className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setActiveTab('home');
        }
      }
    ],
    business: [
      {
        title: "iogga para Negocios",
        description: "Potencia tu negocio conectando con personas que buscan qué hacer en tiempo real.",
        targetId: null,
        icon: <Store className="text-iogga-accent" size={32} />,
        onEnter: () => setIsIntro(false)
      },
      {
        title: "Publica Ofertas",
        description: "Crea productos y ofertas especiales que aparecerán cuando la gente busque qué hacer.",
        targetId: 'tutorial-create-btn',
        icon: <PackagePlus className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setMode('business');
          setActiveTab('home');
        }
      },
      {
        title: "Demanda Real",
        description: "Mira qué está buscando la gente en tiempo real en Chihuahua para adaptar tu oferta.",
        targetId: 'nav-search',
        icon: <TrendingUp className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setMode('business');
          setActiveTab('search');
        }
      },
      {
        title: "Tendencias",
        description: "Observa lo que la gente está haciendo ahora mismo para adaptar tu oferta.",
        targetId: 'nav-search',
        icon: <Globe className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setMode('business');
          setActiveTab('search');
        }
      },
      {
        title: "Tus Ganancias",
        description: "Sigue el rendimiento de tu negocio con analíticas claras y profesionales.",
        targetId: 'nav-analytics',
        icon: <DollarSign className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setMode('business');
          setActiveTab('analytics');
        }
      },
      {
        title: "Análisis Detallado",
        description: "Revisa el éxito de cada producto individualmente para optimizar tus ventas.",
        targetId: 'tutorial-business-offer-card',
        icon: <BarChart3 className="text-iogga-accent" size={32} />,
        onEnter: () => {
          setIsIntro(false);
          setMode('business');
          setActiveTab('active');
        }
      }
    ]
  };

  const currentStep = steps[mode][step];

  useEffect(() => {
    if (currentStep.onEnter) {
      currentStep.onEnter();
    }
  }, [step, mode]);

  useEffect(() => {
    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.getElementById(currentStep.targetId);
        const container = document.querySelector('.app-container');
        if (el && container) {
          const elRect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          setRect({
            x: elRect.left - containerRect.left,
            y: elRect.top - containerRect.top,
            width: elRect.width,
            height: elRect.height
          });
        } else {
          setRect(null);
        }
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    const timeout = setTimeout(updateRect, 300);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(timeout);
    };
  }, [step, mode, currentStep.targetId, appMode, activeTab, isIntro]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] overflow-hidden pointer-events-none rounded-[48px]"
    >
      {/* Backdrop with hole */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <motion.rect 
                initial={false}
                animate={{ 
                  x: rect.x - 8, 
                  y: rect.y - 8, 
                  width: rect.width + 16, 
                  height: rect.height + 16 
                }}
                rx="16" 
                fill="black" 
              />
            )}
          </mask>
        </defs>
        <rect 
          x="0" y="0" width="100%" height="100%" 
          fill="rgba(0,0,0,0.6)" 
          mask="url(#tutorial-mask)" 
          className="pointer-events-auto"
          onClick={onClose}
        />
      </svg>

      {/* Tooltip / Balloon */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          key={`${mode}-${step}`}
          initial={{ scale: 0.96, opacity: 0, y: 24 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: rect ? (rect.y > 400 ? Math.max(20, rect.y - 340) : Math.min(rect.y + rect.height + 20, 500)) : 0,
            x: '-50%',
            left: '50%',
            top: rect ? 0 : '50%',
            position: 'absolute',
            marginTop: rect ? 0 : '-150px' // Offset when centered
          }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className={`w-[calc(100%-48px)] max-w-[320px] bg-zinc-900 border rounded-[32px] p-6 shadow-2xl pointer-events-auto ${mode === 'business' ? 'border-iogga-accent/30' : 'border-white/10'}`}
        >
          {/* Arrow for spotlight */}
          {rect && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-l border-t border-white/10 rotate-45 ${rect.y > 400 ? '-bottom-2 rotate-[225deg]' : '-top-2'}`}
            />
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mode === 'business' ? 'bg-iogga-accent/15 text-iogga-accent' : 'bg-iogga-primary/10 text-iogga-primary'}`}>
                {currentStep.icon}
              </div>
              <button 
                onClick={onClose}
                className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                Saltar
              </button>
            </div>

            <div className="space-y-2">
              <h3 className={`font-black text-white leading-tight ${step === 0 ? 'text-3xl' : 'text-xl'}`}>{currentStep.title}</h3>
              <p className={`text-zinc-400 leading-relaxed ${step === 0 ? 'text-base' : 'text-sm'}`}>{currentStep.description}</p>
            </div>

            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <button 
                  onClick={() => setStep(prev => prev - 1)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Atrás
                </button>
              )}
              
              {mode === 'person' && step === 5 ? (
                <div className="flex flex-col w-full gap-2">
                  <button 
                    onClick={() => {
                      setAppMode('business');
                      setMode('business');
                      setStep(0);
                    }}
                    className="w-full py-3 rounded-xl bg-iogga-primary text-white text-xs font-black shadow-lg shadow-iogga-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Sí, tengo negocio
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-white/5 text-zinc-400 text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    No, soy usuario
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (step === 5) onClose();
                    else setStep(prev => prev + 1);
                  }}
                  className={`flex-[2] py-3 rounded-xl text-white text-xs font-black shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${mode === 'business' ? 'bg-iogga-accent shadow-iogga-accent/20' : 'bg-iogga-primary shadow-iogga-primary/20'}`}
                >
                  {step === 5 ? 'Comenzar' : 'Continuar'}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1 justify-center pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${i === step ? (mode === 'business' ? 'w-6 bg-iogga-accent' : 'w-6 bg-iogga-primary') : 'w-1.5 bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PlanCard({ plan, onAccept, onIgnore }: { plan: Plan, onAccept?: () => void, onIgnore?: () => void, key?: string | number }) {
  // Mock AI recommendation
  const isAiRecommended = plan.id === '1' || plan.id === '3';

  return (
    <div className="p-6 rounded-[32px] border border-white/10 bg-white/5 shadow-2xl space-y-5 relative overflow-hidden group hover:bg-white/[0.08] transition-all duration-500">
      {plan.isSeed && <SeedTag />}
      {isAiRecommended && (
        <div className="absolute top-0 right-0 bg-iogga-primary/20 px-4 py-1.5 rounded-bl-2xl border-l border-b border-iogga-primary/30 flex items-center gap-1.5 z-10 backdrop-blur-md">
          <Sparkles size={12} className="text-iogga-primary animate-pulse" />
          <span className="text-[9px] font-black text-iogga-primary uppercase tracking-[0.2em]">Match IA</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <button 
          onClick={() => onAccept ? null : window.dispatchEvent(new CustomEvent('open-user-profile', { detail: plan }))}
          className="flex items-center gap-3 min-w-0 text-left group/avatar"
        >
          <div className="relative shrink-0">
            <img src={plan.userAvatar} className="w-12 h-12 rounded-full border-2 border-white/10 group-hover/avatar:border-iogga-primary transition-all duration-500 object-cover" referrerPolicy="no-referrer" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-lg text-white truncate group-hover/avatar:text-iogga-primary transition-colors tracking-tight">{plan.userName}</span>
            <div className="flex items-center gap-0.5 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill={i < 4 ? "currentColor" : "none"} className={i < 4 ? "" : "opacity-30"} />
              ))}
            </div>
          </div>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest shrink-0">Hace 15 min</span>
          <div className="flex items-center gap-1 text-iogga-primary mt-1">
            <div className="w-1 h-1 rounded-full bg-iogga-primary animate-ping"></div>
            <span className="text-[8px] font-black uppercase tracking-widest">En línea</span>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Propuesta de Plan</h4>
          <div className="px-2 py-0.5 rounded-md bg-white/10 text-[8px] font-bold text-white/60 uppercase tracking-widest">Verificado</div>
        </div>
        {renderPlanTechnicalDetails(plan)}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button 
          onClick={onIgnore}
          className="flex-1 py-4 bg-white/5 text-zinc-500 rounded-2xl font-bold text-xs active:scale-95 transition-all border border-white/10 hover:bg-white/10"
        >
          Ignorar
        </button>
        <button 
          onClick={onAccept}
          className="flex-[2] py-4 bg-iogga-primary text-white rounded-2xl font-black text-xs active:scale-95 transition-all shadow-xl shadow-iogga-primary/20 hover:scale-[1.02] border border-white/10"
        >
          Aceptar Plan
        </button>
      </div>
    </div>
  );
}

function GroupedPlanCard({ group, rank, locked, onUnlock }: { group: any, rank: number, locked?: boolean, onUnlock?: () => void, key?: string | number }) {
  const isFirst = rank === 1;

  return (
    <motion.div 
      layout
      animate={{ 
        y: [0, -4, 0],
        transition: { 
          duration: 5 + Math.random() * 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } 
      }}
      whileHover={{ scale: 1.01, zIndex: 10 }}
      whileTap={{ scale: 0.99 }}
      className={`relative min-h-[380px] rounded-[48px] overflow-hidden group cursor-pointer shadow-2xl border ${isFirst ? 'border-iogga-primary/40 ring-1 ring-iogga-primary/20' : 'border-white/5'}`}
    >
      <img src={group.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
      
      {/* Editorial Gradient Overlay - Stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      
      {/* Content Container */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        {/* Top Row: Badges & Status */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 w-fit">
              <div className={`w-1.5 h-1.5 rounded-full ${isFirst ? 'bg-iogga-primary animate-pulse' : 'bg-iogga-accent'}`} />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
                {isFirst ? 'Tendencia #1' : 'En Alza'}
              </span>
            </div>
            <span className="text-[10px] font-black text-iogga-primary uppercase tracking-[0.2em] bg-iogga-primary/20 px-3 py-1.5 rounded-full border border-iogga-primary/30 backdrop-blur-md w-fit">
              {group.category}
            </span>
          </div>

          {/* Large Active Count - Floating Glass Circle */}
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col items-center justify-center shadow-2xl group-hover:border-iogga-primary/50 transition-colors">
            <span onClick={locked ? (e) => { e.stopPropagation(); onUnlock?.(); } : undefined} className={`text-2xl font-black text-white leading-none ${locked ? 'blur-[6px] select-none cursor-pointer' : ''}`}>{group.count}</span>
            <span className="text-[7px] font-black text-iogga-primary uppercase tracking-widest mt-1">Activos</span>
          </div>
        </div>

        {/* Bottom Section: Info & Action */}
        <div className="space-y-5">
          {/* Editorial Title & Location */}
          <div className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            <h3 className="text-4xl font-black text-white leading-[0.9] tracking-tighter mb-2">
              {group.subCategory}
            </h3>
            <div className="flex items-center gap-2 text-white/80">
              <MapPin size={14} className="text-iogga-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{group.location}</span>
            </div>
          </div>

          {/* Insight Bar - Elegant Glassmorphism */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-4 rounded-[24px] border border-white/10 group-hover:bg-black/60 transition-colors">
            <div className="p-2 bg-iogga-primary/20 rounded-xl shrink-0">
              <Sparkles size={18} className="text-iogga-primary" />
            </div>
            <p className="text-xs font-bold text-white/90 leading-snug">
              Análisis en vivo: <span onClick={locked ? (e) => { e.stopPropagation(); onUnlock?.(); } : undefined} className={`text-iogga-primary ${locked ? 'blur-[5px] select-none cursor-pointer' : ''}`}>{group.count} personas</span> están buscando {group.subCategory.toLowerCase()} en este momento.{locked && <span className="block text-[9px] text-zinc-500 mt-1">Inicia sesión para ver los números en vivo</span>}
            </p>
          </div>

          {/* Action Button - Premium Feel */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('open-create-promo'));
            }}
            className="w-full py-4.5 bg-iogga-accent text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-iogga-accent/30 hover:bg-iogga-accent/90 active:scale-[0.98] transition-all border border-white/20 flex items-center justify-center gap-3"
          >
            <span>Lanzar Promoción</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface PromoCardProps {
  promo: Promotion;
  onClick: () => void;
  onBusinessClick?: () => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ promo, onClick, onBusinessClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative aspect-[9/16] rounded-[32px] overflow-hidden group shadow-2xl cursor-pointer border border-white/10"
    >
      {promo.isSeed && <SeedTag />}
      <img src={promo.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-4 flex flex-col justify-end">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="relative cursor-pointer hover:scale-110 transition-transform shadow-lg"
            onClick={(e) => {
              if (onBusinessClick) {
                e.stopPropagation();
                onBusinessClick();
              }
            }}
          >
            <img src={promo.businessLogo} className="w-8 h-8 rounded-full border-2 border-white/50" referrerPolicy="no-referrer" />
          </div>
          <div 
            className="cursor-pointer drop-shadow-md"
            onClick={(e) => {
              if (onBusinessClick) {
                e.stopPropagation();
                onBusinessClick();
              }
            }}
          >
            <span className="text-xs font-black text-white block tracking-tight">{promo.businessName}</span>
          </div>
        </div>
        
        <h4 className="text-lg font-black text-white leading-tight mb-2 drop-shadow-lg line-clamp-2">{promo.title}</h4>
        
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-black uppercase tracking-wider">
            <MapPin size={10} className="text-iogga-accent" />
            <span>{promo.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-black uppercase tracking-wider">
            <Clock size={10} className="text-iogga-accent" />
            <span>Abierto • 08:00 - 22:00</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-black uppercase tracking-wider">
            <Navigation size={10} className="text-iogga-accent" />
            <span>A 1.2 km de ti</span>
          </div>
        </div>

        <div className="flex items-center justify-between drop-shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white">{promo.price}</span>
            {promo.offer && (
              <span className="text-[8px] font-black text-iogga-accent uppercase tracking-tighter">{promo.offer}</span>
            )}
          </div>
          <button className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white group-hover:bg-iogga-accent transition-all">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };
  
  return (
    <div className={`${dimensions[size]} bg-iogga-primary rounded-full shadow-lg shadow-iogga-primary/20`} />
  );
}

function SettingsItem({ icon, label, onClick, tone }: { icon: React.ReactNode, label: string, onClick?: () => void, tone?: 'business' | 'personal' }) {
  const biz = tone === 'business';
  const per = tone === 'personal';
  const bg = biz ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : per ? 'bg-violet-500/10 hover:bg-violet-500/20' : 'hover:bg-white/5';
  const iconCls = biz ? 'text-emerald-400' : per ? 'text-violet-400' : 'text-zinc-500 group-hover:text-iogga-primary';
  const textCls = biz ? 'text-emerald-300' : per ? 'text-violet-300' : 'text-zinc-300';
  const chevCls = biz ? 'text-emerald-500/60' : per ? 'text-violet-500/60' : 'text-zinc-600';
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-center justify-between transition-colors border-b border-white/5 last:border-0 group ${bg}`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-colors ${iconCls}`}>{icon}</div>
        <span className={`text-sm font-bold ${textCls}`}>{label}</span>
      </div>
      <ChevronRight size={16} className={chevCls} />
    </button>
  );
}

function NavButton({ active, onClick, onDoubleClick, icon, label, color, id }: { active: boolean, onClick: () => void, onDoubleClick?: () => void, icon: React.ReactNode, label: string, color: string, id?: string }) {
  return (
    <button 
      id={id}
      onClick={onClick} 
      onDoubleClick={onDoubleClick}
      className={`flex flex-col items-center justify-center gap-1.5 transition-all ${active ? color : 'text-zinc-500'} active:scale-90 relative py-1`}
    >
      <div className={`transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-0.5'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="navIndicator"
          className={`absolute -bottom-1 w-1 h-1 rounded-full ${color.replace('text-', 'bg-')}`}
        />
      )}
    </button>
  );
}

function ProfileButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors active:scale-95">
      <div className="text-zinc-500">{icon}</div>
      <span className="text-sm font-medium text-zinc-400">{label}</span>
    </button>
  );
}

function SelectButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${active ? 'bg-iogga-primary text-white border-iogga-primary shadow-md' : 'bg-white/5 text-zinc-500 border-white/10'}`}
    >
      {label}
    </button>
  );
}

function Modal({ children, onClose, onBack, title }: { children: React.ReactNode, onClose: () => void, onBack?: () => void, title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        className="w-full bg-zinc-950 rounded-t-[48px] p-8 max-h-[94%] overflow-y-auto no-scrollbar shadow-2xl border-t border-white/10 relative"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 shrink-0" />
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-2.5 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all active:scale-90 border border-white/10"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
            )}
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all active:scale-90 border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
        <div className="pb-10">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function UserProfileModal({ user, onClose, onComingSoon }: { user: Plan, onClose: () => void, onComingSoon: (f: string) => void }) {
  return (
    <Modal onClose={onClose} title="Perfil de Usuario">
      <div className="space-y-8">
        <div className="relative">
          <div className="aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl">
            <img src={user.userAvatar.replace('100/100', '800/1000')} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          </div>
          
          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-4xl font-black text-white tracking-tighter">{user.userName}</h3>
                <div className="flex items-center gap-2 text-white/60 mt-1">
                  <MapPin size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest">Cerca de ti</span>
                </div>
              </div>
              <div className="bg-iogga-primary px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-iogga-primary/20">
                <Star size={14} className="text-white fill-white" />
                <span className="text-sm font-black text-white">{(user.userStats?.rating ?? 5).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
            <span className="text-2xl font-black text-white block">{user.userStats?.plans || 0}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Planes</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
            <span className="text-2xl font-black text-white block">{user.userStats?.friends || 0}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Amigos</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
            <span className="text-2xl font-black text-white block">100%</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Confianza</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Sobre mí</h4>
          <p className="text-lg text-white/80 leading-relaxed font-medium italic">
            "{user.userBio || '¡Hola! Soy nuevo en Iogga y estoy listo para crear planes increíbles.'}"
          </p>
        </div>

        <div className="flex gap-4">
          <a 
            href={`https://wa.me/526141234567?text=${encodeURIComponent(`¡Hola ${user.userName}! Vi tu perfil en iogga Chihuahua y me gustaría conectar contigo para armar planes juntos. 👋`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-5 bg-emerald-500/10 text-emerald-400 rounded-[24px] font-black text-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center flex items-center justify-center gap-2"
          >
            <span>WhatsApp</span>
          </a>
          <button onClick={() => onComingSoon("Seguir usuarios")} className="flex-1 py-5 bg-iogga-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-iogga-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Seguir
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BusinessProfileModal({ business, offers = [], onOpenOffer, waLink, onClose, appMode, onStartBusinessFlow, onComingSoon }: { business: Promotion, offers?: Promotion[], onOpenOffer?: (p: Promotion) => void, waLink?: (phone: string, text: string) => string, onClose: () => void, appMode?: UserMode, onStartBusinessFlow?: () => void, onComingSoon: (f: string) => void }) {
  const [showOffers, setShowOffers] = React.useState(false);
  const [askCall, setAskCall] = React.useState(false);
  const phone = business.phone;
  return (
    <Modal onClose={onClose} title="Perfil de Negocio">
      <div className="space-y-8">
        <div className="relative">
          <div className="aspect-video rounded-[48px] overflow-hidden shadow-2xl">
            <img src={business.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          </div>
          
          <div className="absolute -bottom-6 left-8 flex items-end gap-4">
            <div className="w-24 h-24 rounded-[32px] border-4 border-zinc-950 overflow-hidden shadow-2xl bg-zinc-900">
              <img src={business.businessLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="pb-2">
              <h3 className="text-3xl font-black text-white tracking-tighter">{business.businessName}</h3>
              <div className="flex items-center gap-2 text-iogga-accent mt-1">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Negocio Verificado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Business Promo Creator Invitation Banner for Regular Users */}
        {appMode === 'person' && (
          <div className="p-6 rounded-[32px] bg-gradient-to-r from-iogga-accent/20 via-indigo-500/10 to-iogga-accent/5 border border-iogga-accent/30 space-y-4">
            <div className="flex items-center gap-2.5 text-iogga-accent">
              <Sparkles size={18} className="animate-pulse" />
              <h4 className="font-lexend font-black text-sm uppercase tracking-wider text-white">¿Tienes un negocio en Chihuahua?</h4>
            </div>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Atrae clientes publicando tus propias ofertas como esta en tiempo real. Crea tu perfil de negocio gratis (sin registrarte) y diseña tu primera promo en segundos.
            </p>
            <button 
              onClick={() => {
                onClose();
                if (onStartBusinessFlow) {
                  onStartBusinessFlow();
                }
              }}
              className="w-full py-4 bg-iogga-accent hover:bg-iogga-accent/90 text-zinc-950 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg shadow-iogga-accent/20 transition-all active:scale-[0.98] min-h-[44px]"
            >
              Crear mi Perfil de Negocio
            </button>
          </div>
        )}

        <div className="pt-6 grid grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
            <span className="text-2xl font-black text-white block">{business.businessStats?.offers || 0}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ofertas</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
            <span className="text-2xl font-black text-white block">{business.businessStats?.followers || 0}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Seguidores</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
            <span className="text-2xl font-black text-white block">{(business.businessStats?.rating ?? 5).toFixed(1)}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Rating</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Nuestra Historia</h4>
          <p className="text-lg text-white/80 leading-relaxed font-medium italic">
            "{business.businessBio || 'Ofreciendo lo mejor para nuestra comunidad.'}"
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Ubicación</h4>
          {/* Ubicación activa: abre el mapa con la dirección del negocio */}
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(business.location || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-[32px] bg-white/5 border border-white/10 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="p-3 bg-iogga-accent/10 rounded-2xl text-iogga-accent">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <span className="text-white font-bold block">{business.location}</span>
              <span className="text-xs text-iogga-accent font-bold">Ver en el mapa →</span>
            </div>
          </a>
        </div>

        {/* Ver ofertas: se despliegan hacia abajo; al tocar una, abre su tarjeta */}
        {showOffers && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Ofertas de {business.businessName}</h4>
            {offers.length === 0 && <p className="text-xs text-zinc-500 italic py-2">Este negocio aún no tiene ofertas publicadas.</p>}
            {offers.map(o => (
              <button key={o.id} onClick={() => onOpenOffer?.(o)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                <img src={o.image} className="w-14 h-14 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{o.title}</p>
                  <p className="text-[10px] text-iogga-accent font-black uppercase tracking-widest">{o.offer} · {o.price}</p>
                </div>
                <ChevronRight size={16} className="text-zinc-500 shrink-0" />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          {/* Llamar: pregunta si llamada o WhatsApp */}
          <div className="flex-1 relative">
            {askCall && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
                <a href={phone ? `tel:${phone}` : undefined} onClick={() => setAskCall(false)} className="w-full px-4 py-3 flex items-center gap-2 text-sm font-bold text-white hover:bg-white/5 border-b border-white/5">
                  <Smartphone size={15} className="text-iogga-primary" /> Llamada telefónica
                </a>
                <a href={phone && waLink ? waLink(phone, `¡Hola ${business.businessName}! Los vi en iogga.`) : undefined} target="_blank" rel="noopener noreferrer" onClick={() => setAskCall(false)} className="w-full px-4 py-3 flex items-center gap-2 text-sm font-bold text-white hover:bg-white/5">
                  <MessageSquare size={15} className="text-green-400" /> WhatsApp
                </a>
              </div>
            )}
            <button
              onClick={() => phone ? setAskCall(v => !v) : onComingSoon('Este negocio aún no puso su teléfono')}
              className="w-full py-5 bg-white/5 text-white rounded-[24px] font-black text-lg border border-white/10 hover:bg-white/10 transition-all"
            >
              Llamar
            </button>
          </div>
          <button onClick={() => setShowOffers(v => !v)} className="flex-1 py-5 bg-iogga-accent text-white rounded-[24px] font-black text-lg shadow-xl shadow-iogga-accent/20 hover:scale-[1.02] active:scale-95 transition-all">
            Ver ofertas
          </button>
        </div>
      </div>
    </Modal>
  );
}
