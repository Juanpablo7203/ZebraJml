import React, { useEffect, useRef, useState } from 'react';
import { OrderItem } from '../../types';

interface CameraScannerModalProps {
  items: OrderItem[];
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDecoded: (sku: string, barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  items,
  isOpen,
  onClose,
  onBarcodeDecoded,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isOpen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .then((stream) => {
            currentStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
            setStreamActive(true);
            setCameraError(null);
          })
          .catch((err) => {
            console.warn('Camera stream error or permission declined:', err);
            setStreamActive(false);
            setCameraError(
              'No se pudo acceder a la cámara o se encuentra en modo simulador de terminal.'
            );
          });
      } else {
        setCameraError('Cámara web no soportada en este entorno.');
      }
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col relative text-white">
        {/* Top Header Bar */}
        <div className="p-3 bg-slate-950/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              qr_code_scanner
            </span>
            <span className="font-bold text-sm">Escáner Óptico de Cámara</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFlashOn(!flashOn)}
              className={`p-1.5 rounded-lg transition-colors ${
                flashOn ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-200'
              }`}
              title="Luz de relleno / Flash"
            >
              <span className="material-symbols-outlined text-[18px]">
                {flashOn ? 'flash_on' : 'flash_off'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {streamActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-2">
                videocam_off
              </span>
              <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              <p className="text-[11px] text-slate-500 mt-2">
                Utilice el emulador táctico abajo para decodificar códigos instantáneamente:
              </p>
            </div>
          )}

          {/* Targeting Laser Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="relative w-56 h-36 border-2 border-dashed border-red-500/80 rounded-lg flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

              {/* Sweeping Red Line */}
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-laser"></div>
            </div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase mt-2 bg-black/60 px-2 py-0.5 rounded">
              Zebra SE4710 2D Imager
            </span>
          </div>
        </div>

        {/* Rapid Test Simulation Strip */}
        <div className="p-3 bg-slate-950 flex flex-col gap-2 z-20">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">touch_app</span>
            Haga clic en un código de prueba para decodificar:
          </span>

          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
            {items.map((item) => (
              <button
                type="button"
                key={item.sku}
                onClick={() => {
                  onBarcodeDecoded(item.sku, item.barcode);
                  onClose();
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-left flex flex-col border border-slate-700 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-400">{item.sku}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.symbology}</span>
                </div>
                <span className="text-[10px] text-slate-300 truncate">{item.description}</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">{item.barcode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
