
import { useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { LoginView } from './LoginView';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      setUser(currentUser);
      setAuthorized(false);
      setError('');

      if (!currentUser) {
        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        const profileRef = doc(db, 'usuarios', currentUser.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!active) return;

        if (!profileSnapshot.exists()) {
          setError(
            'Tu cuenta no tiene un perfil autorizado. Contacta al administrador.'
          );
          return;
        }

        const profile = profileSnapshot.data();

        if (profile.uid !== currentUser.uid) {
          setError('El perfil de usuario no coincide con tu cuenta.');
          return;
        }

        if (profile.activo !== true) {
          setError('Tu cuenta está desactivada. Contacta al administrador.');
          return;
        }

        if (typeof profile.rol !== 'string' || !profile.rol.trim()) {
          setError('Tu cuenta no tiene un rol válido asignado.');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error('Error al validar permisos:', err);
        if (active) {
          setError(
            'No fue posible verificar tus permisos. Comprueba tu conexión e inténtalo de nuevo.'
          );
        }
      } finally {
        if (active) setChecking(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('No fue posible cerrar la sesión. Inténtalo de nuevo.');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        Comprobando sesión y permisos...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Acceso no autorizado
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {error || 'No tienes permiso para entrar a la aplicación.'}
          </p>

          <button
            onClick={cerrarSesion}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
