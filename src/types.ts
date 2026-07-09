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
  Bell
} from 'lucide-react';

export type UserMode = 'person' | 'business';

// Identidad genérica para perfiles sin sesión (perfil "virgen").
export const GUEST_NAME = 'Invitado';
// Avatar silueta neutro (sin datos personales), embebido como data URI.
export const GENERIC_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#27272a"/><circle cx="50" cy="38" r="18" fill="#52525b"/><path d="M50 60c-18 0-30 12-30 28v12h60V88c0-16-12-28-30-28z" fill="#52525b"/></svg>'
  );

export interface Plan {
  id: string;
  uid?: string; // dueño del plan (usuario de Firebase)
  whatsapp?: string; // para el botón "Hablar por WhatsApp" al aceptar
  userName: string;
  userAvatar: string;
  userBio?: string;
  userStats?: {
    plans: number;
    friends: number;
    rating: number;
  };
  activity: string;
  comment?: string; // comentario opcional del creador
  date?: string; // fecha ISO (YYYY-MM-DD)
  dateLabel?: string; // "hoy", "mañana", "el lunes", "el 15 de julio"
  startTime: string;
  endTime: string;
  location: string;
  budget: 'invites' | 'split' | 'no-money' | 'not-needed';
  transport: 'has-transport' | 'each-arrives' | 'no-transport';
  transportType?: string;
  guests: 'public' | 'friends';
  acceptedCount: number;
  acceptedBy?: { uid: string; name: string; photo?: string | null }[]; // quiénes aceptaron
  locations?: string[]; // ubicaciones adicionales
  timestamp: number;
  isPublic: boolean;
  image?: string;
  tags: string[];
  isInvitation?: boolean;
  inviterSelectedOfferId?: string;
  budgetAmount?: string;
  transportNote?: string;
  privateKey?: string; // frase/clave privada que deja el creador para dar confianza
}

export interface GroupedPlan {
  id: string;
  category: string;
  subCategory: string;
  count: number;
  location: string;
  image: string;
}

export interface Promotion {
  id: string;
  uid?: string; // dueño de la promoción (negocio)
  timestamp?: number;
  businessName: string;
  businessLogo: string;
  businessBio?: string;
  businessStats?: {
    offers: number;
    followers: number;
    rating: number;
  };
  title: string;
  description: string;
  price: string;
  offer?: string;
  image: string;
  location: string;
  realTimeSearchers: number;
  qrScans: number;
  salesCount: number;
  totalEarnings: number;
  qrCode?: string;
  tags: string[];
}

