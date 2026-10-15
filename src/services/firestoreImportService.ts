
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../firebase';
import {
  NEGOCIO_ID,
  verificarAccesoNegocio,
} from './firestoreService';

import { auth } from '../firebase';

type Registro = Record<string, unknown>;

type DatosRespaldo = {
  app?: string;
  version?: string;
  configuracion?: Registro;
  insumos?: Registro[];
  recetas?: Registro[];
  productos?: Registro[];
  ventas?: Registro[];
  gastos?: Registro[];
  categorias?: Registro[];
  producciones?: Registro[];
};

const COLECCIONES = [
  'insumos',
  'recetas',
  'productos',
  'ventas',
  'gastos',
  'categorias',
  'producciones',
] as const;

function validarRegistros(
  nombre: string,
  registros: Registro[]
): void {
  const ids = new Set<string>();

  for (const registro of registros) {
    if (
      !registro ||
      typeof registro !== 'object' ||
      typeof registro.id !== 'string' ||
      registro.id.trim() === ''
    ) {
      throw new Error(
        `Hay un registro sin ID válido en "${nombre}".`
      );
    }

    if (ids.has(registro.id)) {
      throw new Error(
        `El respaldo contiene el ID duplicado "${registro.id}" en "${nombre}".`
      );
    }

    ids.add(registro.id);
  }
}

export async function importarRespaldoAFirestore(
  uid: string,
  jsonString: string
) {
  let respaldo: DatosRespaldo;

  try {
    respaldo = JSON.parse(jsonString) as DatosRespaldo;
  } catch {
    throw new Error('El archivo no contiene un JSON válido.');
  }

  if (
    !respaldo ||
    typeof respaldo !== 'object' ||
    respaldo.app !== 'Control de Gastos y Costos'
  ) {
    throw new Error(
      'El archivo no corresponde al respaldo esperado.'
    );
  }

  for (const nombre of COLECCIONES) {
    const registros = respaldo[nombre] ?? [];

    if (!Array.isArray(registros)) {
      throw new Error(
        `La sección "${nombre}" no es una lista válida.`
      );
    }

    validarRegistros(nombre, registros);
  }

  if (
    !respaldo.configuracion ||
    typeof respaldo.configuracion !== 'object' ||
    Array.isArray(respaldo.configuracion)
  ) {
    throw new Error(
      'El respaldo no contiene una configuración válida.'
    );
  }

  if (!auth.currentUser || auth.currentUser.uid !== uid) {
  throw new Error(
    'La sesión actual no coincide con el usuario que solicita la importación.'
  );
}

  const miembro = await verificarAccesoNegocio(uid);

  if (miembro.rol !== 'admin') {
    throw new Error(
      'Solo un administrador puede importar respaldos.'
    );
  }

  const negocioRef = doc(db, 'negocios', NEGOCIO_ID);
  const negocioSnap = await getDoc(negocioRef);

  if (
    !negocioSnap.exists() ||
    negocioSnap.data().activo !== true
  ) {
    throw new Error(
      'El negocio no existe o está desactivado.'
    );
  }

  const pendientes: Array<{
    coleccion: string;
    id: string;
    datos: Registro;
  }> = [];

  for (const nombre of COLECCIONES) {
  for (const registro of respaldo[nombre] ?? []) {
    pendientes.push({
      coleccion: nombre,
      id: registro.id as string,
      datos: registro,
    });
  }
}

 
const configuracionRef = doc(
  db,
  'negocios',
  NEGOCIO_ID,
  'configuracion',
  'general'
);

const configuracionExistente = await getDoc(configuracionRef);

if (!configuracionExistente.exists()) {
  pendientes.push({
    coleccion: 'configuracion',
    id: 'general',
    datos: {
      ...respaldo.configuracion,
      nombreNegocio: 'PostresMila',
    },
  });
}


  if (pendientes.length > 500) {
    throw new Error(
      'El respaldo supera los 500 documentos. ' +
      'Necesitamos preparar una importación por etapas.'
    );
  }

  // Verificar primero todos los destinos.
  // Esta revisión no modifica ni elimina documentos.
  for (const item of pendientes) {
    const referencia = doc(
      db,
      'negocios',
      NEGOCIO_ID,
      item.coleccion,
      item.id
    );

    const existente = await getDoc(referencia);

    if (existente.exists()) {
      throw new Error(
        `Ya existe ${item.coleccion}/${item.id}. ` +
        'No se ha iniciado la importación.'
      );
    }
  }

  // Confirmar que las colecciones no tengan documentos
  // ajenos al respaldo que puedan quedar mezclados.
  for (const nombre of COLECCIONES) {
    const existentes = await getDocs(
      collection(db, 'negocios', NEGOCIO_ID, nombre)
    );

    if (!existentes.empty) {
      throw new Error(
        `La colección "${nombre}" ya contiene documentos. ` +
        'No se ha iniciado la importación.'
      );
    }
  }

  const batch = writeBatch(db);

  for (const item of pendientes) {
    const referencia = doc(
      db,
      'negocios',
      NEGOCIO_ID,
      item.coleccion,
      item.id
    );

    batch.set(referencia, item.datos);
  }

  // Una sola confirmación para todos los documentos.
  await batch.commit();

  return {
    success: true,
    documentosPreparados: pendientes.length,
    mensaje:
      'Importación terminada. Se conservaron los IDs del respaldo.',
  };
}
