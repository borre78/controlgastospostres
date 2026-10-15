import React from 'react';
import { Sun, Moon, Database, Sparkles, ChefHat,ChevronDown, LogOut,UserRound  } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';

interface NavbarProps {
  onOpenQuickNew?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setActiveTab }) => {
  const { configuracion, toggleTema, temaActual, insumos } = useApp();
  const cerrarSesion = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    alert('No fue posible cerrar la sesión. Intenta nuevamente.');
  }
};

const [usuarioActual, setUsuarioActual] = useState<User | null>(
  auth.currentUser
);
const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUsuarioActual(user);
    setMenuUsuarioAbierto(false);
  });

  return () => unsubscribe();
}, []);

const nombreUsuario =
  usuarioActual?.displayName ||
  usuarioActual?.email ||
  'Usuario';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo y Nombre */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-950 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                Control de Gastos y Costos
              </h1>
              <span className="hidden md:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                MXN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[160px] sm:max-w-xs">
              {configuracion.nombreNegocio || 'Postres & Finanzas'}
            </p>
          </div>
        </div>

        {/* Acciones del Navbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón PWA Install */}
          <PWAInstallButton />

          {/* Estado de Almacenamiento */}
          <button
            onClick={() => setActiveTab('settings')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition"
            title="Almacenamiento Local Offline Seguro (Preparado para Cloud DB)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">Almacenamiento Local</span>
          </button>

          {/* Botón de Cargar Ejemplo si está vacío */}
          {insumos.length === 0 && (
            <button
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition animate-pulse"
              title="Cargar datos de ejemplo didáctico"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Ver Ejemplo</span>
            </button>
          )}

          {/* Toggle Modo Oscuro */}
          <button
            type="button"
            onClick={toggleTema}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            aria-label="Cambiar tema claro / oscuro"
            title={temaActual === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {temaActual === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            )}
          </button>

          
            {/* Menú del usuario */}
            <div className="relative">
              
              <button
                type="button"
                onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}
                aria-expanded={menuUsuarioAbierto}
                aria-haspopup="menu"
                title={nombreUsuario}
                className="inline-flex items-center justify-center gap-1.5
                  rounded-xl border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800
                  px-2 py-2 sm:px-3
                  text-sm font-medium text-slate-700 dark:text-slate-200
                  hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <UserRound className="h-4 w-4 shrink-0" />

                <span className="hidden sm:inline max-w-[150px] truncate">
                  {nombreUsuario}
                </span>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    menuUsuarioAbierto ? 'rotate-180' : ''
                  }`}
                />
              </button>

                
              {menuUsuarioAbierto && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuUsuarioAbierto(false)}
                  />

                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-52
                      rounded-xl border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-900 p-1.5 shadow-xl"
                  >
                    <div className="border-b border-slate-100 dark:border-slate-800
                      px-3 py-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sesión iniciada como
                      </p>
                      <p className="truncate text-sm font-medium text-slate-800
                        dark:text-slate-100">
                        {nombreUsuario}
                      </p>
                    </div>
              
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setMenuUsuarioAbierto(false);
                        await cerrarSesion();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg
                        px-3 py-2.5 text-sm font-medium text-red-600
                        hover:bg-red-50 dark:text-red-400
                        dark:hover:bg-red-950/40 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>


        </div>
      </div>
    </header>
  );
};
