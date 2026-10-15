
import { useState, type FormEvent } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../firebase';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('Error de inicio de sesión:', firebaseError.code, firebaseError.message);

      switch (firebaseError.code) {
        case 'auth/invalid-credential':
          setError('Las credenciales no son válidas. Comprueba tu contraseña o restablécela.');
          break;
        case 'auth/user-not-found':
          setError('No existe una cuenta con ese correo.');
          break;
        case 'auth/wrong-password':
          setError('La contraseña es incorrecta. Intenta recuperarla.');
          break;
        case 'auth/invalid-email':
          setError('El formato del correo electrónico no es válido.');
          break;
        case 'auth/too-many-requests':
          setError('Hubo demasiados intentos. Espera un momento antes de volver a probar.');
          break;
        case 'auth/network-request-failed':
          setError('No se pudo conectar con Firebase. Revisa tu conexión a internet.');
          break;
        case 'auth/operation-not-allowed':
          setError('El acceso con correo y contraseña no está habilitado en Firebase.');
          break;
        default:
          setError(`No se pudo iniciar sesión. Código: ${firebaseError.code ?? 'desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setResetMessage('');

    if (!email.trim()) {
      setError('Escribe tu correo para recuperar la contraseña.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage('Si el correo está registrado, recibirás instrucciones para recuperar el acceso.');
    } catch {
      setError('No se pudo procesar la recuperación. Verifica el correo e inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl">
            🧁
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Control de Gastos y Costos
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Inicia sesión para continuar
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium">
          Correo electrónico
        </label>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="tu@correo.com"
        />

        <label className="mb-1 block text-sm font-medium">
          Contraseña
        </label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Tu contraseña"
        />

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {resetMessage && (
          <p role="status" className="mt-4 text-sm text-green-700 dark:text-green-400">
            {resetMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="mt-4 w-full text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  );
}
