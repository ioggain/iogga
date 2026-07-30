// Sonidos mágicos de IOGGA, generados en el dispositivo (sin archivos que descargar).
// El intro es una "lluvia de miles de notitas de cristal": nace en silencio
// (fade in suave para no asustar), crece poco a poco y se desvanece con un
// fade out más rápido. Mismo principio que el arranque de un iPhone: fino y breve.

export type ChimeVariant = 'lluvia' | 'campanitas' | 'polvo';

// ---- Interruptor de sonido (modelo iPhone/WhatsApp: el usuario manda) ----
// Se recuerda en el teléfono. Si está apagado, NADA suena.
let soundOn = (() => {
  try {
    return localStorage.getItem('iogga_sound') !== 'off';
  } catch {
    return true;
  }
})();

export function isSoundOn(): boolean {
  return soundOn;
}

export function setSoundOn(on: boolean): void {
  soundOn = on;
  try {
    localStorage.setItem('iogga_sound', on ? 'on' : 'off');
  } catch {}
}

// Pentatónica mayor en octavas altas + armónicos: siempre suena afinado
const SCALE = [
  1046.5, 1174.7, 1318.5, 1568.0, 1760.0,
  2093.0, 2349.3, 2637.0, 3136.0, 3520.0,
  4186.0, 4698.6, 5274.0,
];

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (!soundOn) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(dest: AudioNode, time: number, freq: number, vol: number, dur: number, pan: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  const shimmer = c.createOscillator(); // brillo una octava arriba
  const gain = c.createGain();
  const panner = c.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.value = freq;
  shimmer.type = 'triangle';
  shimmer.frequency.value = freq * 2;

  const shimmerGain = c.createGain();
  shimmerGain.gain.value = 0.15;

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.006); // ataque de cristal
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur); // caída natural

  panner.pan.value = pan;

  osc.connect(gain);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(gain);
  gain.connect(panner);
  panner.connect(dest);

  osc.start(time);
  shimmer.start(time);
  osc.stop(time + dur + 0.1);
  shimmer.stop(time + dur + 0.1);
}

// Armar el intro desde el arranque: intenta sonar de inmediato junto al logo;
// si el navegador aún bloquea el audio (regla universal: nada suena antes del
// primer toque), queda listo para brotar en el PRIMER contacto con la pantalla.
let introDone = false;
export function armIntroChime(): void {
  if (introDone) return;
  const tryPlay = () => {
    if (introDone) return;
    const c = ensureCtx();
    if (c && c.state === 'running') {
      introDone = true;
      playIntroChime();
      window.removeEventListener('pointerdown', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    }
  };
  tryPlay(); // a veces ya está permitido (app instalada / sesión previa)
  if (!introDone) {
    window.addEventListener('pointerdown', tryPlay);
    window.addEventListener('touchstart', tryPlay);
    window.addEventListener('keydown', tryPlay);
    setTimeout(tryPlay, 400); // reintento silencioso por si el contexto se activa solo
  }
}

// El intro oficial de iogga: ~140 notitas en ~3.5 segundos con envolvente global
// (fade in lento, clímax, fade out rápido).
export function playIntroChime(): void {
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime + 0.05;
  const TOTAL = 3.5;

  // Envolvente maestra: imperceptible -> crece -> se desvanece rápido
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.9, now + 1.4); // fade in suave
  master.gain.setValueAtTime(0.9, now + TOTAL - 0.8);
  master.gain.exponentialRampToValueAtTime(0.0001, now + TOTAL); // fade out más rápido
  master.connect(c.destination);

  const COUNT = 140;
  for (let i = 0; i < COUNT; i++) {
    // Densidad creciente: al inicio caen pocas, hacia el clímax caen muchas
    const t = now + Math.pow(Math.random(), 0.65) * (TOTAL - 0.5);
    const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
    const vol = 0.008 + Math.random() * 0.03; // diminutas: el volumen lo da el conjunto
    const dur = 0.25 + Math.random() * 0.6;
    const pan = (Math.random() - 0.5) * 1.6;
    note(master, t, freq, vol, dur, pan);
  }
}

// ---- Viento: un soplo cortito para abrir y cerrar ----
// Ruido suave filtrado que sube (abrir) o baja (cerrar), como las hojas del
// iPhone. Dura ~0.3 s y es casi imperceptible: acompaña, no interrumpe.
function breeze(up: boolean): void {
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime + 0.01;
  const DUR = 0.32;

  // Ruido blanco corto generado al vuelo (no hace falta ningún archivo)
  const frames = Math.floor(c.sampleRate * DUR);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;

  // El filtro es lo que le da el "aire": barrido de agudos arriba o abajo
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(up ? 700 : 2600, now);
  filter.frequency.exponentialRampToValueAtTime(up ? 2600 : 700, now + DUR);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + DUR * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + DUR);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(now);
  src.stop(now + DUR + 0.05);
}

// ---- Vocabulario ÚNICO de sonidos de iogga ----
// Regla (modelo iOS/Duolingo): el sonido significa algo, no acompaña cada toque.
//   abrir/cerrar -> viento    | logro  -> campanitas
//   aviso        -> polvo     | error  -> dos notas graves
// Toda la app usa SOLO estos cinco. Así nunca suena de más ni suena distinto
// para la misma acción.
export type Sfx = 'abrir' | 'cerrar' | 'logro' | 'aviso' | 'error';

export function sfx(name: Sfx): void {
  try {
    if (name === 'abrir') return breeze(true);
    if (name === 'cerrar') return breeze(false);
    if (name === 'logro') return playChime('campanitas');
    if (name === 'aviso') return playChime('polvo');
    // error: dos notas graves y secas, sin brillo (nunca estridente)
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + 0.02;
    note(c.destination, now, 392.0, 0.07, 0.22, 0);
    note(c.destination, now + 0.13, 329.6, 0.06, 0.3, 0);
  } catch {
    /* si el navegador aún no permite audio, la app sigue igual */
  }
}

// Variantes cortas para otros momentos de la app (hoy no se usan en el intro)
export function playChime(variant: ChimeVariant = 'lluvia'): void {
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime + 0.03;
  const config =
    variant === 'campanitas'
      ? { count: 8, span: 2.2, vol: [0.09, 0.18], dur: [1.2, 2.0] }
      : variant === 'polvo'
        ? { count: 26, span: 1.6, vol: [0.03, 0.09], dur: [0.3, 0.8] }
        : { count: 15, span: 1.9, vol: [0.06, 0.14], dur: [0.6, 1.4] }; // lluvia

  for (let i = 0; i < config.count; i++) {
    const t = now + Math.pow(i / config.count, 1.2) * config.span + Math.random() * 0.06;
    const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
    const vol = config.vol[0] + Math.random() * (config.vol[1] - config.vol[0]);
    const dur = config.dur[0] + Math.random() * (config.dur[1] - config.dur[0]);
    const pan = (Math.random() - 0.5) * 1.4;
    note(c.destination, t, freq, vol, dur, pan);
  }
}
