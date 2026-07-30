import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { QrCode, X, CheckCircle2, XCircle, Camera, Loader2, Download, Keyboard, Lock, Send } from 'lucide-react';
import {
  createRedemption,
  validateRedemption,
  parsePrice,
  sendNotification,
  watchPaymentForCode,
  type AuthUser,
  type Redemption,
  type ValidationResult,
} from '../lib/firebase';
import { PAYMENTS_ENABLED, createPaymentLink } from '../lib/payments';
import { sfx } from '../lib/sound';

// "sáb 19 jul, 9:30 p.m." — para decir claramente hasta cuándo vale el QR
function formatUntil(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}

function Overlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  // Deslizar hacia abajo desde cualquier punto para cerrar (igual que el resto
  // de las tarjetas de iogga): solo arrastra si el contenido está hasta arriba.
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ y: 0, active: false });
  const [dragY, setDragY] = useState(0);
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        onTouchStart={(e) => { const el = sheetRef.current; dragRef.current = { y: e.touches[0].clientY, active: !!el && el.scrollTop <= 0 }; }}
        onTouchMove={(e) => {
          if (!dragRef.current.active) return;
          const el = sheetRef.current;
          if (el && el.scrollTop > 0) { dragRef.current.active = false; setDragY(0); return; }
          const d = e.touches[0].clientY - dragRef.current.y;
          if (d > 0) setDragY(d);
        }}
        onTouchEnd={() => { if (dragRef.current.active && dragY > 110) onClose(); dragRef.current.active = false; setDragY(0); }}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className="relative w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto sm:hidden" />
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-white uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Modal del CLIENTE: genera su QR único de canje ----------