export const MOCK_PLANS: Plan[] = [
  {
    id: 'inv1',
    userName: 'Sofía',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    userBio: 'Amante del sushi y las buenas conversaciones. Siempre lista para una nueva aventura.',
    userStats: { plans: 12, friends: 156, rating: 4.9 },
    activity: 'Cena de Sushi',
    startTime: '20:00',
    endTime: '22:00',
    location: 'Sushilito Centro',
    budget: 'split',
    transport: 'each-arrives',
    guests: 'friends',
    acceptedCount: 1,
    timestamp: Date.now() - 1000 * 60 * 30,
    isPublic: false,
    isInvitation: true,
    inviterSelectedOfferId: 'p3',
    tags: ['comida', 'sushi'],
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'inv2',
    userName: 'Mateo',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    userBio: 'Fanático de los deportes y el boliche. Busco gente buena onda para jugar.',
    userStats: { plans: 8, friends: 89, rating: 4.7 },
    activity: 'Tarde de Boliche',
    startTime: '18:00',
    endTime: '20:00',
    location: 'Bol-Bol Plaza',
    budget: 'invites',
    transport: 'has-transport',
    guests: 'friends',
    acceptedCount: 2,
    timestamp: Date.now() - 1000 * 60 * 120,
    isPublic: false,
    isInvitation: true,
    tags: ['entretenimiento', 'boliche'],
    image: 'https://images.unsplash.com/photo-1538510127047-9744fd2fa212?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '1',
    userName: GUEST_NAME,
    userAvatar: GENERIC_AVATAR,
    userBio: 'Explorador urbano. Me encanta conocer nuevos cafés y lugares interesantes.',
    userStats: { plans: 24, friends: 312, rating: 5.0 },
    activity: 'Ir por un café',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Centro Histórico',
    budget: 'invites',
    transport: 'has-transport',
    guests: 'public',
    acceptedCount: 3,
    timestamp: Date.now() - 1000 * 60 * 15,
    isPublic: true,
    tags: ['café', 'social'],
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p4',
    userName: 'Valeria',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    userBio: 'Yoga, naturaleza y buena vibra. Vamos a conectar con el exterior.',
    userStats: { plans: 15, friends: 210, rating: 4.8 },
    activity: 'Clase de Yoga al aire libre',
    startTime: '07:00',
    endTime: '08:30',
    location: 'Parque Metropolitano',
    budget: 'no-money',
    transport: 'each-arrives',
    guests: 'public',
    acceptedCount: 12,
    timestamp: Date.now() - 1000 * 60 * 60,
    isPublic: true,
    tags: ['deporte', 'yoga'],
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p5',
    userName: 'Carlos',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    userBio: 'Cinéfilo de corazón. Siempre buscando el próximo gran estreno.',
    userStats: { plans: 30, friends: 450, rating: 4.9 },
    activity: 'Noche de Cine: Estreno Marvel',
    startTime: '21:00',
    endTime: '23:30',
    location: 'Cinepolis VIP',
    budget: 'split',
    transport: 'each-arrives',
    guests: 'public',
    acceptedCount: 5,
    timestamp: Date.now() - 1000 * 60 * 240,
    isPublic: true,
    tags: ['cine', 'marvel'],
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p6',
    userName: 'Ana',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    userBio: 'Adicta a la adrenalina. ¿Quién se apunta para escalar?',
    userStats: { plans: 5, friends: 45, rating: 4.6 },
    activity: 'Escalar el Cerro de la Silla',
    startTime: '06:00',
    endTime: '11:00',
    location: 'Entrada Principal',
    budget: 'no-money',
    transport: 'each-arrives',
    guests: 'public',
    acceptedCount: 8,
    timestamp: Date.now() - 1000 * 60 * 480,
    isPublic: true,
    tags: ['deporte', 'senderismo'],
    image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p7',
    userName: 'Lucía',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    userBio: 'Amante del arte y la cultura.',
    userStats: { plans: 10, friends: 120, rating: 4.7 },
    activity: 'Visita al Museo de Arte Contemporáneo',
    startTime: '11:00',
    endTime: '14:00',
    location: 'MAC Monterrey',
    budget: 'split',
    transport: 'each-arrives',
    guests: 'public',
    acceptedCount: 4,
    timestamp: Date.now() - 1000 * 60 * 300,
    isPublic: true,
    tags: ['arte', 'cultura'],
    image: 'https://images.unsplash.com/photo-1518998053502-5388618f9ee8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p8',
    userName: 'Diego',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    userBio: 'Gamer y entusiasta de la tecnología.',
    userStats: { plans: 18, friends: 250, rating: 4.9 },
    activity: 'Torneo de Smash Bros',
    startTime: '17:00',
    endTime: '21:00',
    location: 'Arena Gaming Center',
    budget: 'split',
    transport: 'each-arrives',
    guests: 'public',
    acceptedCount: 16,
    timestamp: Date.now() - 1000 * 60 * 150,
    isPublic: true,
    tags: ['gaming', 'social'],
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p9',
    userName: 'Elena',
    userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
    userBio: 'Foodie profesional.',
    userStats: { plans: 40, friends: 600, rating: 5.0 },
    activity: 'Tour de Tacos al Pastor',
    startTime: '20:00',
    endTime: '23:00',
    location: 'Zona Tec',
    budget: 'split',
    transport: 'has-transport',
    guests: 'public',
    acceptedCount: 6,
    timestamp: Date.now() - 1000 * 60 * 45,
    isPublic: true,
    tags: ['comida', 'tacos'],
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p10',
    userName: 'Roberto',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    userBio: 'Músico y compositor.',
    userStats: { plans: 12, friends: 180, rating: 4.8 },
    activity: 'Jam Session en el Parque',
    startTime: '16:00',
    endTime: '19:00',
    location: 'Parque Fundidora',
    budget: 'no-money',
    transport: 'each-arrives',
    guests: 'public',
    acceptedCount: 10,
    timestamp: Date.now() - 1000 * 60 * 600,
    isPublic: true,
    tags: ['música', 'social'],
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  }
];

