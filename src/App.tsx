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
  Trophy
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
import { Plan, Promotion, UserMode, MOCK_PLANS, MOCK_PROMOS, IDEAS, MOCK_GROUPED_PLANS } from './types';
import {
  isFirebaseEnabled,
  watchAuth,
  registerUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  authErrorMessage,
  watchProfile,
  saveProfile,
  watchCollectionDocs,
  saveDocIn,
  deleteDocIn,
  incrementPlanAccepted,
  type AuthUser,
  type UserProfile
} from './lib/firebase';
import { RedeemQRModal, ValidateCodeModal } from './components/qr';
import { pickImage } from './lib/images';

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
      case 'no-money': return 'Sin dinero';
      default: return budget;
    }
  };

  const getTransportLabel = (transport: string) => {
    switch (transport) {
      case 'has-transport': return 'Tengo transporte';
      case 'each-arrives': return 'Cada quien llega';
      case 'no-transport': return 'Sin transporte';
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

export default function App() {
  const [isIntro, setIsIntro] = useState(true);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [isWiggleMode, setIsWiggleMode] = useState(false);
  const [showEditBusinessProfile, setShowEditBusinessProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: 'La Cabalita',
    bio: 'El mejor café artesanal y repostería fina en un ambiente acogedor.',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    location: 'Av. Reforma 450',
    phone: '+52 81 1234 5678',
    email: 'hola@lacabalita.com'
  });
  const [mode, setMode] = useState<UserMode>('person');
  const [activeTab, setActiveTab] = useState('home');
  // Con Firebase conectado la app inicia EN BLANCO y se llena con datos reales
  // de los usuarios en tiempo real. Sin Firebase, usa datos de ejemplo.
  const [plans, setPlans] = useState<Plan[]>(isFirebaseEnabled ? [] : MOCK_PLANS);
  const [promos, setPromos] = useState<Promotion[]>(isFirebaseEnabled ? [] : MOCK_PROMOS);

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    const unsubPlans = watchCollectionDocs<Plan>('plans', setPlans);
    const unsubPromos = watchCollectionDocs<Promotion>('promos', setPromos);
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
  const [selectedUserProfile, setSelectedUserProfile] = useState<Plan | null>(null);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<Promotion | null>(null);

  // Match / Coincidence Engine States
  const [selectedPromoForMatches, setSelectedPromoForMatches] = useState<Promotion | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [lastPublishedPlan, setLastPublishedPlan] = useState<Plan | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [betaMessage, setBetaMessage] = useState({ title: '', desc: '' });

  // Custom alert trigger
  const triggerBeta = (title: string, desc: string) => {
    setBetaMessage({ title, desc });
    setShowBetaModal(true);
  };

  // Auth & Business States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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

  // Link directo a WhatsApp (México +52 por defecto si dan 10 dígitos)
  const waLink = (phone: string, text: string) => {
    const digits = phone.replace(/\D/g, '');
    const full = digits.length === 10 ? `52${digits}` : digits;
    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
  };
  // Al abrir "Editar Perfil", precargar lo que ya tiene guardado
  useEffect(() => {
    if (showEditProfile) {
      setEditName(userProfile.name || currentUser?.name || '');
      setEditBio(userProfile.bio || '');
      setEditLocation(userProfile.location || '');
      setEditPhoto(userProfile.photoURL || '');
      setEditWhatsapp(userProfile.whatsapp || '');
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

  // Mantener la sesión iniciada (Firebase recuerda al usuario entre visitas)
  useEffect(() => {
    const unsubscribe = watchAuth(user => {
      setCurrentUser(user);
      if (user) setIsLoggedIn(true);
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

  // ¿Este plan es mío? (con Firebase: por dueño; en demo: el usuario de ejemplo)
  const isMyPlan = (p: Plan) => (p.uid ? p.uid === currentUser?.uid : p.userName === 'Eduardo');

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
  const getMatchingPlansForPlan = (targetPlan: Plan) => {
    if (!targetPlan || !targetPlan.activity) return [];
    const queryWords = targetPlan.activity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
    return plans.filter(p => {
      if (p.id === targetPlan.id) return false;
      const activityNorm = p.activity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const words = activityNorm.split(/\s+/).filter(w => w.length > 2);
      const sharesWord = words.some(w => queryWords.includes(w) || targetPlan.activity.toLowerCase().includes(w));
      const sharesTag = p.tags.some(t => targetPlan.tags.includes(t) || targetPlan.activity.toLowerCase().includes(t.toLowerCase()));
      return sharesWord || sharesTag;
    });
  };

  const getMatchingPromosForPlan = (targetPlan: Plan) => {
    if (!targetPlan || !targetPlan.activity) return [];
    const queryWords = targetPlan.activity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
    return promos.filter(pr => {
      const titleNorm = pr.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const titleWords = titleNorm.split(/\s+/).filter(w => w.length > 2);
      const sharesTitleWord = titleWords.some(w => queryWords.includes(w) || targetPlan.activity.toLowerCase().includes(w));
      const sharesTag = pr.tags.some(t => targetPlan.tags.includes(t) || targetPlan.activity.toLowerCase().includes(t.toLowerCase()) || pr.title.toLowerCase().includes(t.toLowerCase()));
      return sharesTitleWord || sharesTag;
    });
  };

  const getMatchingPlansForPromo = (targetPromo: Promotion) => {
    if (!targetPromo || !targetPromo.title) return [];
    const prWords = targetPromo.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
    return plans.filter(p => {
      const activityNorm = p.activity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const pWords = activityNorm.split(/\s+/).filter(w => w.length > 2);
      const sharesWord = pWords.some(w => prWords.includes(w) || targetPromo.title.toLowerCase().includes(w));
      const sharesTag = p.tags.some(t => targetPromo.tags.includes(t) || targetPromo.title.toLowerCase().includes(t.toLowerCase()) || p.activity.toLowerCase().includes(t.toLowerCase()));
      return sharesWord || sharesTag;
    });
  };

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(true);
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
    const budgetText = plan.budget === 'invites' ? 'él invita' : plan.budget === 'split' ? 'cada quien paga' : 'sin costo';
    const transportText = plan.transport === 'has-transport' ? 'puede pasar por ti' : plan.transport === 'each-arrives' ? 'cada quien llega' : 'busca ride';
    const budgetAmountText = plan.budgetAmount ? ` ($${plan.budgetAmount})` : '';
    
    return `${plan.userName} quiere ${plan.activity} de ${plan.startTime} a ${plan.endTime}, en ${plan.location}, ${budgetText}${budgetAmountText} y ${transportText}.`;
  };

  useEffect(() => {
    const updateIdeas = () => {
      const shuffled = [...IDEAS].sort(() => 0.5 - Math.random());
      setVisibleIdeas(shuffled.slice(0, 12));
    };
    updateIdeas();
    const interval = setInterval(updateIdeas, 6000);
    return () => clearInterval(interval);
  }, []);

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

  const handlePublishPlan = () => {
    // Momento clave: publicar requiere cuenta (estilo TikTok: explorar es libre)
    if (isFirebaseEnabled && !isLoggedIn) {
      setLoginActionToResume(() => handlePublishPlan);
      setShowLoginModal(true);
      return;
    }
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
        uid: currentUser?.uid,
        whatsapp: userProfile.whatsapp || undefined,
        userName: currentUser?.name || 'Eduardo',
        userAvatar: userProfile.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        activity: newPlan.activity || 'Plan sin nombre',
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
        tags: (newPlan.activity || '').toLowerCase().split(' ')
      };
      void saveDocIn('plans', plan.id, plan);
      setPlans([plan, ...plans]);
      setLastPublishedPlan(plan);
      setShowMatchCelebration(true);
    }
    setShowCreatePlan(false);
    setCurrentPlanStep(0);
    setActiveTab('active'); // Switch to active plans so they see it there too!
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

  const handlePublishPromo = () => {
    // Momento clave: publicar una oferta requiere cuenta
    if (isFirebaseEnabled && !isLoggedIn) {
      setLoginActionToResume(() => handlePublishPromo);
      setShowLoginModal(true);
      return;
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
        uid: currentUser?.uid,
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
      setSelectedPromoForMatches(promo); // Show matches immediately
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
    setActiveTab('active');
  };

  const handleStart = () => {
    // Estilo TikTok: entrar y explorar es libre, sin pedir cuenta.
    // El login solo aparece en momentos clave (publicar, aceptar, canjear).
    setIsIntro(false);
    setShowCreatePlan(true);
    setActiveTab('search');
  };

  const handleSkipIntro = () => {
    // Continue directly as guest (not logged in)
    setIsLoggedIn(false);
    setIsIntro(false);
    setActiveTab('search');
  };

  const handleAcceptPlan = (id: string) => {
    // Momento clave: aceptar un plan requiere cuenta (explorar sigue siendo libre)
    ensureLoggedIn(() => {
      setAcceptedPlanIds(prev => (prev.includes(id) ? prev : [...prev, id]));
      void incrementPlanAccepted(id);
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

  const toggleMode = (newMode: UserMode) => {
    if (newMode === 'business' && !hasBusiness) {
      triggerBeta("Función Inhabilitada", "La sección de negocios está inhabilitada porque seleccionaste 'No tengo negocio' en tu perfil.");
      return;
    }
    setMode(newMode);
    setShowModeMenu(false);
    if (newMode === 'business') {
      setActiveTab('analytics');
    } else {
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-900">
      <div className={`app-container transition-all duration-700 ${isIntro ? 'bg-zinc-950' : (mode === 'person' ? 'bg-indigo-950' : 'bg-teal-950')} flex flex-col relative`}>
        {isIntro ? (
          <div className="flex flex-col items-center justify-center p-8 text-center relative overflow-hidden h-full">
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
                  <span className="text-[10px] font-black text-iogga-primary uppercase tracking-[0.2em]">Sugerencias Inteligentes</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Escribe tu plan..." 
                  value={newPlan.activity || ''}
                  onChange={e => setNewPlan({...newPlan, activity: e.target.value})}
                  className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium transition-all"
                />
                <div className="mt-8 grid grid-cols-2 gap-3 min-h-[280px]">
                  <AnimatePresence mode="popLayout">
                    {visibleIdeas.slice(0, 6).map((idea, index) => (
                      <motion.button
                        key={idea}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0],
                          scale: [0.9, 1, 1, 0.9]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          delay: index * 0.7,
                          times: [0, 0.2, 0.8, 1],
                          ease: "easeInOut"
                        }}
                        onClick={() => setNewPlan({...newPlan, activity: idea})}
                        className={`text-lg font-black px-4 py-6 rounded-[32px] border transition-all flex items-center justify-center text-center leading-tight ${newPlan.activity === idea ? 'bg-iogga-primary text-white border-iogga-primary shadow-xl shadow-iogga-primary/20 scale-105' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                      >
                        {idea}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
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
                {mode === 'person' ? <User size={20} strokeWidth={2.5} className="shrink-0" /> : <Store size={20} strokeWidth={2.5} className="shrink-0" />}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowModeMenu(!showModeMenu)}
                  className="flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-2xl font-bold text-white tracking-tighter hover:opacity-80 transition-opacity">iogga</span>
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
                onClick={() => setShowValidateModal(true)}
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
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-zinc-900"></span>
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
                          Invitaciones <span className="text-xs font-bold bg-iogga-primary/20 text-iogga-primary px-2 py-1 rounded-full">{plans.filter(p => p.isInvitation && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id)).length}</span>
                        </h2>
                        <p className="text-xs text-zinc-500">Tus planes y propuestas</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-xs font-bold text-iogga-primary flex items-center gap-1 bg-iogga-primary/10 px-3 py-1.5 rounded-xl border border-iogga-primary/20 hover:scale-105 transition-transform">
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
                          .filter(p => p.isInvitation && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id))
                          .filter(p => p.activity.toLowerCase().includes(searchQuery.toLowerCase()) || p.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(plan => (
                            <div key={plan.id} className="space-y-2">
                              <motion.div 
                                layout
                                onClick={() => setSelectedInvitationId(selectedInvitationId === plan.id ? null : plan.id)}
                                className={`p-4 rounded-[32px] border transition-all cursor-pointer ${selectedInvitationId === plan.id ? 'bg-zinc-900 border-iogga-primary shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                              >
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
                        
                        {plans.filter(p => p.isInvitation && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id)).length === 0 && (
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
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                  <Users size={10} />
                                  {promo.realTimeSearchers} Interesados
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                  <QrCode size={10} />
                                  {promo.qrScans} scans
                                </div>
                              </div>
                            </div>
                            <button className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
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
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${searchFilter === 'promos' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500'}`}
                      >
                        Ofertas
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
                        {['Todos', 'Café', 'Cine', 'Deporte', 'Fiesta', 'Comida'].map(cat => (
                          <button key={cat} className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 text-white/40 border border-white/10 whitespace-nowrap">
                            {cat}
                          </button>
                        ))}
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
                          <GroupedPlanCard key={group.id} group={group} rank={index + 1} />
                        ))}
                    </motion.div>
                  ) : (
                    <>
                      {searchFilter === 'plans' ? (
                        <div className="grid grid-cols-2 gap-4">
                          {plans.filter(p => searchSubFilter === 'public' ? p.isPublic : !p.isPublic).length === 0 && (
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
                            .filter(p => searchSubFilter === 'public' ? p.isPublic : !p.isPublic)
                            .map((plan, index) => (
                              <motion.div 
                                key={plan.id} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedPlanForDetails(plan)}
                                className="relative aspect-[4/5] rounded-[32px] overflow-hidden group shadow-2xl cursor-pointer border border-white/10"
                              >
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
                        <div className="grid grid-cols-2 gap-3">
                          {promos.map(promo => (
                            <PromoCard 
                              key={promo.id} 
                              promo={promo} 
                              onClick={() => setSelectedPromo(promo)} 
                              onBusinessClick={() => setSelectedBusinessProfile(promo)}
                            />
                          ))}
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
                {mode === 'person' ? (
                  <div className="space-y-4">
                    {plans.filter(p => isMyPlan(p)).map(plan => (
                      <div key={plan.id} className="space-y-2">
                        <div 
                          onClick={() => setSelectedPlanForDetails(plan)}
                          className="w-full text-left p-0 rounded-[32px] bg-zinc-900 border border-white/10 text-white shadow-xl relative overflow-hidden transition-transform active:scale-[0.98] group cursor-pointer"
                        >
                          <div className="h-48 w-full relative">
                            <img 
                              src={plan.image || `https://picsum.photos/seed/${plan.id}/800/400`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                              <span className="px-3 py-1 bg-iogga-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Tu Plan Activo</span>
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
                                  handleDeletePlan(plan.id);
                                }}
                                className="p-2.5 bg-red-500/20 backdrop-blur-md text-red-200 rounded-full hover:bg-red-500/40 transition-colors border border-red-500/20"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="p-6 relative z-10">
                            {/* Exciting accepted notification banner */}
                            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                              <Sparkles size={16} className="animate-bounce text-emerald-400 shrink-0" />
                              <p className="text-xs font-black uppercase tracking-wider font-sans leading-tight">
                                {plan.acceptedCount > 0 
                                  ? `¡Buenas noticias! ${plan.acceptedCount} ${plan.acceptedCount === 1 ? 'persona ha' : 'personas han'} aceptado tu plan` 
                                  : '¡Tu plan está publicado! Esperando que se unan amigos'}
                              </p>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-2xl font-black mb-1">{plan.activity}</h3>
                                <p className="text-xs text-zinc-400 font-medium italic line-clamp-1">"{getPlanDescription(plan)}"</p>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-xl font-black text-iogga-primary">{plan.acceptedCount}</span>
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Unidos</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPlan(plan);
                                }}
                                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                              >
                                <Edit3 size={14} />
                                Editar Plan
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerOfertas(plan);
                                }}
                                className="flex-[2] py-3.5 bg-iogga-accent/20 hover:bg-iogga-accent/30 text-iogga-accent rounded-2xl font-black text-xs text-center border border-iogga-accent/20 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                              >
                                <LayoutGrid size={14} />
                                Ver ofertas para este plan
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
                                }}
                                className="p-3.5 bg-iogga-primary/10 text-iogga-primary rounded-2xl border border-iogga-primary/20 flex items-center justify-center hover:bg-iogga-primary/20 transition-all"
                              >
                                <ChevronDown size={16} className={`transition-transform duration-500 ${expandedPlanId === plan.id ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
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
                                  {promos.filter(pr => pr.tags.some(t => plan.tags.includes(t))).map(promo => (
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
                                  {promos.filter(pr => pr.tags.some(t => plan.tags.includes(t))).length === 0 && (
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
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {promos.filter(p => (p.uid ? p.uid === currentUser?.uid : true)).map((promo, idx) => (
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
                            
                            {/* Top Left: View as Customer */}
                            <div className="absolute top-4 left-4 z-10">
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
                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-8">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Interesados</span>
                                <div className="flex items-center gap-2">
                                  <Users size={14} className="text-iogga-primary" />
                                  <span className="text-xl font-black text-white">{promo.realTimeSearchers}</span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Scans</span>
                                <div className="flex items-center gap-2">
                                  <QrCode size={14} className="text-iogga-accent" />
                                  <span className="text-xl font-black text-white">{promo.qrScans}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPromoForMatches(promo);
                            }}
                            className="w-full mt-4 py-3.5 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 active:scale-[0.98] transition-all text-xs font-black uppercase rounded-2xl border border-teal-500/20 flex items-center justify-center gap-2"
                          >
                            <Sparkles size={12} className="animate-pulse" />
                            Ver planes coincidentes ({getMatchingPlansForPromo(promo).length} en vivo)
                          </button>
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

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-black text-sm truncate ${notif.isRead ? 'text-zinc-400' : 'text-white'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-bold shrink-0">{notif.time}</span>
                          </div>
                          <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            {notif.message}
                          </p>
                          
                          {!notif.isRead && (
                            <div className="mt-3 flex gap-2">
                              <button className="px-3 py-1.5 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/20 transition-all">
                                Ver detalle
                              </button>
                              {notif.category === 'plan' && (
                                <button className="px-3 py-1.5 bg-iogga-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-iogga-primary/20">
                                  Aceptar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <button className="absolute top-4 right-4 p-1.5 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
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
                  <button className="px-6 py-3 bg-white text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
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
                    
                    <div className="p-6 rounded-[32px] bg-iogga-accent text-white shadow-xl shadow-iogga-accent/20">
                      <div className="flex items-center gap-4">
                        <img src={selectedProductAnalytics.image} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
                        <div>
                          <h3 className="font-bold">{selectedProductAnalytics.title}</h3>
                          <p className="text-xs opacity-80">Analítica de producto</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-3 rounded-2xl bg-white/10">
                          <p className="text-xs opacity-70">Ventas</p>
                          <p className="text-xl font-bold">${selectedProductAnalytics.totalEarnings}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/10">
                          <p className="text-xs opacity-70">Conversión</p>
                          <p className="text-xl font-bold">{selectedProductAnalytics.qrScans > 0 ? Math.round((selectedProductAnalytics.salesCount / selectedProductAnalytics.qrScans) * 100) : 0}%</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/10">
                          <p className="text-xs opacity-70">QRs Escaneados</p>
                          <p className="text-xl font-bold">{selectedProductAnalytics.qrScans || 12}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/10">
                          <p className="text-xs opacity-70">Clientes Totales</p>
                          <p className="text-xl font-bold">{selectedProductAnalytics.salesCount || 5}</p>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
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
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_SALES_DATA}>
                              <defs>
                                <linearGradient id="colorSalesProd" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#71717a', fontSize: 10 }}
                              />
                              <YAxis hide />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                itemStyle={{ fontSize: '12px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#14b8a6" 
                                fillOpacity={1} 
                                fill="url(#colorSalesProd)" 
                                strokeWidth={3}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="trend" 
                                stroke="#ffffff30" 
                                strokeDasharray="5 5" 
                                dot={false}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-3xl bg-white text-zinc-900 space-y-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Código QR de Producto</p>
                        <div className="flex justify-center py-2">
                          <div className="p-4 bg-zinc-100 rounded-2xl">
                            <QrCode size={140} className="text-zinc-900" />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500">Este es el código que tus clientes escanean para obtener la oferta.</p>
                      </div>
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
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_SALES_DATA}>
                              <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#71717a', fontSize: 10 }}
                              />
                              <YAxis hide />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                itemStyle={{ fontSize: '12px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#14b8a6" 
                                fillOpacity={1} 
                                fill="url(#colorSales)" 
                                strokeWidth={3}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="trend" 
                                stroke="#ffffff30" 
                                strokeDasharray="5 5" 
                                dot={false}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
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
                        <button className="text-xs font-bold text-iogga-accent uppercase tracking-widest">Ver todos</button>
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
                      <button className="w-full py-3 bg-indigo-500 text-white rounded-xl text-xs font-bold">
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
                    <div className="h-40 w-full relative">
                      <img src={businessProfile.cover} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40"></div>
                      <div className="absolute -bottom-10 left-6">
                        <div className="relative">
                          <img src={businessProfile.logo} className="w-20 h-20 rounded-2xl border-4 border-zinc-950 shadow-xl object-cover" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-iogga-accent border-2 border-zinc-950 rounded-full flex items-center justify-center shadow-lg">
                            <Store size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-12 px-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                              {businessProfile.name}
                              <Store size={20} className="text-teal-400/60" />
                            </h2>
                            <div className="flex items-center gap-0.5 text-yellow-500">
                              <Star size={14} fill="currentColor" />
                              <Star size={14} fill="currentColor" />
                              <Star size={14} fill="currentColor" />
                              <Star size={14} fill="currentColor" />
                              <Star size={14} fill="currentColor" />
                            </div>
                          </div>
                          <p className="text-zinc-400 text-sm">@{businessProfile.name.toLowerCase().replace(/\s+/g, '_')} • Cafetería</p>
                        </div>
                        <button 
                          onClick={() => setShowEditBusinessProfile(true)}
                          className="p-3 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/10"
                        >
                          <Edit3 size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {businessProfile.bio}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1"><MapPin size={14} /> {businessProfile.location}</div>
                        <div className="flex items-center gap-1 text-iogga-accent"><MessageSquare size={14} /> {businessProfile.phone}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80" className="w-24 h-24 rounded-full border-4 border-zinc-900 shadow-xl" referrerPolicy="no-referrer" />
                      <button className="absolute bottom-0 right-0 p-2 bg-zinc-800 rounded-full shadow-lg text-iogga-primary border border-white/10">
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          {currentUser?.name || 'Eduardo Hernández'}
                          <User size={20} className="text-indigo-400/60" />
                        </h2>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          <Star size={14} fill="currentColor" />
                          <Star size={14} fill="currentColor" />
                          <Star size={14} fill="currentColor" />
                          <Star size={14} fill="currentColor" />
                          <Star size={14} className="opacity-30" />
                        </div>
                      </div>
                      <p className="text-zinc-500 text-sm">{currentUser?.email || '@edu_hdz'} • {userProfile.location || 'Chihuahua, MX'}</p>
                    </div>
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

                <div className="p-6 space-y-3">
                  <section className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Análisis de Perfil IA</h3>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Tu perfil tiene un <span className="text-indigo-400 font-bold">85% de compatibilidad</span> con planes de aventura y café. ¡Sigue así!
                    </p>
                    <button className="w-full py-2 bg-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-bold border border-indigo-500/30">
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
                        <p className="font-bold text-white text-sm">Gestionar Negocio Comercial</p>
                        <p className="text-[10px] text-zinc-500 leading-tight">Desmarca si no tienes un local en Chihuahua</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!hasBusiness} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setHasBusiness(!val);
                          if (val) {
                            setMode('person'); // Force user mode back
                            triggerBeta("Modo Negocio Inhabilitado", "Has configurado tu perfil como 'Sin Negocio'. Las funciones comerciales de IOGGA han sido inhabilitadas temporalmente.");
                          } else {
                            triggerBeta("Modo Negocio Habilitado", "Has habilitado las funciones comerciales de IOGGA Chihuahua para locales.");
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-iogga-accent after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-iogga-accent/20"></div>
                      <span className="ml-2 text-xs font-bold text-zinc-400 select-none uppercase tracking-wider">{!hasBusiness ? 'No tengo' : 'Sí tengo'}</span>
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
                    <ProfileButton icon={<Wallet size={20} />} label="Billetera" />
                    <ProfileButton icon={<Users size={20} />} label="Amigos" />
                    <ProfileButton icon={<TrendingUp size={20} />} label="Actividad" />
                    <ProfileButton icon={<Bell size={20} />} label="Ajustes" />
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

                  {/* Para Ti Section in Profile */}
                  <div className="space-y-6 pt-4">
                    <h3 className="text-lg font-bold text-white px-2">Para ti</h3>
                    
                    {/* Sub-section: Planes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <p className="text-xs font-bold text-iogga-primary uppercase tracking-widest">Planes y Compromisos</p>
                        <span className="text-xs text-zinc-500">{acceptedPlanIds.length} aceptados</span>
                      </div>
                      <div className="space-y-3">
                        {/* Invitations (Not yet accepted/ignored) */}
                        {plans.filter(p => !isMyPlan(p) && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id)).slice(0, 2).map(plan => (
                          <div key={plan.id} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between opacity-60">
                            <div className="flex items-center gap-3">
                              <img src={plan.userAvatar} className="w-8 h-8 rounded-full" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-white">Invitación de {plan.userName}</p>
                                  <div className="flex items-center gap-0.5 text-yellow-500">
                                    <Star size={8} fill="currentColor" />
                                    <Star size={8} fill="currentColor" />
                                    <Star size={8} fill="currentColor" />
                                    <Star size={8} fill="currentColor" />
                                    <Star size={8} className="opacity-30" />
                                  </div>
                                </div>
                                <p className="text-xs text-zinc-500">{plan.activity}</p>
                              </div>
                            </div>
                            <button onClick={() => handleAcceptPlan(plan.id)} className="p-2 bg-iogga-primary/20 text-iogga-primary rounded-full">
                              <Plus size={16} />
                            </button>
                          </div>
                        ))}

                        {/* Accepted Plans */}
                        {plans.filter(p => acceptedPlanIds.includes(p.id)).map(plan => (
                          <div key={plan.id} className="p-4 rounded-3xl bg-iogga-primary/10 border border-iogga-primary/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                <CheckCircle2 size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{plan.activity}</p>
                                <p className="text-xs text-zinc-500">{plan.startTime} • {plan.location}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-green-500 uppercase">Aceptada</span>
                              <ChevronRight size={16} className="text-zinc-600" />
                            </div>
                          </div>
                        ))}
                        {acceptedPlanIds.length === 0 && plans.filter(p => !isMyPlan(p) && !acceptedPlanIds.includes(p.id) && !ignoredPlanIds.includes(p.id)).length === 0 && (
                          <p className="text-xs text-zinc-500 px-2 italic text-center">No hay planes pendientes...</p>
                        )}
                      </div>
                    </div>

                    {/* Sub-section: Ofertas */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-iogga-accent uppercase tracking-widest px-2">Ofertas Personalizadas</p>
                      <div className="grid grid-cols-2 gap-3">
                        {promos.filter(p => {
                          const userPlans = plans.filter(pl => isMyPlan(pl));
                          const userTags = userPlans.flatMap(pl => pl.tags);
                          return p.tags.some(t => userTags.includes(t)) || userPlans.length === 0;
                        }).slice(0, 4).map(promo => (
                          <PromoCard key={promo.id} promo={promo} onClick={() => setSelectedPromo(promo)} />
                        ))}
                      </div>
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
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
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
                onClick={() => setShowValidateModal(true)}
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
                    <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80" className="w-7 h-7 rounded-lg border border-white/20 object-cover" />
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
                setShowCreatePlan(false);
                setEditingPlanId(null);
                setCurrentPlanStep(0);
                setNewPlan({
                  activity: '',
                  startTime: '09:00',
                  endTime: '12:00',
                  location: '',
                  budget: 'split',
                  budgetAmount: '',
                  transport: 'each-arrives',
                  transportNote: '',
                  guests: 'public',
                  isPublic: true,
                  image: undefined
                });
              }} 
              onBack={currentPlanStep > 0 ? () => setCurrentPlanStep(currentPlanStep - 1) : undefined}
              title={editingPlanId ? "Editar Plan" : "Crear Plan"}
            >
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
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-bold text-white block">¿Qué quieres hacer?</label>
                        <button 
                          onClick={() => {
                            const randomIdea = IDEAS[Math.floor(Math.random() * IDEAS.length)];
                            setNewPlan({...newPlan, activity: randomIdea});
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-iogga-primary uppercase tracking-widest bg-iogga-primary/10 px-3 py-1.5 rounded-full border border-iogga-primary/20"
                        >
                          <Sparkles size={12} />
                          Magia IA
                        </button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Ej. Ir por un café, ir al cine..." 
                        className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium"
                        value={newPlan.activity || ''}
                        onChange={e => setNewPlan({...newPlan, activity: e.target.value})}
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {IDEAS.slice(0, 8).map(sug => (
                          <button 
                            key={sug} 
                            onClick={() => setNewPlan({...newPlan, activity: sug})}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${newPlan.activity === sug ? 'bg-iogga-primary text-white border-iogga-primary' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'}`}
                          >
                            {sug}
                          </button>
                        ))}
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
                        <label className="text-lg font-bold text-white block">¿A qué hora?</label>
                        <button 
                          onClick={() => {
                            setNewPlan({...newPlan, startTime: "18:00", endTime: "20:00"});
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-iogga-primary uppercase tracking-widest bg-iogga-primary/10 px-3 py-1.5 rounded-full border border-iogga-primary/20"
                        >
                          <Sparkles size={12} />
                          Optimizar IA
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 tracking-wider"><Clock size={12}/> Inicio</label>
                          <input type="time" className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white text-base font-medium" value={newPlan.startTime || ''} onChange={e => setNewPlan({...newPlan, startTime: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 tracking-wider"><Clock size={12}/> Fin</label>
                          <input type="time" className="w-full h-16 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white text-base font-medium" value={newPlan.endTime || ''} onChange={e => setNewPlan({...newPlan, endTime: e.target.value})} />
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
                      <label className="text-lg font-bold text-white block">¿Cómo pagamos?</label>
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
                          <p className="font-bold">Sin dinero</p>
                          <p className="text-xs opacity-60">Plan gratuito o sin costo</p>
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Presupuesto exacto (opcional)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            className="w-full h-16 pl-12 pr-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium"
                            value={newPlan.budgetAmount || ''}
                            onChange={e => setNewPlan({...newPlan, budgetAmount: e.target.value})}
                          />
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
                      <label className="text-lg font-bold text-white block">¿Cómo llegamos?</label>
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
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Notas de transporte</label>
                        <textarea 
                          placeholder={
                            newPlan.transport === 'has-transport' ? "Ej. Yo paso por todos o cabemos 3..." :
                            newPlan.transport === 'no-transport' ? "Ej. Yo pongo para la gas..." :
                            "Ej. Nos vemos en la entrada..."
                          }
                          className="w-full h-24 px-6 py-4 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium resize-none"
                          value={newPlan.transportNote || ''}
                          onChange={e => setNewPlan({...newPlan, transportNote: e.target.value})}
                        />
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
                      <label className="text-lg font-bold text-white block">¿Dónde nos vemos?</label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                          type="text" 
                          placeholder="Ej. Centro, Plaza, Starbucks..." 
                          className="w-full h-16 pl-12 pr-6 rounded-[24px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-base font-medium"
                          value={newPlan.location || ''}
                          onChange={e => setNewPlan({...newPlan, location: e.target.value})}
                          autoFocus
                        />
                      </div>
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
                      <label className="text-lg font-bold text-white block">¿Quién puede verlo?</label>
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

                      {(!newPlan.isPublic || newPlan.guests === 'groups') && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                        >
                          <p className="text-xs font-bold text-iogga-primary uppercase tracking-widest">
                            {newPlan.guests === 'groups' ? 'Seleccionar Grupos' : 'Invitar Amigos'}
                          </p>
                          <div className="space-y-3">
                            {(newPlan.guests === 'groups' ? ['Gym', 'Trabajo', 'Uni', 'Viajes'] : ['Ana', 'Carlos', 'Sofía', 'Mejores Amigos', 'Familia']).map(name => (
                              <div key={name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                    {name[0]}
                                  </div>
                                  <span className="text-sm text-white/80">{name}</span>
                                </div>
                                <input type="checkbox" className="accent-iogga-primary w-4 h-4 rounded" />
                              </div>
                            ))}
                          </div>
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
                      <p className="text-xs text-zinc-500 text-center italic">Sube una foto real desde tu galería o cámara</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-4">
                  {currentPlanStep < 6 ? (
                    <button 
                      onClick={() => setCurrentPlanStep(currentPlanStep + 1)}
                      disabled={currentPlanStep === 0 && !newPlan.activity}
                      className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-base shadow-xl shadow-iogga-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button 
                      onClick={handlePublishPlan}
                      className="w-full py-5 bg-iogga-primary text-white rounded-[24px] font-black text-base shadow-xl shadow-iogga-primary/20 active:scale-95 transition-transform"
                    >
                      {editingPlanId ? 'Guardar Cambios' : 'Publicar Plan'}
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
            }} title={editingPromoId ? "Editar Producto" : "Publicar Producto"}>
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
                  {editingPromoId ? 'Guardar Cambios' : 'Publicar Producto'}
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
                    <img src={editPhoto || userProfile.photoURL || AVATAR_PRESETS[0]} className="w-24 h-24 rounded-full border-4 border-iogga-primary/20 shadow-xl object-cover" referrerPolicy="no-referrer" />
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
                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Imágenes del Negocio</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setBusinessProfile({...businessProfile, cover: `https://images.unsplash.com/photo-1501339819398-ee49a94b0b61?auto=format&fit=crop&q=80&w=800`})}
                      className="aspect-video rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group"
                    >
                      <img src={businessProfile.cover} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Portada</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setBusinessProfile({...businessProfile, logo: `https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200`})}
                      className="aspect-square rounded-full bg-white/5 border border-white/10 overflow-hidden relative group w-24 mx-auto"
                    >
                      <img src={businessProfile.logo} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest text-center">Cambiar Logo</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Información Básica</label>
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
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Contacto</label>
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
                    value={businessProfile.address || ''}
                    onChange={e => setBusinessProfile({...businessProfile, address: e.target.value})}
                    placeholder="Dirección"
                    className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-iogga-accent outline-none"
                  />
                </div>

                <button 
                  onClick={() => setShowEditBusinessProfile(false)}
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
                    "{getPlanDescription(selectedPlanForDetails)}"
                  </p>

                  {renderPlanTechnicalDetails(selectedPlanForDetails)}

                  {selectedPlanForDetails.transportNote && (
                    <div className="p-4 rounded-2xl bg-iogga-primary/5 border border-iogga-primary/10 italic text-sm text-zinc-400">
                      "{selectedPlanForDetails.transportNote}"
                    </div>
                  )}
                </div>

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
                  {selectedPlanForDetails.whatsapp ? (
                    <a
                      href={waLink(selectedPlanForDetails.whatsapp, `¡Hola ${selectedPlanForDetails.userName}! Acepté tu plan "${selectedPlanForDetails.activity}" en IOGGA. ¿Sigue en pie? 🙌`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        handleAcceptPlan(selectedPlanForDetails.id);
                        setSelectedPlanForDetails(null);
                      }}
                      className="flex-[2] py-4 rounded-2xl bg-green-500 text-white font-black shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-center flex items-center justify-center text-xs uppercase tracking-wider"
                    >
                      Aceptar y Mandar WhatsApp
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        handleAcceptPlan(selectedPlanForDetails.id);
                        setSelectedPlanForDetails(null);
                      }}
                      className="flex-[2] py-4 rounded-2xl bg-iogga-primary text-white font-black shadow-lg shadow-iogga-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-center flex items-center justify-center text-xs uppercase tracking-wider"
                    >
                      Aceptar Plan
                    </button>
                  )}
                </div>
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
                            <span className="text-xs font-bold">{selectedPromo.businessStats?.rating || '4.8'}</span>
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

                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <button
                    onClick={() => ensureLoggedIn(() => setRedeemPromo(selectedPromo))}
                    className="p-6 bg-white rounded-[40px] shadow-2xl shadow-white/5 relative group active:scale-95 transition-transform"
                  >
                    <QrCode size={160} className="text-zinc-900" />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px] cursor-pointer">
                      <span className="text-zinc-900 font-black text-xs uppercase tracking-widest">Generar mi QR</span>
                    </div>
                  </button>
                  <button
                    onClick={() => ensureLoggedIn(() => setRedeemPromo(selectedPromo))}
                    className="w-full py-4 bg-white text-zinc-900 rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Generar mi código de canje
                  </button>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center">
                    Presenta este código en el local
                  </p>
                </div>
                
                {/* Actions */}
                <div className="grid grid-cols-1 gap-3">
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
                  <button className="w-full py-5 bg-white/5 text-white rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10">
                    <Download size={20} />
                    <span>Guardar en Galería</span>
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {showSettingsMenu && (
            <Modal onClose={() => setShowSettingsMenu(false)} title="Configuración">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Cuenta y Seguridad</p>
                  <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                    <SettingsItem 
                      icon={<User size={18} />} 
                      label="Editar Perfil" 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowEditProfile(true);
                      }}
                    />
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
                        triggerBeta("Centro de Ayuda", "Contacta a soporte@iogga.com si requieres asistencia técnica adicional durante tus pruebas de MVP.");
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

                <button
                  onClick={() => {
                    logoutUser();
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                    setShowSettingsMenu(false);
                    setIsIntro(true);
                  }}
                  className="w-full p-5 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center gap-2 font-bold border border-red-500/20 active:scale-95 transition-transform"
                >
                  <LogOut size={20} />
                  Cerrar Sesión
                </button>
                
                <p className="text-center text-[10px] text-zinc-600 font-medium">iogga v2.4.0 • Hecho con amor en Chihuahua</p>
              </div>
            </Modal>
          )}

          {selectedUserProfile && (
            <UserProfileModal 
              user={selectedUserProfile} 
              onClose={() => setSelectedUserProfile(null)} 
            />
          )}

          {selectedBusinessProfile && (
            <BusinessProfileModal 
              business={selectedBusinessProfile} 
              onClose={() => setSelectedBusinessProfile(null)} 
              appMode={mode}
              onStartBusinessFlow={() => {
                setMode('business');
                setActiveTab('active');
                setShowCreatePromo(true);
              }}
            />
          )}

          {/* Coincidence / Match Celebration Modal for Users */}
          {showMatchCelebration && lastPublishedPlan && (
            <Modal onClose={() => setShowMatchCelebration(false)} title="¡Plan Publicado con Éxito!">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-4 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 mb-2">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="font-lexend font-black text-xl text-white tracking-tight uppercase">¡Publicado!</h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">Tu plan ya está activo y listo para ser compartido con tus amigos y la comunidad.</p>
                </div>

                {/* Newly Published Plan banner */}
                <div className="p-4 rounded-[28px] bg-white/5 border border-white/10 flex gap-4 items-center">
                  <img src={lastPublishedPlan.image} className="w-14 h-14 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block font-sans">Tu Plan de hoy</span>
                    <h4 className="font-black text-sm text-white truncate uppercase tracking-tight">{lastPublishedPlan.activity}</h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-bold font-sans">@ {lastPublishedPlan.location} • {lastPublishedPlan.startTime}</p>
                  </div>
                </div>

                {/* WhatsApp Text Preview block */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-sans">Texto del mensaje a compartir:</span>
                  <div className="p-4 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs relative italic leading-relaxed">
                    "¡Hola! Mi plan para hoy es: {lastPublishedPlan.activity} a las {lastPublishedPlan.startTime} en {lastPublishedPlan.location}. ¿Te unes? Descubre más aquí en iogga."
                    <div className="mt-3 flex gap-1.5 items-center text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Listo para enviar por WhatsApp
                    </div>
                  </div>
                </div>

                {/* Connection Channel Selector */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-sans font-lexend">¿Por dónde quieres enviar el mensaje?</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setSelectedChannel('whatsapp')}
                      className={`py-3 px-2 rounded-2xl border text-center transition-all ${selectedChannel === 'whatsapp' ? 'bg-emerald-500/20 border-emerald-500 text-white scale-[1.02]' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                    >
                      <p className="font-black text-[10px] uppercase tracking-wider">Solo WhatsApp</p>
                    </button>
                    <button 
                      onClick={() => setSelectedChannel('iogga')}
                      className={`py-3 px-2 rounded-2xl border text-center transition-all ${selectedChannel === 'iogga' ? 'bg-indigo-500/20 border-indigo-500 text-white scale-[1.02]' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                    >
                      <p className="font-black text-[10px] uppercase tracking-wider">Solo IOGGA</p>
                    </button>
                    <button 
                      onClick={() => setSelectedChannel('both')}
                      className={`py-3 px-2 rounded-2xl border text-center transition-all ${selectedChannel === 'both' ? 'bg-iogga-primary/20 border-iogga-primary text-white scale-[1.02]' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                    >
                      <p className="font-black text-[10px] uppercase tracking-wider">Ambos Canales</p>
                    </button>
                  </div>
                </div>

                {/* Section match 1: Matching Users */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Users size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-sans">Coincidencias en la Comunidad ({getMatchingPlansForPlan(lastPublishedPlan).length})</span>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                    {getMatchingPlansForPlan(lastPublishedPlan).map(mUserPlan => (
                      <div key={mUserPlan.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3">
                        <div className="flex gap-3 items-center min-w-0 flex-1">
                          <img src={mUserPlan.userAvatar} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-white block truncate">{mUserPlan.userName}</span>
                            <span className="text-[10px] text-zinc-400 truncate block font-sans">"Planea: {mUserPlan.activity}"</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setShowMatchCelebration(false);
                            setSelectedPlanForDetails(mUserPlan);
                          }}
                          className="px-3 py-1.5 bg-iogga-primary text-white text-[9px] font-black uppercase rounded-xl hover:scale-105 active:scale-95 transition-all text-center min-h-[30px]"
                        >
                          Conectar
                        </button>
                      </div>
                    ))}
                    {getMatchingPlansForPlan(lastPublishedPlan).length === 0 && (
                      <p className="text-[11px] text-zinc-500 italic pl-1 font-sans">Buscando personas con planes similares en Chihuahua...</p>
                    )}
                  </div>
                </div>

                {/* Section match 2: Active Promos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Store size={14} className="text-iogga-accent" />
                    <span className="text-[10px] font-black text-iogga-accent uppercase tracking-widest font-sans">Promos y Patrocinios Coincidentes ({getMatchingPromosForPlan(lastPublishedPlan).length})</span>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                    {getMatchingPromosForPlan(lastPublishedPlan).map(mPromo => (
                      <div key={mPromo.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3">
                        <div className="flex gap-3 items-center min-w-0 flex-1">
                          <img src={mPromo.image} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-white block uppercase truncate">{mPromo.title}</span>
                            <span className="text-[9px] text-iogga-accent font-black uppercase tracking-wider block font-sans">{mPromo.offer}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setShowMatchCelebration(false);
                            setSelectedPromo(mPromo);
                          }}
                          className="px-3 py-1.5 bg-iogga-accent text-zinc-950 text-[9px] font-black uppercase rounded-xl hover:scale-105 active:scale-95 transition-all text-center min-h-[30px]"
                        >
                          Reclamar
                        </button>
                      </div>
                    ))}
                    {getMatchingPromosForPlan(lastPublishedPlan).length === 0 && (
                      <p className="text-[11px] text-zinc-500 italic pl-1 font-sans">Buscando patrocinio de locales para tu plan hoy...</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => {
                      setShowMatchCelebration(false);
                      setActiveTab('active');
                    }}
                    className="flex-1 py-4 bg-white/5 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all text-center min-h-[44px]"
                  >
                    Ver mis planes
                  </button>
                  <button 
                    onClick={() => setShowMatchCelebration(false)}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all text-center min-h-[44px]"
                  >
                    ¡Excelente!
                  </button>
                </div>
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
                  <h3 className="text-md font-black text-white uppercase tracking-tight">Módulo en Beta (PoC)</h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans">
                    {betaMessage.desc || "Esta función de conexión externa se encuentra en producción beta para la validación de la interfaz iogga Chihuahua. El servicio en vivo se activará pronto."}
                  </p>
                </div>
                <button 
                  onClick={() => setShowBetaModal(false)}
                  className="w-full py-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all min-h-[44px]"
                >
                  Volver a Inicio
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
                    {isRegistering ? "Regístrate en IOGGA" : "Bienvenido de vuelta"}
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
                      `Bienvenido${user.name ? `, ${user.name}` : ''} a IOGGA Chihuahua.`
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
                      required
                      placeholder="tu@correo.com" 
                      value={loginEmail || ''}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full h-14 px-5 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-sans">Contraseña</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••" 
                      value={loginPassword || ''}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full h-14 px-5 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-iogga-primary outline-none text-sm font-medium"
                    />
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
                </form>

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs font-bold text-iogga-primary hover:underline transition-all block text-center bg-transparent border-none outline-none cursor-pointer"
                  >
                    {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate gratis"}
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
                          triggerBeta("¡Sesión Iniciada!", `Bienvenido${user.name ? `, ${user.name}` : ''} a IOGGA Chihuahua.`);
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
                  <p><span className="text-white font-bold">IOGGA</span> (en adelante "la Plataforma"), con base en Chihuahua, México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
                  <p><span className="text-white font-bold">Datos que recabamos:</span> nombre, correo electrónico, número de WhatsApp (opcional), fotografía de perfil (opcional), ubicación aproximada y la actividad que publiques en la Plataforma (planes, promociones y canjes).</p>
                  <p><span className="text-white font-bold">Finalidades:</span> crear y administrar tu cuenta; conectar planes personales con promociones comerciales; permitir la validación de códigos de canje entre usuarios y negocios; y mostrar estadísticas de uso a los negocios.</p>
                  <p><span className="text-white font-bold">Compartición:</span> tu nombre y foto son visibles para otros usuarios. Tu número de WhatsApp solo se muestra a quienes interactúan con tus planes, para coordinar directamente. No vendemos tus datos a terceros.</p>
                  <p><span className="text-white font-bold">Derechos ARCO:</span> puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo a <span className="text-white">soporte@iogga.com</span>. También puedes eliminar tu cuenta en cualquier momento.</p>
                  <p><span className="text-white font-bold">Seguridad:</span> los datos se almacenan en la infraestructura de Google Firebase con controles de acceso y cifrado en tránsito.</p>
                  <p className="text-zinc-600">Última actualización: julio de 2026. Este aviso puede actualizarse; los cambios se publicarán en la Plataforma.</p>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                  <p>Al usar <span className="text-white font-bold">IOGGA</span> aceptas estos términos. Si no estás de acuerdo, no uses la Plataforma.</p>
                  <p><span className="text-white font-bold">1. El servicio.</span> IOGGA conecta planes personales con promociones de negocios en tiempo real. IOGGA no es parte de las transacciones entre usuarios y negocios: los precios, la calidad y la entrega de productos o servicios son responsabilidad exclusiva del negocio.</p>
                  <p><span className="text-white font-bold">2. Tu cuenta.</span> Debes ser mayor de 18 años. Eres responsable de la información que publiques y de mantener la confidencialidad de tu acceso.</p>
                  <p><span className="text-white font-bold">3. Códigos de canje.</span> Los códigos QR generados por la Plataforma son personales, válidos por 24 horas y de un solo uso. Su validación es realizada por el negocio correspondiente. IOGGA no garantiza la disponibilidad de una promoción al momento del canje.</p>
                  <p><span className="text-white font-bold">4. Encuentros entre usuarios.</span> Los planes se realizan bajo tu propia responsabilidad. Te recomendamos reunirte en lugares públicos y verificar la identidad de las personas. IOGGA no supervisa los encuentros ni se hace responsable de lo que ocurra en ellos.</p>
                  <p><span className="text-white font-bold">5. Contenido.</span> No publiques contenido ilegal, ofensivo o engañoso. Podemos retirar contenido y suspender cuentas que violen estos términos.</p>
                  <p><span className="text-white font-bold">6. Responsabilidad.</span> La Plataforma se ofrece "tal cual", en etapa MVP. En la medida permitida por la ley, IOGGA no será responsable por daños indirectos derivados del uso del servicio.</p>
                  <p><span className="text-white font-bold">7. Contacto.</span> soporte@iogga.com · Chihuahua, México.</p>
                  <p className="text-zinc-600">Última actualización: julio de 2026.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )}

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
        title: "¡Bienvenido a IOGGA!",
        description: "La app donde tus planes cobran vida y conectar es más fácil que nunca. Vamos a darte un recorrido rápido.",
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
        title: "IOGGA para Negocios",
        description: "Potencia tu negocio conectando con personas que buscan qué hacer en tiempo real.",
        targetId: null,
        icon: <Store className="text-iogga-primary" size={32} />,
        onEnter: () => setIsIntro(false)
      },
      {
        title: "Publica Ofertas",
        description: "Crea productos y ofertas especiales que aparecerán cuando la gente busque qué hacer.",
        targetId: 'tutorial-create-btn',
        icon: <PackagePlus className="text-iogga-primary" size={32} />,
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
        icon: <Globe className="text-iogga-primary" size={32} />,
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
        icon: <BarChart3 className="text-iogga-primary" size={32} />,
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
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
          className="w-[calc(100%-48px)] max-w-[320px] bg-zinc-900 border border-white/10 rounded-[32px] p-6 shadow-2xl pointer-events-auto"
        >
          {/* Arrow for spotlight */}
          {rect && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-l border-t border-white/10 rotate-45 ${rect.y > 400 ? '-bottom-2 rotate-[225deg]' : '-top-2'}`}
            />
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
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
              <h3 className="text-xl font-black text-white leading-tight">{currentStep.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{currentStep.description}</p>
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
                  className="flex-[2] py-3 rounded-xl bg-iogga-primary text-white text-xs font-black shadow-lg shadow-iogga-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
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
                  className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-iogga-primary' : 'w-1.5 bg-white/10'}`} 
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

function GroupedPlanCard({ group, rank }: { group: any, rank: number, key?: string | number }) {
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
            <span className="text-2xl font-black text-white leading-none">{group.count}</span>
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
              Análisis en vivo: <span className="text-iogga-primary">{group.count} personas</span> están buscando {group.subCategory.toLowerCase()} en este momento.
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

function SettingsItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
    >
      <div className="flex items-center gap-3">
        <div className="text-zinc-500 group-hover:text-iogga-primary transition-colors">{icon}</div>
        <span className="text-sm font-bold text-zinc-300">{label}</span>
      </div>
      <ChevronRight size={16} className="text-zinc-600" />
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

function ProfileButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors">
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
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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

function UserProfileModal({ user, onClose }: { user: Plan, onClose: () => void }) {
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
                <span className="text-sm font-black text-white">{user.userStats?.rating || '5.0'}</span>
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
          <button className="flex-1 py-5 bg-iogga-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-iogga-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Seguir
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BusinessProfileModal({ business, onClose, appMode, onStartBusinessFlow }: { business: Promotion, onClose: () => void, appMode?: UserMode, onStartBusinessFlow?: () => void }) {
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
            <span className="text-2xl font-black text-white block">{business.businessStats?.rating || '5.0'}</span>
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
          <div className="p-5 rounded-[32px] bg-white/5 border border-white/10 flex items-center gap-4">
            <div className="p-3 bg-iogga-accent/10 rounded-2xl text-iogga-accent">
              <MapPin size={20} />
            </div>
            <div>
              <span className="text-white font-bold block">{business.location}</span>
              <span className="text-xs text-zinc-500">Abierto ahora • Cierra 22:00</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 py-5 bg-white/5 text-white rounded-[24px] font-black text-lg border border-white/10 hover:bg-white/10 transition-all">
            Llamar
          </button>
          <button className="flex-1 py-5 bg-iogga-accent text-white rounded-[24px] font-black text-lg shadow-xl shadow-iogga-accent/20 hover:scale-[1.02] active:scale-95 transition-all">
            Ver Menú
          </button>
        </div>
      </div>
    </Modal>
  );
}