export function RedeemQRModal({
  promo,
  user,
  onClose,
  existing,
}: {
  promo: { id: string; title: string; businessName: string; uid?: string | null; price?: string; validTo?: string; validToTime?: string; allDay?: boolean };
  user: AuthUser | null;
  onClose: () => void;
  existing?: Redemption | null; // ver un QR ya comprado (desde "Mis promos activas"): sin crear ni cobrar de nuevo
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [redemption, setRedemption] = useState<Redemption | null>(existing || null);
  const [error, setError] = useState(false);
  // Pago ANTES de mostrar el QR (modelo Costco: pagas y luego canjeas).
  // Si el backend de pagos no responde, se sigue sin pago (no se traba nadie).
  const price = parsePrice(promo.price);
  const needsPayment = PAYMENTS_ENABLED && price > 0 && !existing;
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [payStep, setPayStep] = useState<'loading' | 'pay' | 'done' | 'skip'>(needsPayment ? 'loading' : 'skip');

  // Estado del pago EN VIVO: el webhook de Mercado Pago escribe el pago y aquí
  // nos enteramos al instante. Aprobado = pasar solo al QR con sonido.
  const [payStatus, setPayStatus] = useState<string | null>(null);
  const paid = payStatus === 'approved';
  useEffect(() => {
    if (!redemption || price <= 0 || !user?.uid) return;
    return watchPaymentForCode(redemption.code, user.uid, setPayStatus);
  }, [redemption?.code, user?.uid, price]);
  useEffect(() => {
    if (paid && (payStep === 'pay' || payStep === 'loading')) {
      setPayStep('done');
      sfx('logro');
    }
  }, [paid]);

  // Botón "Ya pagué" (respaldo si el aviso automático tarda): pasar al QR
  const confirmPurchase = () => {
    setPayStep('done');
    sfx('logro');
  };

  // Reintentar el pago de un QR ya generado que quedó sin pagar
  const [retryBusy, setRetryBusy] = useState(false);
  const retryPayment = async () => {
    if (!redemption || retryBusy) return;
    setRetryBusy(true);
    const url = await createPaymentLink({
      title: promo.title,
      amount: price,
      promoId: promo.id,
      code: redemption.code,
      userName: user?.name,
      uid: user?.uid || null,
      businessName: promo.businessName,
      businessUid: promo.uid || null,
    });
    setRetryBusy(false);
    if (url) window.open(url, '_blank', 'noopener');
  };

  useEffect(() => {
    if (existing) return; // ya existe: solo mostrarlo
    let cancelled = false;
    createRedemption(promo, user)
      .then((r) => {
        if (!cancelled) setRedemption(r);
        // Con el folio del QR listo, pedimos el link de pago ligado a ese folio
        if (!cancelled && needsPayment && r) {
          void createPaymentLink({
            title: promo.title,
            amount: price,
            promoId: promo.id,
            code: r.code,
            userName: user?.name,
            uid: user?.uid || null,
            businessName: promo.businessName,
            businessUid: promo.uid || null,
          }).then((url) => {
            if (cancelled) return;
            if (url) { setPayUrl(url); setPayStep('pay'); }
            else setPayStep('skip'); // backend aún no disponible: no trabar el canje
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [promo.id]);

  useEffect(() => {
    if (redemption && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `IOGGA:${redemption.code}`, {
        width: 220,
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' },
      });
    }
  }, [redemption, payStep]);

  const downloadQR = () => {
    if (!canvasRef.current || !redemption) return;
    const link = document.createElement('a');
    link.download = `iogga-${redemption.code}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Mandar el QR por WhatsApp: la imagen si el teléfono lo permite (hoja de
  // compartir del sistema); si no, el folio y la promo en texto.
  const shareQR = async () => {
    if (!canvasRef.current || !redemption) return;
    const text = `Mi QR de iogga: ${promo.title} en ${promo.businessName}. Folio ${redemption.code}.` +
      (redemption.validUntilMs ? ` Válido hasta el ${formatUntil(redemption.validUntilMs)}.` : '');
    try {
      const blob: Blob | null = await new Promise((res) => canvasRef.current!.toBlob(res, 'image/png'));
      if (blob) {
        const file = new File([blob], `iogga-${redemption.code}.png`, { type: 'image/png' });
        const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await (nav as any).share({ files: [file], text });
          return;
        }
      }
    } catch { /* cae al texto */ }
    const a = document.createElement('a');
    a.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Overlay onClose={onClose} title="Tu código de canje">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs text-zinc-400 font-medium">
          <span className="text-white font-bold">{promo.title}</span> · {promo.businessName}
        </p>

        {error && (
          <p className="text-sm text-red-400 font-bold py-8">No se pudo generar el código. Revisa tu conexión.</p>
        )}

        {!error && !redemption && (
          <div className="flex items-center gap-2 text-zinc-400 py-10">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Generando tu código…</span>
          </div>
        )}

        {/* Paso de PAGO (cuando la oferta tiene precio): pagar y luego ver el QR */}
        {redemption && payStep === 'loading' && (
          <div className="flex items-center gap-2 text-zinc-400 py-6">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Preparando tu pago seguro…</span>
          </div>
        )}
        {redemption && payStep === 'pay' && (
          <div className="w-full space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total a pagar</p>
              <p className="text-3xl font-black text-white mt-1">${price.toLocaleString('es-MX')}</p>
            </div>
            <a
              href={payUrl!}
              target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#009EE3] text-white rounded-[20px] active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
            >
              <span className="flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest">
                {/* Logo oficial de Mercado Pago; si no carga, el texto lo dice igual */}
                <img
                  src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadopago/logo__small.png"
                  alt="" className="h-5 w-auto rounded bg-white/90 p-0.5"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                Pagar con Mercado Pago
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] opacity-90 flex items-center gap-1">
                <Lock size={9} /> Pago seguro y express
              </span>
            </a>
            <button
              onClick={confirmPurchase}
              className="w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-[18px] font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Ya pagué → ver mi QR
            </button>
            <p className="text-[10px] text-zinc-500 leading-snug text-center">
              Pago procesado por Mercado Pago: tarjeta, dinero en cuenta, transferencia u OXXO.
              iogga nunca ve ni guarda tu tarjeta. Si entras con tu cuenta de Mercado Pago,
              tu tarjeta queda guardada y pagas en un toque.
            </p>
            {redemption.validUntilMs && (
              <p className="text-[11px] font-black text-amber-950 bg-amber-300 rounded-2xl px-4 py-3 leading-snug text-center">
                Tu QR vale hasta el {formatUntil(redemption.validUntilMs)}. Canjéalo antes:
                después de esa hora se cancela y no hay reembolso.
              </p>
            )}
          </div>
        )}
        {redemption && (payStep === 'done' || payStep === 'skip') && (
          <>
            {/* Estado del pago, clarísimo (como el "Pago aprobado" de Mercado Pago) */}
            {price > 0 && paid && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/15 border border-green-500/30">
                <CheckCircle2 size={14} className="text-green-400" />
                <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">Pago confirmado</span>
              </div>
            )}
            {price > 0 && !paid && (
              <div className="w-full space-y-2">
                <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <p className="text-[11px] font-bold text-amber-300 leading-snug">
                    Este QR aún no tiene un pago confirmado. Paga antes de canjearlo en el negocio.
                  </p>
                </div>
                <button
                  onClick={retryPayment}
                  disabled={retryBusy}
                  className="w-full py-3.5 bg-[#009EE3] text-white rounded-[18px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {retryBusy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  Pagar con Mercado Pago
                </button>
              </div>
            )}
            <div className="p-5 bg-white rounded-[32px] shadow-2xl">
              <canvas ref={canvasRef} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Código único</p>
              <p className="text-3xl font-black text-white tracking-[0.4em]">{redemption.code}</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-2">
              <button
                onClick={downloadQR}
                className="py-4 bg-white/5 border border-white/10 text-white rounded-[20px] font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={15} />
                Descargar
              </button>
              <button
                onClick={() => void shareQR()}
                className="py-4 bg-green-500/15 border border-green-500/30 text-green-400 rounded-[20px] font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Send size={15} />
                Por WhatsApp
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[260px]">
              Muestra este QR en el negocio: lo escanean con su cámara iogga y listo.
              Válido hasta el{' '}
              <span className="text-white font-bold">
                {redemption.validUntilMs ? formatUntil(redemption.validUntilMs) : formatUntil(redemption.createdAtMs + 24 * 60 * 60 * 1000)}
              </span>{' '}
              y de <span className="text-white font-bold">un solo uso</span>.
              Después de esa hora se cancela.
            </p>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ---------- Modal del NEGOCIO: cámara estilo Authenticator para validar ----------

export function ValidateCodeModal({ onClose, validatorUid }: { onClose: () => void; validatorUid?: string | null }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canScan = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const validate = async (value: string) => {
    setBusy(true);
    setResult(null);
    const res = await validateRedemption(value, validatorUid);
    setResult(res);
    setBusy(false);
    // Avisar al cliente en su campanita que su canje quedó registrado
    if (res.ok && res.redemption.uid) {
      void sendNotification({
        type: 'system',
        to: res.redemption.uid,
        fromName: res.redemption.businessName,
        title: `Canjeaste ${res.redemption.promoTitle}`,
        message: `${res.redemption.businessName} escaneó tu QR (folio ${res.redemption.code}). ¡Disfruta! Después te pediremos tu calificación.`,
      });
    }
    // Y dejar constancia al NEGOCIO en su campanita (venta + dinero en camino)
    if (res.ok && res.redemption.businessUid) {
      const amt = res.redemption.priceAmount || 0;
      const neto = amt - Math.round(amt * 10) / 100;
      void sendNotification({
        type: 'system',
        to: res.redemption.businessUid,
        fromName: 'iogga',
        title: `Canje registrado: ${res.redemption.promoTitle}`,
        message: amt > 0
          ? `Folio ${res.redemption.code} · ${res.redemption.userName} · $${amt.toLocaleString('es-MX')}. Neto para ti: $${neto.toLocaleString('es-MX')}, se deposita en el próximo corte.`
          : `Folio ${res.redemption.code} · ${res.redemption.userName}. Quedó en tus analíticas.`,
      });
    }
  };

  const startScan = async () => {
    try {
      setResult(null);
      setManualMode(false);
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const hasNative = 'BarcodeDetector' in window;
      const detector = hasNative ? new (window as any).BarcodeDetector({ formats: ['qr_code'] }) : null;
      const canvas = document.createElement('canvas');
      const canvasCtx = canvas.getContext('2d', { willReadFrequently: true })!;

      const readFrame = async (): Promise<string | null> => {
        const video = videoRef.current!;
        if (detector) {
          const codes = await detector.detect(video);
          return codes.length > 0 ? String(codes[0].rawValue || '') : null;
        }
        // Respaldo universal (iPhone): leer el QR con jsQR desde un canvas
        if (!video.videoWidth) return null;
        const scale = Math.min(1, 480 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(imageData.data, imageData.width, imageData.height);
        return found ? found.data : null;
      };

      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const raw = await readFrame();
          if (raw) {
            // Solo aceptamos códigos generados por iogga
            if (raw.startsWith('IOGGA:')) {
              const clean = raw.replace(/^IOGGA:/, '').trim().toUpperCase();
              setCode(clean);
              stopCamera();
              await validate(clean);
              return;
            }
          }
        } catch {
          // seguir intentando
        }
        setTimeout(() => requestAnimationFrame(tick), 120); // ~8 lecturas/seg: fluido sin quemar batería
      };
      requestAnimationFrame(tick);
    } catch {
      // Sin permiso de cámara o sin soporte: pasar a modo manual
      stopCamera();
      setManualMode(true);
    }
  };

  // Estilo Authenticator: la cámara se abre sola al entrar
  useEffect(() => {
    if (canScan) {
      void startScan();
    } else {
      setManualMode(true);
    }
    return stopCamera;
  }, []);

  const reset = () => {
    setResult(null);
    setCode('');
    if (canScan && !manualMode) void startScan();
  };

  return (
    <Overlay
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Escanear canje"
    >
      <div className="space-y-4">
        {scanning && !result && (
          <div className="space-y-3">
            <div className="relative rounded-[24px] overflow-hidden border border-iogga-accent/40">
              <video ref={videoRef} className="w-full aspect-square object-cover" muted playsInline />
              <div className="absolute inset-8 border-2 border-white/60 rounded-3xl pointer-events-none" />
              <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-black text-white uppercase tracking-widest drop-shadow">
                Apunta al QR del cliente
              </p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                setManualMode(true);
              }}
              className="w-full py-3 bg-white/5 border border-white/10 text-zinc-400 rounded-[16px] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Keyboard size={14} />
              Escribir el código a mano
            </button>
          </div>
        )}

        {manualMode && !result && (
          <>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Escribe el código de 6 letras que muestra el cliente.
            </p>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setResult(null);
              }}
              maxLength={6}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full h-16 px-5 rounded-[20px] bg-white/5 border border-white/10 text-white text-center text-2xl font-black tracking-[0.4em] placeholder:text-white/15 focus:ring-2 focus:ring-iogga-accent outline-none uppercase"
            />
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => validate(code)}
                disabled={busy || code.trim().length < 4}
                className="w-full py-4 bg-iogga-accent text-white rounded-[20px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                {busy ? 'Validando…' : 'Validar código'}
              </button>
              {canScan && (
                <button
                  onClick={startScan}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-[16px] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Camera size={14} />
                  Volver a la cámara
                </button>
              )}
            </div>
          </>
        )}

        {busy && !manualMode && !scanning && (
          <div className="flex items-center justify-center gap-2 text-zinc-400 py-8">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Validando…</span>
          </div>
        )}

        <p className="text-[10px] text-zinc-600 leading-relaxed text-center border-t border-white/5 pt-3">
          Tu negocio vive de sus calificaciones: cada canje validado aquí construye tu reputación.
          Las transacciones fuera de iogga no cuentan, no están protegidas y se consideran mala práctica.
        </p>

        {result && (
          <div className="space-y-3">
            <div
              className={`p-6 rounded-[24px] border text-center space-y-2 ${
                result.ok ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex justify-center">
                {result.ok ? (
                  <CheckCircle2 size={40} className="text-green-400" />
                ) : (
                  <XCircle size={40} className="text-red-400" />
                )}
              </div>
              {result.ok ? (
                <>
                  <p className="font-black text-green-400 uppercase tracking-widest text-sm">¡Canje válido!</p>
                  <p className="text-xs text-zinc-300">
                    <span className="font-bold text-white">{result.redemption.userName}</span> canjeó{' '}
                    <span className="font-bold text-white">{result.redemption.promoTitle}</span>
                  </p>
                  {result.redemption.priceAmount > 0 && (
                    <p className="text-2xl font-black text-white pt-1">
                      ${result.redemption.priceAmount.toLocaleString('es-MX')}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Registrado en tus analíticas
                  </p>
                  {result.redemption.priceAmount > 0 && (
                    <p className="text-[10px] text-zinc-400 leading-snug">
                      El dinero de esta venta se te deposita en el siguiente corte de iogga
                      (a la cuenta de tu perfil de negocio). Te avisaremos cuando salga.
                    </p>
                  )}
                </>
              ) : (
                <p className="font-bold text-red-400 text-sm">
                  {result.reason === 'already-used'
                    ? 'Este código ya fue usado.'
                    : result.reason === 'expired'
                      ? 'Este código expiró: la vigencia de la promoción ya terminó.'
                      : result.reason === 'wrong-business'
                        ? 'Este código es de una promoción de otro negocio.'
                        : result.reason === 'not-found'
                          ? 'Código no encontrado. Revísalo.'
                          : 'Error de conexión. Intenta de nuevo.'}
                </p>
              )}
            </div>
            <button
              onClick={reset}
              className="w-full py-4 bg-iogga-accent text-white rounded-[20px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              Escanear otro código
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}
