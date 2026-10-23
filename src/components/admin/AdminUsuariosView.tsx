import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import {

  createUserWithEmailAndPassword,

  signOut,

} from 'firebase/auth';

import {

  collection,

  deleteDoc,

  doc,

  getDoc,

  getDocs,

  serverTimestamp,

  setDoc,

  updateDoc,

} from 'firebase/firestore';

import {

  AlertCircle,

  CheckCircle2,

  LoaderCircle,

  Pencil,

  Plus,

  RefreshCw,

  ShieldCheck,

  Trash2,

  UserCheck,

  UserRound,

  UserRoundX,

  X,

} from 'lucide-react';

import { auth, authUsuarios, db } from '../../firebase';
import { useApp } from '../../context/AppContext';

type RolUsuario = 'admin' | 'editor' | 'viewer';

interface Miembro {

  uid: string;

  email: string;

  nombre: string;

  rol: RolUsuario;

  activo: boolean;

  creadoEn?: unknown;

}

const NEGOCIO_ID = 'postresmila';

const ROLES: { value: RolUsuario; label: string; descripcion: string }[] = [

  { value: 'admin', label: 'Administrador', descripcion: 'Acceso y configuración administrativa' },

  { value: 'editor', label: 'Editor', descripcion: 'Puede consultar y modificar información' },

  { value: 'viewer', label: 'Consulta', descripcion: 'Solo puede consultar información' },

];

const mensajeError = (error: unknown): string => {

  const code = (error as { code?: string })?.code;

  switch (code) {

    case 'auth/email-already-in-use': return 'Ese correo ya está registrado en Firebase Authentication.';

    case 'auth/invalid-email': return 'El correo electrónico no tiene un formato válido.';

    case 'auth/weak-password': return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.';

    case 'auth/operation-not-allowed': return 'El método de acceso por correo y contraseña no está habilitado en Firebase Authentication.';

    case 'permission-denied':

    case 'firestore/permission-denied': return 'Firebase rechazó la operación. Revisa las reglas de Firestore y confirma que tu usuario tenga rol admin y esté activo.';

    case 'auth/network-request-failed': return 'No se pudo conectar con Firebase. Revisa tu conexión e inténtalo de nuevo.';

    default: return (error as { message?: string })?.message || 'Ocurrió un error inesperado.';

  }

};

