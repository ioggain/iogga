// Pagos de iogga con Mercado Pago (Checkout Pro).
// El Public Key es público por diseño. El Access Token vive SOLO en el backend
// (secreto de Firebase Functions) — nunca aquí.
export const MP_PUBLIC_KEY = 'APP_USR-3d540450-e4f5-41b2-b972-107a25654fb1'; // credencial de PRUEBA

// Encendido: si el backend aún no responde, el QR sale sin pago (pokayoke,
// nadie se traba). En cuanto las Functions estén vivas, el cobro aparece solo.
export const PAYMENTS_ENABLED = true;

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