export const MOCK_PROMOS: Promotion[] = [
  {
    id: 'p1',
    businessName: 'La Cabalita',
    businessLogo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=150&q=80',
    businessBio: 'El mejor café artesanal y repostería fina en un ambiente acogedor.',
    businessStats: { offers: 8, followers: 2450, rating: 4.9 },
    title: '2x1 en Americano',
    description: 'Disfruta de nuestro café de especialidad al doble.',
    price: '$65',
    image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=800&q=80',
    location: 'Av. Reforma 450',
    realTimeSearchers: 18,
    qrScans: 120,
    salesCount: 85,
    totalEarnings: 5525,
    tags: ['café', 'bebidas']
  },
  {
    id: 'p2',
    businessName: 'Cinepolis',
    businessLogo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=150&q=80',
    businessBio: 'La capital del cine. Vive la magia de la gran pantalla con nosotros.',
    businessStats: { offers: 3, followers: 5000, rating: 4.9 },
    title: 'Combo Pareja',
    description: 'Palomitas grandes + 2 refrescos.',
    price: '$210',
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
    location: 'Plaza Las Torres',
    realTimeSearchers: 45,
    qrScans: 120,
    salesCount: 95,
    totalEarnings: 19950,
    tags: ['cine', 'comida']
  },
  {
    id: 'p3',
    businessName: 'Sushilito',
    businessLogo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=150&q=80',
    businessBio: 'El mejor sushi de la ciudad. Frescura y sabor en cada bocado.',
    businessStats: { offers: 4, followers: 850, rating: 4.7 },
    title: 'Noches de Rollos',
    description: '3x2 en rollos clásicos.',
    price: '$280',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
    location: 'Av. Universidad 456',
    realTimeSearchers: 25,
    qrScans: 80,
    salesCount: 60,
    totalEarnings: 16800,
    tags: ['comida', 'sushi']
  }
];

export const MOCK_GROUPED_PLANS: GroupedPlan[] = [
  {
    id: 'g3',
    category: 'Entretenimiento',
    subCategory: 'Cine',
    count: 230,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g1',
    category: 'Comida',
    subCategory: 'Tacos',
    count: 156,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g2',
    category: 'Comida',
    subCategory: 'Sushi',
    count: 84,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g5',
    category: 'Comida',
    subCategory: 'Hamburguesas',
    count: 72,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g4',
    category: 'Deporte',
    subCategory: 'Gimnasio',
    count: 45,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g6',
    category: 'Deporte',
    subCategory: 'Pádel',
    count: 38,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1626225453016-81448a509831?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g7',
    category: 'Deporte',
    subCategory: 'Yoga',
    count: 29,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g8',
    category: 'Entretenimiento',
    subCategory: 'Conciertos',
    count: 112,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g9',
    category: 'Entretenimiento',
    subCategory: 'Museos',
    count: 65,
    location: 'Cerca de ti',
    image: 'https://images.unsplash.com/photo-1518998053502-5388618f9ee8?auto=format&fit=crop&w=800&q=80'
  }
];

export const IDEAS = [
  'Ir por un café',
  'Salir en la bicicleta',
  'Ir al cine',
  'Escalar un cerro',
  'Cena romántica',
  'Tarde de museos',
  'Clase de yoga',
  'Paseo por el parque',
  'Noche de boliche',
  'Comer sushi',
  'Ir a la playa',
  'Hacer un picnic',
  'Ver el atardecer',
  'Jugar tenis',
  'Ir a un concierto'
];