export function AdminUsuariosView() {

  const { confirmarAccion } = useApp();

  const [miembroActual, setMiembroActual] = useState<Miembro | null>(null);

  const [usuarios, setUsuarios] = useState<Miembro[]>([]);

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState('');

  const [exito, setExito] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busqueda, setBusqueda] = useState('');

  const [nombre, setNombre] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [rolNuevo, setRolNuevo] = useState<RolUsuario>('editor');

  const [editandoUid, setEditandoUid] = useState<string | null>(null);

  const [nombreEdicion, setNombreEdicion] = useState('');

  const [emailEdicion, setEmailEdicion] = useState('');

  const [rolEdicion, setRolEdicion] = useState<RolUsuario>('editor');

  const cargarUsuarios = useCallback(async () => {

    setCargando(true);

    setError('');

    try {

      const usuario = auth.currentUser;

      if (!usuario) {

        setMiembroActual(null);

        setUsuarios([]);

        setError('No se encontró una sesión activa. Inicia sesión nuevamente.');

        return;

      }

      const refActual = doc(db, 'negocios', NEGOCIO_ID, 'miembros', usuario.uid);

      const snapActual = await getDoc(refActual);

      if (!snapActual.exists()) {

        setMiembroActual(null);

        setUsuarios([]);

        setError('No se encontró tu perfil de miembro en PostresMila.');

        return;

      }

      const datosActuales = snapActual.data();

      const actual: Miembro = {

        uid: usuario.uid,

        email: String(datosActuales.email ?? usuario.email ?? ''),

        nombre: String(datosActuales.nombre ?? ''),

        rol: datosActuales.rol as RolUsuario,

        activo: datosActuales.activo === true,

      };

      setMiembroActual(actual);

      if (actual.rol !== 'admin' || !actual.activo) {

        setUsuarios([]);

        return;

      }

      const snapshot = await getDocs(collection(db, 'negocios', NEGOCIO_ID, 'miembros'));

      const lista: Miembro[] = snapshot.docs.map((item) => {

        const data = item.data();

        return {

          uid: item.id,

          email: String(data.email ?? ''),

          nombre: String(data.nombre ?? ''),

          rol: data.rol as RolUsuario,

          activo: data.activo === true,

          creadoEn: data.creadoEn,

        };

      });

      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

      setUsuarios(lista);

    } catch (err) {

      console.error('Error al cargar usuarios:', err);

      setError(mensajeError(err));

    } finally {

      setCargando(false);

    }

  }, []);

  useEffect(() => {

    void cargarUsuarios();

  }, [cargarUsuarios]);

  const esAdmin = miembroActual?.rol === 'admin' && miembroActual.activo;

  const usuariosFiltrados = useMemo(() => {

    const texto = busqueda.trim().toLocaleLowerCase('es-MX');

    if (!texto) return usuarios;

    return usuarios.filter((u) =>

      `${u.nombre} ${u.email} ${u.rol} ${u.uid}`.toLocaleLowerCase('es-MX').includes(texto),

    );

  }, [usuarios, busqueda]);

  const limpiarFormulario = () => {

    setNombre('');

    setEmail('');

    setPassword('');

    setRolNuevo('editor');

    setMostrarFormulario(false);

  };

  const crearUsuario = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    if (!esAdmin || guardando) return;

    setGuardando(true);

    setError('');

    setExito('');

    let uidCreado: string | null = null;

    try {

      const credencial = await createUserWithEmailAndPassword(

        authUsuarios,

        email.trim().toLowerCase(),

        password,

      );

      uidCreado = credencial.user.uid;

      await setDoc(doc(db, 'negocios', NEGOCIO_ID, 'miembros', uidCreado), {

        uid: uidCreado,

        email: email.trim().toLowerCase(),

        nombre: nombre.trim(),

        rol: rolNuevo,

        activo: true,

        creadoEn: serverTimestamp(),

      });

      setExito(`Se creó correctamente el usuario ${email.trim().toLowerCase()}.`);

      limpiarFormulario();

      await cargarUsuarios();

    } catch (err) {

      console.error('Error al crear usuario:', err);

      if (uidCreado) {

        setError(`La cuenta de autenticación se creó, pero no se pudo guardar su membresía en Firestore. ${mensajeError(err)} El usuario podría necesitar eliminarse desde Firebase Authentication antes de intentar crearlo otra vez.`);

      } else {

        setError(mensajeError(err));

      }

    } finally {

      try {

        if (authUsuarios.currentUser) await signOut(authUsuarios);

      } catch (err) {

        console.warn('No se pudo cerrar la sesión secundaria de Firebase:', err);

      }

      setGuardando(false);

    }

  };

  const iniciarEdicion = (usuario: Miembro) => {

    setEditandoUid(usuario.uid);

    setNombreEdicion(usuario.nombre);

    setEmailEdicion(usuario.email);

    setRolEdicion(usuario.rol);

    setError('');

    setExito('');

  };

  const guardarEdicion = async (usuario: Miembro) => {

    if (!esAdmin || guardando) return;

    if (!nombreEdicion.trim()) {

      setError('El nombre no puede quedar vacío.');

      return;

    }

    if (!emailEdicion.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEdicion.trim())) {

      setError('Escribe un correo electrónico válido.');

      return;

    }

    setGuardando(true);

    setError('');

    setExito('');

    try {

      await updateDoc(doc(db, 'negocios', NEGOCIO_ID, 'miembros', usuario.uid), {

        nombre: nombreEdicion.trim(),

        email: emailEdicion.trim().toLowerCase(),

        rol: rolEdicion,

      });

      setExito(`Se actualizaron los datos de ${emailEdicion.trim().toLowerCase()}.`);

      setEditandoUid(null);

      await cargarUsuarios();

    } catch (err) {

      console.error('Error al editar usuario:', err);

      setError(mensajeError(err));

    } finally {

      setGuardando(false);

    }

  };

  const cambiarEstado = async (usuario: Miembro) => {

    if (!esAdmin || guardando) return;

    if (usuario.uid === auth.currentUser?.uid) {

      setError('No puedes desactivar tu propia cuenta desde este módulo.');

      return;

    }

    if (usuario.activo && usuario.rol === 'admin') {

      const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo).length;

      if (adminsActivos <= 1) {

        setError('No puedes desactivar al último administrador activo.');

        return;

      }

    }

    const accion = usuario.activo ? 'desactivar' : 'activar';

    if (!(await confirmarAccion(`¿Deseas ${accion} el acceso de ${usuario.nombre || usuario.email}?`, `${accion[0].toUpperCase()}${accion.slice(1)} usuario`))) return;

    setGuardando(true);

    setError('');

    setExito('');

    try {

      await updateDoc(doc(db, 'negocios', NEGOCIO_ID, 'miembros', usuario.uid), {

        activo: !usuario.activo,

      });

      setExito(`El usuario quedó ${usuario.activo ? 'desactivado' : 'activado'}.`);

      await cargarUsuarios();

    } catch (err) {

      console.error('Error al cambiar estado del usuario:', err);

      setError(mensajeError(err));

    } finally {

      setGuardando(false);

    }

  };

  const eliminarUsuario = async (usuario: Miembro) => {

    if (!esAdmin || guardando) return;

    if (usuario.uid === auth.currentUser?.uid) {

      setError('No puedes eliminar tu propia membresía.');

      return;

    }

    if (usuario.rol === 'admin' && usuario.activo) {

      const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo).length;

      if (adminsActivos <= 1) {

        setError('No puedes eliminar al último administrador activo.');

        return;

      }

    }

    const confirmado = await confirmarAccion(

      `¿Eliminar el acceso de ${usuario.nombre || usuario.email}?\n\nEsto elimina su membresía de PostresMila, pero no elimina su cuenta de Firebase Authentication.`,

      'Eliminar usuario'
    );

    if (!confirmado) return;

    setGuardando(true);

    setError('');

    setExito('');

    try {

      await deleteDoc(doc(db, 'negocios', NEGOCIO_ID, 'miembros', usuario.uid));

      setExito(`Se eliminó la membresía de ${usuario.email}. Su cuenta de Firebase Authentication permanece registrada.`);

      await cargarUsuarios();

    } catch (err) {

      console.error('Error al eliminar membresía:', err);

      setError(mensajeError(err));

    } finally {

      setGuardando(false);

    }

  };

  if (cargando && !miembroActual) {

    return <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" /> Verificando permisos...</div>;

  }

  if (!esAdmin) {

    return (

      <section className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900 dark:bg-slate-900">

        <div className="flex items-start gap-3">

          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-rose-500" />

          <div>

            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Acceso restringido</h1>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Solo un usuario con rol de administrador activo puede administrar las cuentas de PostresMila.</p>

            {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}

            <button onClick={() => void cargarUsuarios()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><RefreshCw className="h-4 w-4" /> Volver a verificar</button>

          </div>

        </div>

      </section>

    );

  }

  return (

    <div className="mx-auto w-full max-w-6xl space-y-6">

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Administración</span></div>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Usuarios y permisos</h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Administra quién puede entrar a PostresMila y qué nivel de acceso tiene.</p>

        </div>

        <button onClick={() => { setMostrarFormulario((v) => !v); setError(''); setExito(''); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"><Plus className="h-4 w-4" /> Nuevo usuario</button>

      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span><button className="ml-auto" aria-label="Cerrar error" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}

      {exito && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{exito}</span><button className="ml-auto" aria-label="Cerrar mensaje" onClick={() => setExito('')}><X className="h-4 w-4" /></button></div>}

      {mostrarFormulario && (

        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900/70 dark:bg-slate-900 sm:p-6">

          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900 dark:text-white">Crear cuenta</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">La contraseña se utiliza para registrar la cuenta en Firebase Authentication.</p></div><button onClick={limpiarFormulario} aria-label="Cerrar formulario" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div>

          <form onSubmit={crearUsuario} className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre completo</span><input required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del usuario" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-900/40" /></label>

            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Correo electrónico</span><input required type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario\@correo.com" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-900/40" /></label>

            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Contraseña temporal</span><input required minLength={6} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-900/40" /></label>

            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Rol inicial</span><select value={rolNuevo} onChange={(e) => setRolNuevo(e.target.value as RolUsuario)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row md:col-span-2 md:justify-end"><button type="button" onClick={limpiarFormulario} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button><button type="submit" disabled={guardando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">{guardando ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}{guardando ? 'Creando usuario...' : 'Crear usuario'}</button></div>

          </form>

        </section>

      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><UserRound className="h-4 w-4" /><span className="text-xs font-semibold">Total de usuarios</span></div><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{usuarios.length}</p></div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><UserCheck className="h-4 w-4" /><span className="text-xs font-semibold">Acceso activo</span></div><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{usuarios.filter((u) => u.activo).length}</p></div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-semibold">Administradores activos</span></div><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{usuarios.filter((u) => u.activo && u.rol === 'admin').length}</p></div>

      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="font-bold text-slate-900 dark:text-white">Cuentas registradas</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No puedes editar ni eliminar tu propia membresía desde esta pantalla.</p></div><div className="flex gap-2"><input aria-label="Buscar usuarios" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar usuario..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-64" /><button onClick={() => void cargarUsuarios()} disabled={cargando || guardando} aria-label="Actualizar lista" title="Actualizar lista" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} /></button></div></div>

        {cargando ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Cargando usuarios...</div> : usuariosFiltrados.length === 0 ? <div className="p-10 text-center"><UserRoundX className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No se encontraron usuarios</p><p className="mt-1 text-xs text-slate-500">Prueba con otro texto o registra un usuario nuevo.</p></div> : (

          <div className="divide-y divide-slate-100 dark:divide-slate-800">

            {usuariosFiltrados.map((usuario) => {

              const esPropio = usuario.uid === auth.currentUser?.uid;

              const editando = editandoUid === usuario.uid;

              const rolInfo = ROLES.find((r) => r.value === usuario.rol);

              return <article key={usuario.uid} className="p-4 sm:p-5">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                  <div className="flex min-w-0 items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${usuario.activo ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}><UserRound className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-bold text-slate-900 dark:text-white">{usuario.nombre || '(Sin nombre)'}</p>{esPropio && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">Tu cuenta</span>}<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${usuario.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{usuario.activo ? 'Activo' : 'Desactivado'}</span></div><p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{usuario.email || 'Sin correo guardado'}</p><p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{rolInfo?.label ?? usuario.rol ?? 'Sin rol'} · UID: {usuario.uid}</p></div></div>

                  {!esPropio && <div className="flex flex-wrap items-center gap-2 xl:justify-end">{!editando && <><button onClick={() => iniciarEdicion(usuario)} disabled={guardando} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /> Editar</button><button onClick={() => void cambiarEstado(usuario)} disabled={guardando} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${usuario.activo ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40'}`}>{usuario.activo ? <UserRoundX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}{usuario.activo ? 'Desactivar' : 'Activar'}</button><button onClick={() => void eliminarUsuario(usuario)} disabled={guardando} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 className="h-3.5 w-3.5" /> Quitar acceso</button></>}</div>}

                </div>

                {editando && <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_220px_auto]"><label><span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nombre completo</span><input value={nombreEdicion} maxLength={100} onChange={(e) => setNombreEdicion(e.target.value)} placeholder="Nombre del usuario" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label><label><span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Correo electrónico</span><input type="email" value={emailEdicion} onChange={(e) => setEmailEdicion(e.target.value)} placeholder="usuario@correo.com" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">Solo actualiza el correo mostrado en la membresía, no el correo de inicio de sesión.</span></label><label><span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Rol</span><select value={rolEdicion} onChange={(e) => setRolEdicion(e.target.value as RolUsuario)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white">{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label><div className="flex items-end gap-2"><button onClick={() => void guardarEdicion(usuario)} disabled={guardando} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50">{guardando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Guardar</button><button onClick={() => setEditandoUid(null)} disabled={guardando} aria-label="Cancelar edición" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900"><X className="h-4 w-4" /></button></div></div>}

              </article>;

            })}

          </div>

        )}

      </section>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-relaxed text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200"><strong>Importante:</strong> quitar acceso elimina únicamente el documento de membresía de PostresMila; no borra la cuenta del proveedor de autenticación. Cambiar el correo aquí no está habilitado porque el correo de acceso debe modificarse por separado en Firebase Authentication.</div>

    </div>

  );

}
