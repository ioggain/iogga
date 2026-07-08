// Sonidos mágicos de IOGGA, generados en el dispositivo (sin archivos que descargar).
// Tres variantes de "lluvia de campanitas de cristal":
//  - 'lluvia'     -> lluvia de notitas de cristal cayendo (recomendada)
//  - 'campanitas' -> pocas campanas finas, más lentas y brillantes
//  - 'polvo'      -> polvo de estrellas: muchas chispitas diminutas y rápidas

export type ChimeVariant = 'lluvia' | 'campanitas' | 'polvo';

// Escala pentatónica mayor en octavas altas: siempre suena armónico
const SCALE = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3, 2637.0, 3136.0, 3520.0];

let ctx: AudioContext | null = null;

function note(time: number, freq: number, vol: number, dur: number, pan: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const shimmer = ctx.createOscillator(); // brillo una octava arriba
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.value = freq;
  shimmer.type = 'triangle';
  shimmer.frequency.value = freq * 2;

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.18;

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.008); // ataque de cristal
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur); // caída natural

  panner.pan.value = pan;

  osc.connect(gain);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);

  osc.start(time);
  shimmer.start(time);
  osc.stop(time + dur + 0.1);
  shimmer.stop(time + dur + 0.1);
}

export function playChime(variant: ChimeVariant = 'lluvia'): void {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime + 0.03;

    const config =
      variant === 'campanitas'
        ? { count: 8, span: 2.2, vol: [0.05, 0.11], dur: [1.2, 2.0] }
        : variant === 'polvo'
          ? { count: 26, span: 1.6, vol: [0.015, 0.05], dur: [0.3, 0.8] }
          : { count: 15, span: 1.9, vol: [0.03, 0.08], dur: [0.6, 1.4] }; // lluvia

    for (let i = 0; i < config.count; i++) {
      const t = now + Math.pow(i / config.count, 1.2) * config.span + Math.random() * 0.06;
      const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
      const vol = config.vol[0] + Math.random() * (config.vol[1] - config.vol[0]);
      const dur = config.dur[0] + Math.random() * (config.dur[1] - config.dur[0]);
      const pan = (Math.random() - 0.5) * 1.4;
      note(t, freq, vol, dur, pan);
    }
  } catch {
    // sin audio disponible: silencio elegante
  }
}
