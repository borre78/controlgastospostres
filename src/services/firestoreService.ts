
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';

import { db } from '../firebase';

import { deleteDoc } from 'firebase/firestore';

export const NEGOCIO_ID = 'postresmila';

const negocioRef = doc(db, 'negocios', NEGOCIO_ID);

export async function verificarAccesoNegocio(uid: string) {
  const miembroRef = doc(
    db,
    'negocios',
    NEGOCIO_ID,
    'miembros',
    uid
  );

  const miembroSnap = await getDoc(miembroRef);

  if (!miembroSnap.exists()) {
    throw new Error('No tienes acceso a este negocio.');
  }

  const miembro = miembroSnap.data();

  if (miembro.uid !== uid || miembro.activo !== true) {
    throw new Error('Tu membresía no está activa o no es válida.');
  }

  return {
    uid,
    rol: miembro.rol as string,
    activo: miembro.activo as boolean,
  };
}

export async function obtenerDocumento(
  coleccion: string,
  id: string
): Promise<DocumentData | null> {
  const referencia = doc(
    db,
    'negocios',
    NEGOCIO_ID,
    coleccion,
    id
  );

  const resultado = await getDoc(referencia);

  return resultado.exists() ? resultado.data() : null;
}

export async function listarDocumentos(
  coleccion: string
): Promise<DocumentData[]> {
  const referencia = collection(
    db,
    'negocios',
    NEGOCIO_ID,
    coleccion
  );

  const resultado = await getDocs(referencia);

  return resultado.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}

export async function guardarDocumento(
  coleccion: string,
  id: string,
  datos: Record<string, unknown>
): Promise<void> {
  const referencia = doc(
    db,
    'negocios',
    NEGOCIO_ID,
    coleccion,
    id
  );

  await setDoc(referencia, datos);
}


export async function eliminarDocumento(
  coleccion: string,
  id: string
): Promise<void> {
  const referencia = doc(
    db,
    'negocios',
    NEGOCIO_ID,
    coleccion,
    id
  );

  await deleteDoc(referencia);
}

export async function guardarDocumentoSeguro(
  coleccion: string,
  id: string,
  datos: Record<string, unknown>
): Promise<void> {
  const referencia = doc(
    db,
    'negocios',
    NEGOCIO_ID,
    coleccion,
    id
  );

  await setDoc(referencia, datos, { merge: false });
}