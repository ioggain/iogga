// ---- REGLAS DE NEGOCIO DE IOGGA ----
// Aquí viven las decisiones que, cuando fallan, cuestan dinero o hacen
// desaparecer cosas. Están separadas de la pantalla a propósito: así se pueden
// probar solas y automáticamente, sin abrir la app.
//
// Cada una de estas reglas se rompió alguna vez en producción. Las pruebas de
// __tests__/reglas.test.ts existen para que no se vuelvan a romper en silencio.

/** Comisión de iogga sobre cada venta, en porcentaje. Debe coincidir con el backend. */
export const IOGGA_FEE_PCT = 10;

/** Lo que le queda al negocio de una venta, ya con la comisión descontada. */
export function netForBusiness(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round((amount - (amount * IOGGA_FEE_PCT) / 100) * 100) / 100;
}

/** Lo que gana iogga de una venta. neto + comisión siempre debe dar el total. */
export function ioggaFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round((amount - netForBusiness(amount)) * 100) / 100;
}

/** Convierte "$1,299.50" o "199" a número. Devuelve 0 si no hay precio. */
export function parsePrice(raw: unknown): number {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : 0;
  if (typeof raw !== 'string') return 0;
  // Un precio en negativo no existe: "-5" no puede volverse 5 al quitarle el
  // signo (lo encontró la prueba de abajo). Se descarta.
  if (/-\s*\d/.test(raw)) return 0;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export interface PlanTiempo {
  date?: string;      // día de inicio, "2026-08-07"
  endDate?: string;   // día de fin, si termina otro día
  startTime?: string; // "19:30"
  endTime?: string;   // "22:00"
  allDay?: boolean;
  timestamp?: number; // cuándo se publicó (respaldo si no hay fecha)
}

/**
 * Momento en que TERMINA un plan. De esto depende que un plan se vea o
 * desaparezca, así que es la regla más delicada de la app.
 */
export function planEndMs(p: PlanTiempo, ahora = Date.now()): number {
  const startDay = p.date || (() => {
    const d = new Date(p.timestamp || ahora);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const endDay = p.endDate || startDay;
  if (p.allDay) {
    const d = new Date(`${endDay}T00:00:00`);
    d.setHours(23, 59, 59, 0);
    return d.getTime();
  }
  const hasEnd = !!p.endTime && p.endTime !== '00:00';
  const hasStart = !!p.startTime && p.startTime !== '00:00';
  const hm = hasEnd ? p.endTime! : hasStart ? p.startTime! : '23:59';
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(`${endDay}T00:00:00`);
  d.setHours(Number.isNaN(h) ? 23 : h, Number.isNaN(m) ? 59 : m, 59, 0);
  return d.getTime();
}

/** Un documento no aguanta más de 1 MB: esto avisa ANTES de intentar guardar. */
export const LIMITE_DOCUMENTO = 950_000;
export function cabeEnUnDocumento(data: unknown): boolean {
  try {
    return JSON.stringify(data).length <= LIMITE_DOCUMENTO;
  } catch {
    return false;
  }
}
