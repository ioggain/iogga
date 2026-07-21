// Backend de pagos de iogga (Mercado Pago Checkout Pro).
// El Access Token vive como SECRETO de Firebase (nunca en el código):
//   firebase functions:secrets:set MP_ACCESS_TOKEN
// La comisión de iogga se configura con la variable IOGGA_FEE_PCT (porcentaje).
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
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

    const fee = Math.round(price * FEE_PCT) / 100;

    // ¿El negocio ya conectó SU cuenta de Mercado Pago (modelo Marketplace)?
    // Si sí, el pago se REPARTE solo: el negocio recibe su parte y iogga la
    // comisión (marketplace_fee), sin intermediarios. Si no, se usa la cuenta
    // única de iogga (flujo actual) y la dispersión se hace por corte.
    let seller = null;
    if (businessUid) {
      try {
        const snap = await admin.firestore().collection('mp_sellers').doc(String(businessUid)).get();
        if (snap.exists && snap.data() && snap.data().access_token) seller = snap.data();
      } catch { seller = null; }
    }
    const split = !!seller;
    const accessToken = split ? seller.access_token : MP_ACCESS_TOKEN.value();

    const body = {
      items: [{ title: `${title} — ${businessName || 'iogga'}`, quantity: 1, unit_price: price, currency_id: 'MXN' }],
      external_reference: code || promoId || '',
      metadata: { promoId, code, userName, businessUid, uid, feePct: FEE_PCT, split },
      statement_descriptor: 'IOGGA',
      back_urls: {
        success: 'https://iogga.com/?pago=ok',
        failure: 'https://iogga.com/?pago=error',
        pending: 'https://iogga.com/?pago=pendiente',
      },
      auto_return: 'approved',
      notification_url: 'https://us-central1-iogga-b932b.cloudfunctions.net/mpWebhook',
    };
    // marketplace_fee = lo que iogga retiene automáticamente de esta venta.
    if (split) body.marketplace_fee = fee;

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!data.id) { res.status(502).json({ error: 'Mercado Pago rechazó la solicitud', detail: data }); return; }
    // Con reparto (negocio con cuenta real conectada) se usa el checkout REAL
    // (init_point). Sin reparto (cuenta única de iogga en pruebas) se usa el de
    // sandbox. Así una venta repartida no cae por error en el ambiente de prueba.
    const payUrl = split ? (data.init_point || data.sandbox_init_point) : (data.sandbox_init_point || data.init_point);
    // Registrar el intento de pago (queda ligado al folio del QR)
    await admin.firestore().collection('payments').doc(String(data.id)).set({
      preferenceId: data.id,
      status: 'created',
      split, // true = repartido automático; false = cuenta única de iogga
      title, amount: price, promoId: promoId || null, code: code || null,
      userName: userName || null, uid: uid || null,
      businessName: businessName || null, businessUid: businessUid || null,
      feePct: FEE_PCT,
      feeAmount: fee,
      payoutAmount: price - fee,
      createdAtMs: Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ id: data.id, pay_url: payUrl, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
  } catch (e) {
    res.status(500).json({ error: 'Error interno', detail: String(e) });
  }
});

// ---- Conexión del negocio con Mercado Pago (OAuth, para el reparto automático) ----
// Lee client_id/client_secret de iogga desde Firestore (config/mp), que el
// administrador pega una sola vez en el panel. Así el secreto no vive en el
// código ni en el repo. (En la limpieza final se moverá a Secret Manager.)
async function mpConfig() {
  try {
    const snap = await admin.firestore().collection('config').doc('mp').get();
    return snap.exists ? (snap.data() || {}) : {};
  } catch { return {}; }
}
const OAUTH_REDIRECT = 'https://us-central1-iogga-b932b.cloudfunctions.net/mpOAuthCallback';

// El negocio toca "Conectar Mercado Pago": lo mandamos a autorizar a iogga.
exports.mpConnect = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  const uid = String(req.query.uid || '');
  const cfg = await mpConfig();
  if (!cfg.clientId) { res.status(200).send('iogga aún no tiene configurado el Marketplace de Mercado Pago. Avísale al administrador.'); return; }
  if (!uid) { res.status(400).send('Falta el identificador del negocio.'); return; }
  const url = 'https://auth.mercadopago.com.mx/authorization'
    + `?client_id=${encodeURIComponent(cfg.clientId)}`
    + '&response_type=code&platform_id=mp'
    + `&state=${encodeURIComponent(uid)}`
    + `&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT)}`;
  res.redirect(url);
});

