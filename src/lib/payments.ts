// Pagos de iogga con Mercado Pago (Checkout Pro).
// Aquí NO vive ninguna credencial: el cobro lo arma el backend, que es quien
// guarda el Access Token como secreto de Firebase. (Había una llave suelta sin
// usar; la quitó la revisión automática de claves.)

// Encendido: si el backend aún no responde, el QR sale sin pago (pokayoke,
// nadie se traba). En cuanto las Functions estén vivas, el cobro aparece solo.
export const PAYMENTS_ENABLED = true;

// La comisión y el reparto viven en lib/reglas.ts, que está cubierto por
// pruebas automáticas. Aquí solo se reexportan para no tener dos copias del
// mismo número (fue exactamente lo que causó el error de contabilidad).
export { IOGGA_FEE_PCT, netForBusiness, ioggaFee } from './reglas';

const FN_BASE = 'https://us-central1-iogga-b932b.cloudfunctions.net';

// Pide al backend el link de pago para una promo; abre la pantalla segura de MP.
export async function createPaymentLink(input: {
  title: string; amount: number; promoId: string; code: string;
  userName?: string; uid?: string | null; businessName?: string; businessUid?: string | null;
}): Promise<string | null> {
  try {
    const r = await fetch(`${FN_BASE}/createPreference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const d = await r.json();
    // El backend ya elige el checkout correcto: real cuando hay reparto (negocio
    // con cuenta conectada), sandbox cuando es la cuenta de iogga en pruebas.
    return d.pay_url || d.sandbox_init_point || d.init_point || null;
  } catch {
    return null;
  }
}
