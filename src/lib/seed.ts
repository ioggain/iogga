import { Plan, Promotion } from '../types';

// Universo de personas de PRUEBA para poblar "Agregar amigos" (foto, nombre,
// ranking), estilo TikTok/Instagram. uid con prefijo su_ = usuario semilla.
export interface SeedUser { uid: string; name: string; photo: string; rating: number; isSeed: true; }
export const SEED_USERS: SeedUser[] = [
  { uid: 'su_sofia', name: 'Sofía Robles', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', rating: 4.9, isSeed: true },
  { uid: 'su_diego', name: 'Diego Márquez', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', rating: 4.8, isSeed: true },
  { uid: 'su_renata', name: 'Renata Ibarra', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', rating: 5.0, isSeed: true },
  { uid: 'su_mau', name: 'Mauricio León', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', rating: 4.7, isSeed: true },
  { uid: 'su_ana', name: 'Ana Cristina', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', rating: 4.9, isSeed: true },
  { uid: 'su_paulina', name: 'Paulina Ruiz', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', rating: 4.6, isSeed: true },
  { uid: 'su_carlos', name: 'Carlos Fuentes', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', rating: 4.8, isSeed: true },
  { uid: 'su_regina', name: 'Regina Salas', photo: 'https://images.unsplash.com/photo-1520295187453-cd239786490c?auto=format&fit=crop&w=150&q=80', rating: 5.0, isSeed: true },
  { uid: 'su_luis', name: 'Luis Ángel', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&q=80', rating: 4.7, isSeed: true },
  { uid: 'su_vale', name: 'Valeria Nájera', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', rating: 4.9, isSeed: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Base de datos FICTICIA temporal para mostrar el potencial de la app mientras
// se llena con datos reales de usuarios. Todo lo de aquí lleva `isSeed: true`
// y se distingue en la interfaz con una etiqueta "Prueba" en la esquina.
// Para desactivarla: no mezclar SEED_PLANS / SEED_PROMOS en App.tsx (un lugar).
// ─────────────────────────────────────────────────────────────────────────────

const AV = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1520295187453-cd239786490c?auto=format&fit=crop&w=150&q=80',
];

const mins = (m: number) => Date.now() - m * 60 * 1000;

type SeedPlan = Omit<Plan, 'userAvatar'> & { av: number };

const rawPlans: SeedPlan[] = [
  {
    id: 's_padel', av: 0, userName: 'Diego', activity: 'Pádel — busco pareja para jugar',
    dateLabel: 'hoy', startTime: '19:00', endTime: '21:00', location: 'Pádel Club Chihuahua',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 4, isPublic: true,
    timestamp: mins(12), tags: ['pádel', 'deporte', 'raqueta'],
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    comment: 'Nivel intermedio, rentamos cancha entre todos.',
  },
  {
    id: 's_cerro', av: 1, userName: 'Renata', activity: 'Subir el Cerro Coronel al amanecer',
    dateLabel: 'mañana', startTime: '06:30', endTime: '09:00', location: 'Cerro Coronel',
    budget: 'not-needed', transport: 'has-transport', guests: 'public', acceptedCount: 7, isPublic: true,
    timestamp: mins(40), tags: ['cerro', 'caminar', 'senderismo', 'naturaleza'],
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80',
    comment: 'Llevo café y agua, vista increíble para el amanecer.',
  },
  {
    id: 's_tenis', av: 2, userName: 'Mauricio', activity: 'Tenis casual, dobles',
    dateLabel: 'el sábado', startTime: '10:00', endTime: '12:00', location: 'Deportivo Sur',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 2, isPublic: true,
    timestamp: mins(70), tags: ['tenis', 'deporte', 'raqueta'],
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_cine', av: 3, userName: 'Ana', activity: 'Estreno en el cine — la nueva de terror',
    dateLabel: 'hoy', startTime: '21:30', endTime: '23:30', location: 'Cinépolis Fashion Mall',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 5, isPublic: true,
    timestamp: mins(20), tags: ['cine', 'estreno', 'película', 'terror'],
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_after', av: 4, userName: 'Paulina', activity: 'After office — unas chelas saliendo del trabajo',
    dateLabel: 'hoy', startTime: '18:30', endTime: '21:00', location: 'Distrito 1 Uno',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 9, isPublic: true,
    timestamp: mins(8), tags: ['after', 'cerveza', 'bar', 'social'],
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    comment: 'Los primeros que lleguen agarramos mesa.',
  },
  {
    id: 's_cancun', av: 5, userName: 'Carlos', activity: 'Viaje a Cancún en puente — dividimos gastos',
    dateLabel: 'el 15 de agosto', startTime: '06:00', endTime: '23:00', location: 'Cancún, QR',
    budget: 'split', transport: 'has-transport', guests: 'public', acceptedCount: 3, isPublic: true,
    timestamp: mins(180), tags: ['viaje', 'playa', 'cancún', 'vacaciones'],
    image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=800&q=80',
    comment: 'Airbnb frente al mar, buscamos 2 personas más.',
  },
  {
    id: 's_patines', av: 6, userName: 'Regina', activity: 'Patinar en la pista de hielo',
    dateLabel: 'el domingo', startTime: '17:00', endTime: '19:00', location: 'Ice Park',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 6, isPublic: true,
    timestamp: mins(95), tags: ['patinar', 'pista', 'hielo', 'familia'],
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_caminar', av: 7, userName: 'Luis', activity: 'Caminar y correr en el Parque El Palomar',
    dateLabel: 'mañana', startTime: '07:00', endTime: '08:00', location: 'Parque El Palomar',
    budget: 'not-needed', transport: 'each-arrives', guests: 'public', acceptedCount: 4, isPublic: true,
    timestamp: mins(150), tags: ['caminar', 'correr', 'parque', 'ejercicio'],
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_cafe', av: 1, userName: 'Valeria', activity: 'Café y trabajar juntos (co-working relajado)',
    dateLabel: 'hoy', startTime: '16:00', endTime: '18:00', location: 'Café Cortez',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 3, isPublic: true,
    timestamp: mins(30), tags: ['café', 'coworking', 'trabajo', 'social'],
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_boliche', av: 2, userName: 'Emilio', activity: 'Boliche y pizza en la noche',
    dateLabel: 'el viernes', startTime: '20:00', endTime: '23:00', location: 'Bol Bol Chihuahua',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 8, isPublic: true,
    timestamp: mins(60), tags: ['boliche', 'pizza', 'noche', 'social'],
    image: 'https://images.unsplash.com/photo-1538511008355-2e4b3d6b3f89?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_bici', av: 3, userName: 'Fernanda', activity: 'Rodada en bici por la ciclovía',
    dateLabel: 'el sábado', startTime: '08:00', endTime: '10:00', location: 'Ciclovía Vialidad Los Nogales',
    budget: 'not-needed', transport: 'each-arrives', guests: 'public', acceptedCount: 5, isPublic: true,
    timestamp: mins(120), tags: ['bici', 'ciclismo', 'ejercicio', 'ruta'],
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's_concierto', av: 4, userName: 'Andrés', activity: 'Concierto de rock en vivo',
    dateLabel: 'el viernes', startTime: '21:00', endTime: '23:59', location: 'Teatro de la Ciudad',
    budget: 'split', transport: 'each-arrives', guests: 'public', acceptedCount: 11, isPublic: true,
    timestamp: mins(200), tags: ['concierto', 'música', 'rock', 'noche'],
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  },
];

export const SEED_PLANS: Plan[] = rawPlans.map(({ av, ...p }) => ({
  ...p,
  userAvatar: AV[av],
  userStats: { plans: 8 + (av % 5) * 3, friends: 60 + av * 24, rating: 4.6 + (av % 4) * 0.1 },
  isSeed: true,
}));

type SeedPromo = Promotion;

export const SEED_PROMOS: Promotion[] = [
  {
    id: 'sp_cafe', businessName: 'Café Cortez', businessLogo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=150&q=80',
    title: '2x1 en café de especialidad', description: 'Todos los días de 4 a 6 pm. Trae a un amigo y el segundo café va por la casa.',
    price: '$55', offer: '2x1', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    location: 'Centro', realTimeSearchers: 14, qrScans: 42, salesCount: 30, totalEarnings: 1650,
    tags: ['café', 'coworking', 'social', 'bebidas'], isSeed: true, timestamp: mins(25),
  },
  {
    id: 'sp_bar', businessName: 'Distrito 1 Uno', businessLogo: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=150&q=80',
    title: 'Happy hour — cervezas al 2x1', description: 'De 6 a 9 pm. Cerveza artesanal local en barril.',
    price: '$45', offer: 'Happy hour', image: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=800&q=80',
    location: 'Distrito 1', realTimeSearchers: 28, qrScans: 88, salesCount: 61, totalEarnings: 2745,
    tags: ['bar', 'cerveza', 'after', 'noche', 'social'], isSeed: true, timestamp: mins(15),
  },
  {
    id: 'sp_gym', businessName: 'Iron House Gym', businessLogo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&q=80',
    title: 'Primer mes de gym gratis', description: 'Inscríbete y entrena el primer mes sin costo. Clases de spinning y funcional incluidas.',
    price: '$0', offer: 'Mes gratis', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    location: 'Zona Dorada', realTimeSearchers: 33, qrScans: 120, salesCount: 74, totalEarnings: 0,
    tags: ['gym', 'ejercicio', 'deporte', 'spinning', 'funcional'], isSeed: true, timestamp: mins(50),
  },
  {
    id: 'sp_padel', businessName: 'Pádel Club Chihuahua', businessLogo: 'https://images.unsplash.com/photo-1613918431703-aa50889e3be9?auto=format&fit=crop&w=150&q=80',
    title: 'Renta de cancha de pádel -30%', description: 'Lunes a jueves. Reserva por app y llévate 30% de descuento en tu cancha.',
    price: '$280', offer: '-30%', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    location: 'Norte', realTimeSearchers: 19, qrScans: 54, salesCount: 40, totalEarnings: 11200,
    tags: ['pádel', 'deporte', 'raqueta', 'cancha'], isSeed: true, timestamp: mins(70),
  },
  {
    id: 'sp_sushi', businessName: 'Sushilito Centro', businessLogo: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=150&q=80',
    title: 'Rollos al 2x1 en la noche', description: 'De 8 a 11 pm, todos los rollos clásicos al 2x1.',
    price: '$99', offer: '2x1', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    location: 'Centro', realTimeSearchers: 22, qrScans: 70, salesCount: 52, totalEarnings: 5148,
    tags: ['sushi', 'cena', 'comida', 'noche'], isSeed: true, timestamp: mins(40),
  },
  {
    id: 'sp_cine', businessName: 'Cinépolis Fashion Mall', businessLogo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=150&q=80',
    title: 'Boleto + palomitas $89', description: 'Martes y miércoles. Combo boleto 2D más palomitas medianas.',
    price: '$89', offer: 'Combo', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80',
    location: 'Fashion Mall', realTimeSearchers: 41, qrScans: 160, salesCount: 130, totalEarnings: 11570,
    tags: ['cine', 'película', 'estreno', 'palomitas'], isSeed: true, timestamp: mins(90),
  },
  {
    id: 'sp_boliche', businessName: 'Bol Bol Chihuahua', businessLogo: 'https://images.unsplash.com/photo-1571056824123-f2e5e7f4a4a1?auto=format&fit=crop&w=150&q=80',
    title: 'Línea de boliche gratis con pizza', description: 'Compra una pizza grande y te regalamos una línea de boliche por persona.',
    price: '$189', offer: 'Gratis', image: 'https://images.unsplash.com/photo-1538511008355-2e4b3d6b3f89?auto=format&fit=crop&w=800&q=80',
    location: 'Plaza', realTimeSearchers: 17, qrScans: 48, salesCount: 35, totalEarnings: 6615,
    tags: ['boliche', 'pizza', 'noche', 'familia', 'social'], isSeed: true, timestamp: mins(110),
  },
  {
    id: 'sp_mezcal', businessName: 'La Mezcalera', businessLogo: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=150&q=80',
    title: 'Cata de mezcal — 3 destilados', description: 'Cata guiada de tres mezcales artesanales con maridaje.',
    price: '$220', offer: 'Experiencia', image: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=800&q=80',
    location: 'Centro', realTimeSearchers: 12, qrScans: 30, salesCount: 21, totalEarnings: 4620,
    tags: ['bar', 'mezcal', 'after', 'noche', 'cata'], isSeed: true, timestamp: mins(130),
  },
];
