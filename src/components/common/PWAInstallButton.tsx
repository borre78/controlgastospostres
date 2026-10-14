import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Si ya está instalado como PWA o modo standalone, no mostrar el botón
  if (isInstalled) {
    return null;
  }

  // Flujo Android / Chrome / Computadora
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition active:scale-95"
        title="Instalar como app en tu pantalla de inicio"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Flujo iPhone / iOS Safari
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition active:scale-95"
          title="Instalar en iPhone"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-left">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Instalar en iPhone o iPad
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Úsala como una app nativa, rápida y sin barras
                  </p>
                </div>
              </div>

              <div className="space-y-3 my-5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mt-0.5">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">1. Toca "Compartir"</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      En la barra inferior de Safari, toca el botón de compartir (cuadrado con flecha hacia arriba).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">2. "Agregar a Inicio"</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Desliza hacia abajo en las opciones y selecciona <strong>Agregar al inicio</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">3. Confirma</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Toca <strong>Agregar</strong> en la esquina superior derecha. ¡Listo!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white font-medium text-xs hover:bg-slate-800 dark:hover:bg-amber-600 transition shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Si el navegador soporta instalación directa o se puede añadir como marcador
  return (
    <button
      onClick={() => {
        alert(
          'Para instalar esta aplicación:\n- En Google Chrome: Haz clic en el ícono de instalar en la barra de direcciones o menú (tres puntos) -> "Instalar app".\n- En celular: Menú del navegador -> "Agregar a la pantalla principal".'
        );
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
      title="Instalar PWA"
    >
      <Download className="w-3.5 h-3.5 text-amber-500" />
      <span className="hidden sm:inline">Instalar</span>
    </button>
  );
};