// Mercado Pago regresa aquí con un código: lo cambiamos por el token del
// negocio y lo guardamos (server-only) para poder repartirle sus ventas.
exports.mpOAuthCallback = onRequest({ region: 'us-central1' }, async (req, res) => {
  // Redirigir a iogga con el MOTIVO del error (para poder diagnosticar sin logs).
  const fail = (reason) => res.redirect('https://iogga.com/?mp=error&reason=' + encodeURIComponent(String(reason || 'desconocido').slice(0, 140)));
  try {
    const code = String(req.query.code || '');
    const uid = String(req.query.state || '');
    // Mercado Pago puede regresar un error directo en la URL (p. ej. permiso denegado)
    if (req.query.error) { fail(`mp:${req.query.error}${req.query.error_description ? ' - ' + req.query.error_description : ''}`); return; }
    if (!code) { fail('sin_codigo'); return; }
    if (!uid) { fail('sin_negocio'); return; }
    const cfg = await mpConfig();
    if (!cfg.clientId || !cfg.clientSecret) { fail('sin_credenciales'); return; }

    const r = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: OAUTH_REDIRECT,
      }),
    });
    const tok = await r.json().catch(() => ({}));
    if (!tok.access_token) {
      // Guardar el detalle para el panel de admin y devolver el motivo en la URL.
      const motivo = tok.message || tok.error || tok.error_description || `http_${r.status}`;
      await admin.firestore().collection('config').doc('mp_last_error').set({
        status: r.status, message: tok.message || null, error: tok.error || null,
        cause: tok.cause || null, at: Date.now(),
      }, { merge: true }).catch(() => {});
      fail(motivo);
      return;
    }
    // Guardar el token del vendedor (privado, solo backend) y marcar conectado.
    await admin.firestore().collection('mp_sellers').doc(uid).set({
      access_token: tok.access_token,
      refresh_token: tok.refresh_token || null,
      mpUserId: tok.user_id || null,
      publicKey: tok.public_key || null,
      expiresInMs: tok.expires_in ? Date.now() + tok.expires_in * 1000 : null,
      connectedAtMs: Date.now(),
    }, { merge: true });
    await admin.firestore().collection('users').doc(uid).set({ mpConnected: true }, { merge: true }).catch(() => {});
    res.redirect('https://iogga.com/?mp=conectado');
  } catch (e) {
    fail('excepcion:' + String(e && e.message ? e.message : e));
  }
});

// Desvincular la cuenta de Mercado Pago del negocio (para cambiarla por otra).
// Borra el token guardado y marca el perfil como no conectado, para que pueda
// volver a conectar la cuenta correcta.
exports.mpDisconnect = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  try {
    const uid = String((req.body && req.body.uid) || req.query.uid || '');
    if (!uid) { res.status(400).json({ error: 'Falta el negocio' }); return; }
    await admin.firestore().collection('mp_sellers').doc(uid).delete().catch(() => {});
    await admin.firestore().collection('users').doc(uid).set({ mpConnected: false }, { merge: true }).catch(() => {});
    res.json({ ok: true });
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

// 3) Push al teléfono: cada notificación nueva en la app se manda también como
//    notificación del sistema (aunque la app esté cerrada), a todos los
//    dispositivos donde el usuario aceptó recibirlas.
exports.sendPush = onDocumentCreated({ document: 'notifications/{id}', region: 'us-central1' }, async (event) => {
  try {
    const n = event.data ? event.data.data() : null;
    if (!n || !n.to) return;
    const userRef = admin.firestore().collection('users').doc(String(n.to));
    const snap = await userRef.get();
    const tokens = (snap.data() || {}).fcmTokens || [];
    if (!Array.isArray(tokens) || tokens.length === 0) return;
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: n.title || 'iogga', body: n.message || '' },
      webpush: {
        fcmOptions: { link: 'https://iogga.com/' },
        notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
      },
    });
    // Limpiar tokens de dispositivos que ya no existen (app desinstalada, etc.)
    const dead = [];
    res.responses.forEach((r, i) => { if (!r.success) dead.push(tokens[i]); });
    if (dead.length > 0) {
      await userRef.update({ fcmTokens: admin.firestore.FieldValue.arrayRemove(...dead) }).catch(() => {});
    }
  } catch (e) {
    console.error('sendPush', e);
  }
});
