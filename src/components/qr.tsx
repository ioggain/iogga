import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, CheckCircle2, XCircle, Camera, Loader2 } from 'lucide-react';
import {
  createRedemption,
  validateRedemption,
  type AuthUser,
  type Redemption,
  type ValidationResult,
} from '../lib/firebase';

function Overlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 space-y-5 max-h-[90vh] overflow-y-auto">
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
}: {
  promo: { id: string; title: string; businessName: string };
  user: AuthUser | null;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createRedemption(promo, user)
      .then((r) => {
        if (!cancelled) setRedemption(r);
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
  }, [redemption]);

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

        {redemption && (
          <>
            <div className="p-5 bg-white rounded-[32px] shadow-2xl">
              <canvas ref={canvasRef} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Código único</p>
              <p className="text-3xl font-black text-white tracking-[0.4em]">{redemption.code}</p>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[260px]">
              Muestra este QR en el negocio. Ellos lo escanean (o escriben el código) para validar tu promoción.
              Solo se puede usar <span className="text-white font-bold">una vez</span>.
            </p>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ---------- Modal del NEGOCIO: escanea o escribe el código y lo valida ----------

export function ValidateCodeModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopCamera, []);

  const validate = async (value: string) => {
    setBusy(true);
    setResult(null);
    const res = await validateRedemption(value);
    setResult(res);
    setBusy(false);
  };

  const startScan = async () => {
    try {
      setResult(null);
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const raw = String(codes[0].rawValue || '');
            const clean = raw.replace(/^IOGGA:/, '').trim().toUpperCase();
            setCode(clean);
            stopCamera();
            await validate(clean);
            return;
          }
        } catch {
          // seguir intentando
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      stopCamera();
    }
  };

  return (
    <Overlay
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Validar canje"
    >
      <div className="space-y-4">
        {scanning && (
          <div className="relative rounded-[24px] overflow-hidden border border-white/10">
            <video ref={videoRef} className="w-full aspect-square object-cover" muted playsInline />
            <button
              onClick={stopCamera}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-xs font-bold rounded-full"
            >
              Cancelar escaneo
            </button>
          </div>
        )}

        {!scanning && (
          <>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Escribe el código de 6 letras que muestra el cliente{canScan ? ' o escanéalo con la cámara' : ''}.
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
                  className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-[20px] font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  Escanear QR con cámara
                </button>
              )}
            </div>
          </>
        )}

        {result && (
          <div
            className={`p-5 rounded-[24px] border text-center space-y-2 ${
              result.ok ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex justify-center">
              {result.ok ? (
                <CheckCircle2 size={36} className="text-green-400" />
              ) : (
                <XCircle size={36} className="text-red-400" />
              )}
            </div>
            {result.ok ? (
              <>
                <p className="font-black text-green-400 uppercase tracking-widest text-sm">¡Canje válido!</p>
                <p className="text-xs text-zinc-300">
                  <span className="font-bold text-white">{result.redemption.userName}</span> canjeó{' '}
                  <span className="font-bold text-white">{result.redemption.promoTitle}</span>
                </p>
              </>
            ) : (
              <p className="font-bold text-red-400 text-sm">
                {result.reason === 'already-used'
                  ? 'Este código ya fue usado.'
                  : result.reason === 'not-found'
                    ? 'Código no encontrado. Revísalo.'
                    : 'Error de conexión. Intenta de nuevo.'}
              </p>
            )}
          </div>
        )}
      </div>
    </Overlay>
  );
}
