// Backend de pagos de iogga (Mercado Pago Checkout Pro).
// El Access Token vive como SECRETO de Firebase (nunca en el código):
//   firebase functions:secrets:set MP_ACCESS_TOKEN
// La comisión de iogga se configura con la variable IOGGA_FEE_PCT (porcentaje).
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');

// % de comisión de iogga sobre cada venta (se puede cambiar sin tocar código)
const FEE_PCT = Number(process.env.IOGGA_FEE_PCT || '10');

// 1) Crear la preferencia de pago cuando la persona descarga su QR.
//    El cliente paga en la pantalla segura de Mercado Pago (tarjeta, dinero en
//    cuenta MP, SPEI u OXXO). iogga nunca ve ni guarda la tarjeta.
exports.createPreference = onRequest({ secrets: [MP_ACCESS_TOKEN], cors: true, region: 'us-central1' }, async (req, res) => {
  try {
    const { title, amount, promoId, code, userName, businessName, businessUid, uid } = req.body || {};
    const price = Number(amount);
    if (!title || !price || price <= 0) { res.status(400).json({ error: 'Faltan datos del pago' }); return; }

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ title: `${title} — ${businessName || 'iogga'}`, quantity: 1, unit_price: price, currency_id: 'MXN' }],
        external_reference: code || promoId || '',
        metadata: { promoId, code, userName, businessUid, uid, feePct: FEE_PCT },
        statement_descriptor: 'IOGGA',
        back_urls: {
          success: 'https://iogga.com/?pago=ok',
          failure: 'https://iogga.com/?pago=error',
          pending: 'https://iogga.com/?pago=pendiente',
        },
        auto_return: 'approved',
        notification_url: 'https://us-central1-iogga-b932b.cloudfunctions.net/mpWebhook',
      }),
    });
    const data = await r.json();
    if (!data.id) { res.status(502).json({ error: 'Mercado Pago rechazó la solicitud', detail: data }); return; }
    // Registrar el intento de pago (queda ligado al folio del QR)
    await admin.firestore().collection('payments').doc(String(data.id)).set({
      preferenceId: data.id,
      status: 'created',
      title, amount: price, promoId: promoId || null, code: code || null,
      userName: userName || null, uid: uid || null,
      businessName: businessName || null, businessUid: businessUid || null,
      feePct: FEE_PCT,
      feeAmount: Math.round(price * FEE_PCT) / 100,
      payoutAmount: price - Math.round(price * FEE_PCT) / 100,
      createdAtMs: Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
  } catch (e) {
    res.status(500).json({ error: 'Error interno', detail: String(e) });
  }
});

// 2) Webhook: Mercado Pago avisa aquí cuando un pago se aprueba.
//    Actualizamos el pago con folio, persona, fecha, comisión y monto a
//    dispersar al negocio (todo visible en el panel de administrador).
exports.mpWebhook = onRequest({ secrets: [MP_ACCESS_TOKEN], region: 'us-central1' }, async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query['data.id'];
    if (req.body?.type === 'payment' || req.query.type === 'payment') {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}` },
      });
      const pay = await r.json();
      if (pay?.id) {
        const meta = pay.metadata || {};
        const amount = Number(pay.transaction_amount) || 0;
        const feePct = Number(meta.fee_pct ?? meta.feePct ?? FEE_PCT);
        const fee = Math.round(amount * feePct) / 100;
        await admin.firestore().collection('payments').doc(String(pay.id)).set({
          paymentId: pay.id,
          status: pay.status, // approved / pending / rejected
          statusDetail: pay.status_detail || null,
          amount,
          feePct, feeAmount: fee, payoutAmount: amount - fee,
          code: pay.external_reference || meta.code || null,
          promoId: meta.promo_id ?? meta.promoId ?? null,
          userName: meta.user_name ?? meta.userName ?? null,
          uid: meta.uid || null,
          businessUid: meta.business_uid ?? meta.businessUid ?? null,
          payerEmail: pay.payer?.email || null,
          method: pay.payment_method_id || null,
          approvedAtMs: pay.date_approved ? new Date(pay.date_approved).getTime() : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // El libro contable de iogga registra la comisión ganada
        if (pay.status === 'approved') {
          await admin.firestore().collection('ledger').doc(`mp_${pay.id}`).set({
            amount: fee,
            concept: `Comisión ${feePct}% — ${pay.external_reference || pay.id}`,
            source: 'mercadopago',
            createdAtMs: Date.now(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          const promoId = meta.promo_id ?? meta.promoId ?? null;
          const buyerUid = meta.uid || null;
          // Sincronizar la compra en las estadísticas de la promoción (analítica del negocio)
          if (promoId) {
            await admin.firestore().collection('promos').doc(String(promoId)).set({
              paidCount: admin.firestore.FieldValue.increment(1),
              paidAmount: admin.firestore.FieldValue.increment(amount),
            }, { merge: true }).catch(() => {});
          }
          // Avisar al comprador dentro de la app: "Compraste ..." (campanita)
          if (buyerUid) {
            await admin.firestore().collection('notifications').add({
              type: 'system',
              to: buyerUid,
              fromName: 'iogga',
              title: `Compraste ${pay.description || 'tu promoción'}`,
              message: `Pago aprobado por $${amount} MXN. Folio ${pay.external_reference || pay.id}. Tu QR está en tu perfil, en "Mis promos activas".`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAtMs: Date.now(),
            }).catch(() => {});
          }
          // Avisar al NEGOCIO: le pagaron una promo (el cliente llegará con su QR)
          const sellerUid = meta.business_uid ?? meta.businessUid ?? null;
          if (sellerUid) {
            await admin.firestore().collection('notifications').add({
              type: 'system',
              to: sellerUid,
              fromName: 'iogga',
              title: `Venta pagada: ${pay.description || 'tu promoción'}`,
              message: `Cobraste $${amount} MXN (folio ${pay.external_reference || pay.id}). Neto para ti: $${amount - fee}. El cliente llegará con su QR para canjear.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAtMs: Date.now(),
            }).catch(() => {});
          }
        }
      }
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(200); // MP reintenta si no respondemos 200
  }
});
