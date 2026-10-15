
import React, { useRef, useState } from 'react';
import { auth } from '../../firebase';
import { importarRespaldoAFirestore } from '../../services/firestoreImportService';
import { useApp } from '../../context/AppContext';

export function MigracionFirebaseView() {
const { migrarDatosLocalesAFirebase } = useApp();
const [migrando, setMigrando] = useState(false);

const ejecutarMigracion = async () => {
  setMigrando(true);

  try {
    const resultado = await migrarDatosLocalesAFirebase();
    alert(resultado.mensaje);
  } catch (error) {
    console.error(error);
    alert('No se pudo completar la migración.');
  } finally {
    setMigrando(false);
  }
};


  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const seleccionarArchivo = (
    evento: React.ChangeEvent<HTMLInputElement>
  ) => {
    const seleccionado = evento.target.files?.[0] ?? null;

    setArchivo(seleccionado);
    setMensaje('');
    setError(false);
    setConfirmado(false);
  };

  const ejecutarImportacion = async () => {
    const usuario = auth.currentUser;

    if (!usuario) {
      setError(true);
      setMensaje('Inicia sesión antes de continuar.');
      return;
    }

    if (!archivo) {
      setError(true);
      setMensaje('Selecciona el archivo JSON de respaldo.');
      return;
    }

    if (!confirmado) {
      setError(true);
      setMensaje('Confirma que deseas iniciar la importación.');
      return;
    }

    setProcesando(true);
    setMensaje('');
    setError(false);

    try {
      const contenido = await archivo.text();

      const resultado = await importarRespaldoAFirestore(
        usuario.uid,
        contenido
      );

      setMensaje(
        `${resultado.mensaje} Documentos guardados: ${resultado.documentosPreparados}.`
      );
      setArchivo(null);
      setConfirmado(false);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (e) {
      setError(true);
      setMensaje(
        e instanceof Error
          ? e.message
          : 'No fue posible completar la importación.'
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Migrar datos a Firebase
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Transfiere el respaldo local al negocio PostresMila.
        </p>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        Esta operación no elimina tus datos locales. El importador
        verifica los destinos y se detiene si encuentra documentos
        existentes en las colecciones que va a importar.
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
  <h2 className="text-lg font-semibold">
    Completar datos en Firebase
  </h2>

  <p className="my-2 text-sm">
    Crea los documentos iniciales que falten utilizando
    la información definida en la aplicación.
  </p>

  <button
    type="button"
    disabled={migrando}
    onClick={ejecutarMigracion}
    className="rounded-lg bg-blue-600 px-4 py-2 text-white
               hover:bg-blue-700 disabled:cursor-not-allowed
               disabled:opacity-50"
  >
    {migrando
      ? 'Migrando datos...'
      : 'Crear colecciones y documentos faltantes'}
  </button>
</div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <label className="block text-sm font-semibold">
          Archivo de respaldo JSON
        </label>

        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={seleccionarArchivo}
          disabled={procesando}
          className="block w-full text-sm"
        />

        {archivo && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Archivo seleccionado: {archivo.name}
          </p>
        )}

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
            disabled={procesando || !archivo}
            className="mt-1"
          />
          <span>
            Confirmo que quiero importar el respaldo a PostresMila
            y que conservaré mi archivo original.
          </span>
        </label>

        <button
          type="button"
          onClick={ejecutarImportacion}
          disabled={procesando || !archivo || !confirmado}
          className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? 'Importando...' : 'Importar respaldo a Firebase'}
        </button>

        {mensaje && (
          <div
            role="status"
            className={`rounded-lg p-3 text-sm ${
              error
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {mensaje}
          </div>
        )}
      </div>
    </section>
  );
}

