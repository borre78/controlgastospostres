import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Insumo,
  Receta,
  ProductoVenta,
  PresentacionComercial,
  Venta,
  Gasto,
  CategoriaGasto,
  ConfiguracionApp,
  RegistroProduccion,
  Cliente,
  Pedido,
} from '../types';
import { CATEGORIAS_DEFAULT, CONFIGURACION_DEFAULT } from '../data/defaultData';
import {
  SAMPLE_INSUMOS,
  SAMPLE_RECETAS,
  SAMPLE_PRODUCTOS,
  SAMPLE_GASTOS,
  SAMPLE_VENTAS,
} from '../data/sampleBakeryData';
import { calcularPrecioRecomendado } from '../utils/formatters';
import { normalizarFoliosPedidos, obtenerSiguienteFolioPedido } from '../utils/orderNumbering';

import { auth } from '../firebase';
import {
  listarDocumentos,
  obtenerDocumento,
  verificarAccesoNegocio,
  guardarDocumento,
  eliminarDocumento,
} from '../services/firestoreService';

const obtenerUsuarioAutorizado = async () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error('Debes iniciar sesión para guardar los cambios.');
  }

  await verificarAccesoNegocio(usuario.uid);
  return usuario;
}

const leerListaLocal = <T,>(clave: string): T[] => {
  try {
    const valor = localStorage.getItem(clave);
    const datos = valor ? JSON.parse(valor) : [];
    return Array.isArray(datos) ? datos as T[] : [];
  } catch { return []; }
};

interface AppContextType {
  // Estado
  insumos: Insumo[];
  recetas: Receta[];
  productos: ProductoVenta[];
  ventas: Venta[];
  clientes: Cliente[];
  pedidos: Pedido[];
  gastos: Gasto[];
  categorias: CategoriaGasto[];
  producciones: RegistroProduccion[];
  configuracion: ConfiguracionApp;
  isLoaded: boolean;
  loadError: string | null;
  temaActual: 'light' | 'dark';

  // Insumos
  addInsumo: (insumo: Omit<Insumo, 'id' | 'fechaActualizacion'>) => void;
  updateInsumo: (id: string, insumo: Partial<Insumo>) => void;
  deleteInsumo: (id: string) => boolean;
  ajustarStockInsumo: (id: string, nuevoStock: number, motivo?: string) => void;
  reabastecerInsumo: (
    id: string,
    cantidadCompra: number,
    precioCompra: number,
    crearGastoAutomatico?: boolean,
    formaPago?: Gasto['formaPago']
  ) => void;

  // Recetas
  addReceta: (receta: Omit<Receta, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => Receta;
  updateReceta: (id: string, receta: Partial<Receta>) => void;
  deleteReceta: (id: string) => boolean;
  recalcularTodasLasRecetas: () => void;

  // Productos y Presentaciones Comerciales
  addProducto: (producto: Omit<ProductoVenta, 'id'>) => ProductoVenta;
  updateProducto: (id: string, producto: Partial<ProductoVenta>) => void;
  deleteProducto: (id: string) => boolean;
  addPresentacionAProducto: (
    productoId: string,
    presentacion: Omit<PresentacionComercial, 'id'>
  ) => void;
  updatePresentacion: (
    productoId: string,
    presentacionId: string,
    cambios: Partial<PresentacionComercial>
  ) => void;
  deletePresentacion: (productoId: string, presentacionId: string) => boolean;

  // Ventas
  addVenta: (venta: Omit<Venta, 'id'>, descontarStock?: boolean) => {success: boolean; mensaje: string;};
  updateVenta: (id: string, cambios: Partial<Venta>) => {success: boolean; mensaje: string;};
  deleteVenta: (id: string) => void;
  marcarVentaCobrada: (id: string, formaPago: Gasto['formaPago']) => void;
  addCliente: (cliente: Omit<Cliente, 'id'>) => Cliente;
  updateCliente: (id: string, cambios: Partial<Cliente>) => void;
  deleteCliente: (id: string) => boolean;
  addPedido: (pedido: Omit<Pedido, 'id' | 'folio'>) => void;
  generarSiguienteFolioPedido: () => string;
  updatePedido: (id: string, cambios: Partial<Pedido>) => void;
  deletePedido: (id: string) => boolean;
  mostrarAlerta: (mensaje: string, titulo?: string) => void;
  confirmarAccion: (mensaje: string, titulo?: string) => Promise<boolean>;

  // Gastos
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  registrarCompraHistoricaInsumo: (
    insumo: Insumo,
    fechaCompra: string,
    formaPago: Gasto['formaPago']
  ) => void;
  updateGasto: (id: string, gasto: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;

  // Categorías
  addCategoria: (cat: Omit<CategoriaGasto, 'id'>) => void;
  updateCategoria: (id: string, cat: Partial<CategoriaGasto>) => void;
  deleteCategoria: (id: string) => boolean;

  // Producción
  ejecutarProduccion: (
    recetaId: string,
    tandas: number,
    descontarStock?: boolean,
    sumarStockProductoId?: string,
    sumarStockPresentacionId?: string,
    notas?: string
  ) => {
    success: boolean;
    mensaje: string;
    faltantes?: { nombre: string; requerido: number; disponible: number; unidad: string }[];
  };

  // Configuración y Tema
  updateConfiguracion: (cfg: Partial<ConfiguracionApp>) => void;
  toggleTema: () => void;

  // Gestión de datos
  cargarDatosEjemplo: () => void;
  limpiarSoloEjemplosDemostracion: () => void;
  reiniciarDatos: () => void;
  exportarRespaldoJSON: () => void;
  importarRespaldoJSON: (jsonString: string) => { success: boolean; mensaje: string };
  migrarDatosLocalesAFirebase: () => Promise<{
    success: boolean;
    mensaje: string;
    subidos: number;
    existentes: number;
    omitidos: number;
  }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estados principales
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [producciones, setProducciones] = useState<RegistroProduccion[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionApp>(() => {
    const temaGuardado = localStorage.getItem('preferenciaTema');
    return temaGuardado === 'dark' || temaGuardado === 'light' || temaGuardado === 'system'
      ? { ...CONFIGURACION_DEFAULT, tema: temaGuardado }
      : CONFIGURACION_DEFAULT;
  });
  const [temaActual, setTemaActual] = useState<'light' | 'dark'>('light');
  const [dialogoAplicacion, setDialogoAplicacion] = useState<{ tipo: 'alerta' | 'confirmar'; titulo: string; mensaje: string } | null>(null);
  const resolverDialogo = useRef<((confirmado: boolean) => void) | null>(null);
  const mostrarAlerta = (mensaje: string, titulo = 'Aviso') => setDialogoAplicacion({ tipo: 'alerta', titulo, mensaje });
  const confirmarAccion = (mensaje: string, titulo = 'Confirmar acción') => new Promise<boolean>((resolve) => {
    resolverDialogo.current = resolve;
    setDialogoAplicacion({ tipo: 'confirmar', titulo, mensaje });
  });
  const cerrarDialogoAplicacion = (confirmado = false) => {
    setDialogoAplicacion(null);
    resolverDialogo.current?.(confirmado);
    resolverDialogo.current = null;
  };

  useEffect(() => {
    const recibirAviso = (evento: Event) => {
      const detalle = (evento as CustomEvent<{ mensaje: string; titulo?: string }>).detail;
      mostrarAlerta(detalle.mensaje, detalle.titulo || 'Aviso');
    };
    window.addEventListener('app:mostrar-aviso', recibirAviso);
    return () => window.removeEventListener('app:mostrar-aviso', recibirAviso);
  }, []);




 
  // Carga inicial: Firestore es la única fuente de datos del negocio.
  // No se leen datos locales ni se agregan registros de demostración.
  useEffect(() => {
    let cancelado = false;

    const cargarDesdeFirebase = async () => {
      try {
        const usuario = await obtenerUsuarioAutorizado();
        await verificarAccesoNegocio(usuario.uid);

        const [
          insumosNube,
          recetasNube,
          productosNube,
          ventasNube,
          gastosNube,
          categoriasNube,
          produccionesNube,
          configuracionNube,
        ] = await Promise.all([
          listarDocumentos('insumos'),
          listarDocumentos('recetas'),
          listarDocumentos('productos'),
          listarDocumentos('ventas'),
          listarDocumentos('gastos'),
          listarDocumentos('categorias'),
          listarDocumentos('producciones'),
          obtenerDocumento('configuracion', 'general'),
        ]);

        // Estas colecciones se añadieron después del esquema original. Sus reglas
        // pueden no estar desplegadas todavía; su ausencia no debe bloquear ventas.
        const [clientesNube, pedidosNube] = await Promise.all([
          listarDocumentos('clientes').catch((error) => {
            console.warn('No se pudo leer el catálogo de clientes; se reconstruirá desde ventas:', error);
            return leerListaLocal<Cliente>('clientesLocal');
          }),
          listarDocumentos('pedidos').catch((error) => {
            console.warn('No se pudo leer el historial de pedidos; se reconstruirá desde ventas:', error);
            return leerListaLocal<Pedido>('pedidosLocal');
          }),
        ]);

        if (cancelado) return;

        // Sustituir siempre las listas, incluso si Firebase devuelve [].
        setInsumos(insumosNube as unknown as Insumo[]);
        setRecetas(recetasNube as unknown as Receta[]);
        setProductos(productosNube as unknown as ProductoVenta[]);
        const ventasCargadas = ventasNube as unknown as Venta[];
        const clientesExistentes = clientesNube as unknown as Cliente[];
        const pedidosExistentes = pedidosNube as unknown as Pedido[];
        const clientesPorNombre = new Map(clientesExistentes.map((c) => [c.nombre.trim().toLocaleLowerCase(), c]));
        const hashId = (valor: string) => {
          let hash = 2166136261;
          for (let i = 0; i < valor.length; i++) hash = Math.imul(hash ^ valor.charCodeAt(i), 16777619);
          return (hash >>> 0).toString(36);
        };
        const foliosIniciales = normalizarFoliosPedidos(ventasCargadas, pedidosExistentes);
        const ventasActualizadas = foliosIniciales.ventas;
        setVentas(ventasActualizadas);

        const clientesGenerados = new Map<string, Cliente>();
        for (const venta of ventasActualizadas) {
          const nombreCliente = venta.cliente?.trim();
          if (!nombreCliente) continue;
          const clave = nombreCliente.toLocaleLowerCase();
          if (clientesPorNombre.has(clave)) continue;
          if (!clientesGenerados.has(clave)) clientesGenerados.set(clave, {
            id: `cli-hist-${hashId(clave)}`, nombre: nombreCliente,
            telefono: venta.telefonoCliente || undefined,
          });
        }
        const clientesCargados = [...clientesExistentes, ...clientesGenerados.values()];
        const clienteIdPorNombre = new Map(clientesCargados.map((c) => [c.nombre.trim().toLocaleLowerCase(), c.id]));

        const gruposVentas = new Map<string, Venta[]>();
        for (const venta of ventasActualizadas) {
          const clave = venta.pedidoId || venta.folioPedido || `venta-${venta.id}`;
          gruposVentas.set(clave, [...(gruposVentas.get(clave) || []), venta]);
        }
        const idsPedidoExistentes = new Set(pedidosExistentes.map((p) => p.id));
        const foliosPedidoExistentes = new Set(pedidosExistentes.map((p) => p.folio).filter(Boolean));
        const pedidosHistoricos: Pedido[] = [];
        for (const [clave, renglones] of gruposVentas) {
          const id = clave.startsWith('pedido-hist-') ? clave : `pedido-hist-${hashId(clave)}`;
          if (idsPedidoExistentes.has(id) || idsPedidoExistentes.has(clave) || renglones.some((v) => v.folioPedido && foliosPedidoExistentes.has(v.folioPedido))) continue;
          const primera = renglones[0];
          const nombreCliente = primera.cliente?.trim() || 'Cliente sin nombre';
          const clienteHistorico = primera.cliente
            ? clientesCargados.find((c) => c.id === clienteIdPorNombre.get(nombreCliente.toLocaleLowerCase()))
            : undefined;
          pedidosHistoricos.push({
            id, folio: primera.folioPedido || `HIST-${hashId(clave).toUpperCase()}`,
            fecha: primera.fecha, clienteId: primera.cliente ? clienteIdPorNombre.get(nombreCliente.toLocaleLowerCase()) : undefined,
            clienteNombre: nombreCliente, telefonoCliente: primera.telefonoCliente || clienteHistorico?.telefono,
            correoCliente: clienteHistorico?.correo,
            items: renglones.map((v) => ({ id: v.id, productoId: v.productoId, productoNombre: v.productoNombre,
              presentacionId: v.presentacionId || '', presentacionNombre: v.presentacionNombre || v.productoNombre,
              cantidad: v.cantidad, precioUnitario: v.precioUnitario })),
            estado: 'completado', notas: 'Importado automáticamente del historial de ventas.',
          });
        }
        const pedidosCompletos = [...foliosIniciales.pedidos, ...pedidosHistoricos];
        const datosNormalizados = normalizarFoliosPedidos(ventasActualizadas, pedidosCompletos);
        setVentas(datosNormalizados.ventas);
        setClientes(clientesCargados);
        setPedidos(datosNormalizados.pedidos);
        localStorage.setItem('clientesLocal', JSON.stringify(clientesCargados));
        localStorage.setItem('pedidosLocal', JSON.stringify(datosNormalizados.pedidos));
        localStorage.setItem('ventasLocal', JSON.stringify(datosNormalizados.ventas));
        // Crear solo los documentos históricos que faltan. Las ventas originales no se modifican.
        for (const cliente of clientesGenerados.values()) {
          try { await guardarDocumento('clientes', cliente.id, cliente); }
          catch (error) { console.error('No se pudo guardar cliente histórico:', error); }
        }
        for (const pedido of pedidosHistoricos) {
          try { await guardarDocumento('pedidos', pedido.id, pedido); }
          catch (error) { console.error('No se pudo guardar pedido histórico:', error); }
        }
        for (const venta of datosNormalizados.ventas) {
          const original = ventasCargadas.find((v) => v.id === venta.id);
          if (JSON.stringify(original) === JSON.stringify(venta)) continue;
          try { await guardarDocumento('ventas', venta.id, venta); }
          catch (error) { console.error('No se pudo actualizar folio de venta:', error); }
        }
        for (const pedido of datosNormalizados.pedidos) {
          const original = pedidosExistentes.find((p) => p.id === pedido.id);
          if (!original || JSON.stringify(original) === JSON.stringify(pedido)) continue;
          try { await guardarDocumento('pedidos', pedido.id, pedido); }
          catch (error) { console.error('No se pudo actualizar folio del pedido:', error); }
        }
        setGastos(gastosNube as unknown as Gasto[]);
        setCategorias(categoriasNube as unknown as CategoriaGasto[]);
        setProducciones(produccionesNube as unknown as RegistroProduccion[]);
        setConfiguracion({
          ...CONFIGURACION_DEFAULT,
          ...(configuracionNube || {}),
          ...(!configuracionNube?.tema ? { tema: localStorage.getItem('preferenciaTema') || CONFIGURACION_DEFAULT.tema } : {}),
        } as ConfiguracionApp);

        console.info('Carga inicial desde Firebase completada.');
      } catch (error) {
        console.error('No se pudieron cargar los datos desde Firebase:', error);
        setLoadError(error instanceof Error ? error.message : 'No fue posible leer los datos de Firebase.');
      } finally {
        if (!cancelado) setIsLoaded(true);
      }
    };

    void cargarDesdeFirebase();
    return () => { cancelado = true; };
  }, []);

  // Sincronización incremental con Firestore.
  // La primera fotografía se toma después de cargar Firebase para evitar
  // sincronizar estados iniciales antes de terminar la lectura.
  const ultimaFotoNube = useRef<{
    insumos: Insumo[];
    recetas: Receta[];
    productos: ProductoVenta[];
    ventas: Venta[];
    clientes: Cliente[];
    pedidos: Pedido[];
    gastos: Gasto[];
    categorias: CategoriaGasto[];
    producciones: RegistroProduccion[];
    configuracion: ConfiguracionApp;
  } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const actual = {
      insumos, recetas, productos, ventas, clientes, pedidos, gastos, categorias, producciones, configuracion
    };

    // Establecer línea base después de completar la lectura de Firebase.
    if (ultimaFotoNube.current === null) {
      ultimaFotoNube.current = actual;
      return;
    }

    const anterior = ultimaFotoNube.current;
    // Actualizar la fotografía inmediatamente para evitar duplicados en renders.
    ultimaFotoNube.current = actual;

    const sincronizarLista = async <T extends { id: string },>(
      coleccion: string,
      previos: T[],
      nuevos: T[]
    ) => {
      const prevMap = new Map(previos.map((item) => [item.id, item]));
      const nextMap = new Map(nuevos.map((item) => [item.id, item]));

      for (const [id, item] of nextMap) {
        const previo = prevMap.get(id);
        if (JSON.stringify(previo) !== JSON.stringify(item)) {
          try {
            await obtenerUsuarioAutorizado();
            await guardarDocumento(coleccion, id, item);
          } catch (error) {
            console.error(`No se pudo guardar ${coleccion}/${id} en Firebase:`, error);
            if (coleccion === 'clientes') localStorage.setItem('clientesLocal', JSON.stringify(nuevos));
            if (coleccion === 'pedidos') localStorage.setItem('pedidosLocal', JSON.stringify(nuevos));
          }
        }
      }

      // Solo borrar documentos que existían en la fotografía previa.
      for (const [id] of prevMap) {
        if (!nextMap.has(id)) {
          try {
            await obtenerUsuarioAutorizado();
            await eliminarDocumento(coleccion, id);
          } catch (error) {
            console.error(`No se pudo eliminar ${coleccion}/${id} en Firebase:`, error);
          }
        }
      }
    };

    void sincronizarLista('insumos', anterior.insumos, actual.insumos);
    void sincronizarLista('recetas', anterior.recetas, actual.recetas);
    void sincronizarLista('productos', anterior.productos, actual.productos);
    void sincronizarLista('ventas', anterior.ventas, actual.ventas);
    void sincronizarLista('clientes', anterior.clientes, actual.clientes);
    void sincronizarLista('pedidos', anterior.pedidos, actual.pedidos);
    void sincronizarLista('gastos', anterior.gastos, actual.gastos);
    void sincronizarLista('categorias', anterior.categorias, actual.categorias);
    void sincronizarLista('producciones', anterior.producciones, actual.producciones);

    if (JSON.stringify(anterior.configuracion) !== JSON.stringify(actual.configuracion)) {
      void (async () => {
        try {
          await obtenerUsuarioAutorizado();
          await guardarDocumento('configuracion', 'general', actual.configuracion);
        } catch (error) {
          console.error('No se pudo guardar la configuración en Firebase:', error);
        }
      })();
    }
  }, [
    isLoaded, insumos, recetas, productos, ventas, clientes, pedidos, gastos,
    categorias, producciones, configuracion
  ]);

  // Manejo de tema (Claro / Oscuro)
  useEffect(() => {
    localStorage.setItem('preferenciaTema', configuracion.tema);
    const root = document.documentElement;
    let effectiveTema: 'light' | 'dark' = 'light';

    if (configuracion.tema === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTema = prefersDark ? 'dark' : 'light';
    } else {
      effectiveTema = configuracion.tema;
    }

    setTemaActual(effectiveTema);

    if (effectiveTema === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [configuracion.tema]);

  // ==================== INSUMOS ====================

  const addInsumo = (insumoData: Omit<Insumo, 'id' | 'fechaActualizacion'>) => {
    const id = `ins-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nuevo: Insumo = {
      ...insumoData,
      id,
      fechaActualizacion: new Date().toISOString().split('T')[0],
    };
    setInsumos((prev) => [nuevo, ...prev]);
  };

  const updateInsumo = (id: string, cambios: Partial<Insumo>) => {
    setInsumos((prev) =>
      prev.map((ins) => {
        if (ins.id !== id) return ins;
        return {
          ...ins,
          ...cambios,
          fechaActualizacion: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteInsumo = (id: string): boolean => {
    const usadaEnRecetas = recetas.filter((r) =>
      (r.ingredientes || []).some((i) => i.insumoId === id) ||
      (r.empaques || []).some((e) => e.insumoId === id) ||
      (r.desechables || []).some((e) => e.insumoId === id) ||
      (r.otrosInsumos || []).some((e) => e.insumoId === id)
    );
    const usadaEnPresentaciones = productos.some((p) =>
      p.presentaciones.some((pres) => pres.empaques.some((emp) => emp.insumoId === id))
    );

    if (usadaEnRecetas.length > 0 || usadaEnPresentaciones) {
      return false;
    }
    setInsumos((prev) => prev.filter((i) => i.id !== id));
    return true;
  };

  const ajustarStockInsumo = (id: string, nuevoStock: number) => {
    setInsumos((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, stockActual: Math.max(0, nuevoStock) } : ins))
    );
  };

  const reabastecerInsumo = (
    id: string,
    cantidadCompra: number,
    precioCompra: number,
    crearGastoAutomatico = true,
    formaPago: Gasto['formaPago'] = 'efectivo'
  ) => {
    const insumo = insumos.find((i) => i.id === id);
    if (!insumo) return;

    let incrementoUnidadUso = cantidadCompra;
    if (insumo.unidadCompra === 'kg') {
      incrementoUnidadUso = cantidadCompra * 1000;
    } else if (insumo.unidadCompra === 'litro') {
      incrementoUnidadUso = cantidadCompra * 1000;
    } else if (insumo.unidadCompra === 'paquete') {
      incrementoUnidadUso =
        cantidadCompra * Math.max(1, insumo.piezasPorPaquete ?? 1);
    }

    const nuevoCostoUnitario = precioCompra / incrementoUnidadUso;

    setInsumos((prev) =>
      prev.map((ins) => {
        if (ins.id !== id) return ins;
        return {
          ...ins,
          cantidadCompra,
          precioCompra,
          costoPorUnidadUso: nuevoCostoUnitario,
          stockActual: ins.stockActual + incrementoUnidadUso,
          fechaActualizacion: new Date().toISOString().split('T')[0],
        };
      })
    );

    if (crearGastoAutomatico) {
      addGasto({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: `Compra insumo: ${insumo.nombre} (${cantidadCompra} ${insumo.unidadCompra})`,
        categoriaId: insumo.tipo === 'empaque' ? 'cat-empaques' : 'cat-ingredientes',
        categoriaNombre: insumo.tipo === 'empaque' ? 'Empaques, Cajas y Desechables' : 'Ingredientes y Materia Prima',
        importe: precioCompra,
        formaPago,
        ambito: 'negocio',
        tipoGastoNegocio: 'inventario_materia_prima',
        insumoIdRelacionado: id,
        notas: `Reabastecimiento catálogo. Proveedor: ${insumo.proveedor || 'N/A'}`,
      });
    }
  };

  // ==================== RECETAS ====================

  const addReceta = (
    recetaData: Omit<Receta, 'id' | 'fechaCreacion' | 'fechaModificacion'>
  ): Receta => {
    const now = new Date().toISOString().split('T')[0];
    const nueva: Receta = {
      ...recetaData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fechaCreacion: now,
      fechaModificacion: now,
    };
    setRecetas((prev) => [nueva, ...prev]);
    return nueva;
  };

  const updateReceta = (id: string, cambios: Partial<Receta>) => {
    setRecetas((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          ...cambios,
          fechaModificacion: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteReceta = (id: string): boolean => {
    const vinculadaAProductos = productos.filter((p) => p.recetaId === id);
    if (vinculadaAProductos.length > 0) {
      return false;
    }
    setRecetas((prev) => prev.filter((r) => r.id !== id));
    return true;
  };

  // Recalcular recetas y automáticamente todas las presentaciones de productos
  const recalcularTodasLasRecetas = () => {
    const insumoMap = new Map(insumos.map((i) => [i.id, i.costoPorUnidadUso]));

    // 1. Recalcular costos de recetas
    const nuevasRecetas = recetas.map((receta) => {
      let costoIngredientes = 0;
      const nuevosIngredientes = receta.ingredientes.map((ing) => {
        const costoUnit = insumoMap.get(ing.insumoId) || 0;
        const costoCalculado = ing.cantidad * costoUnit;
        costoIngredientes += costoCalculado;
        return { ...ing, costoCalculado };
      });      

      let costoDesechables = 0;
      const nuevosDesechables = (receta.desechables || []).map((item) => {
        const costoUnit = insumoMap.get(item.insumoId) || 0;
        const costoCalculado = item.cantidad * costoUnit;
        costoDesechables += costoCalculado;
        return { ...item, costoCalculado };
      });

      let costoOtrosInsumos = 0;
      const nuevosOtrosInsumos = (receta.otrosInsumos || []).map((item) => {
        const costoUnit = insumoMap.get(item.insumoId) || 0;
        const costoCalculado = item.cantidad * costoUnit;
        costoOtrosInsumos += costoCalculado;
        return { ...item, costoCalculado };
      });

      const costoIndirectos =
        (receta.indirectos?.costoGas || 0) +
        (receta.indirectos?.costoLuz || 0) +
        (receta.indirectos?.costoManoObra || 0) +
        (receta.indirectos?.otrosCostosFijos || 0);

      const costoTotalReceta = costoIngredientes + costoIndirectos;
      const rendimiento = receta.rendimientoCantidad > 0 ? receta.rendimientoCantidad : 1;
      const costoPorUnidad = costoTotalReceta / rendimiento;

      return {
        ...receta,
        ingredientes: nuevosIngredientes,
        empaques: [],
        desechables: [],
        otrosInsumos:[],
        costoIngredientes,
        costoEmpaques: 0,
        costoDesechables: 0,
        costoOtrosInsumos: 0,
        costoIndirectos,
        costoTotalReceta,
        costoPorUnidad,
        fechaModificacion: new Date().toISOString().split('T')[0],
      };
    });

    setRecetas(nuevasRecetas);

    // 2. Recalcular todas las presentaciones de todos los productos
    const recetaCostosMap = new Map(nuevasRecetas.map((r) => [r.id, r.costoTotalReceta]));

    setProductos((prevProds) =>
      prevProds.map((prod) => {
        const costoTotalReceta = recetaCostosMap.get(prod.recetaId) || 0;

        const nuevasPresentaciones = (prod.presentaciones || []).map((pres) => {
          const costoBaseReceta = pres.factorReceta * costoTotalReceta;

          let costoEmpaqueTotal = 0;
          const nuevosEmpaques = (pres.empaques || []).map((emp) => {
            const unit = insumoMap.get(emp.insumoId) || 0;
            const subtotal = emp.cantidad * unit;
            costoEmpaqueTotal += subtotal;
            return {
              ...emp,
              costoUnitario: unit,
              costoTotal: subtotal,
            };
          });

          const costoUnitarioTotal = costoBaseReceta + costoEmpaqueTotal;
          const precioSugerido = calcularPrecioRecomendado(
            costoUnitarioTotal,
            pres.margenDeseadoPct || 50
          );
          const gananciaPorUnidad = pres.precioVentaReal - costoUnitarioTotal;
          const margenRealPct =
            pres.precioVentaReal > 0 ? (gananciaPorUnidad / pres.precioVentaReal) * 100 : 0;

          return {
            ...pres,
            costoBaseReceta,
            empaques: nuevosEmpaques,
            costoEmpaqueTotal,
            costoUnitarioTotal,
            precioSugerido,
            gananciaPorUnidad,
            margenRealPct,
          };
        });

        return {
          ...prod,
          presentaciones: nuevasPresentaciones,
        };
      })
    );
  };

  // ==================== PRODUCTOS Y PRESENTACIONES ====================

  const addProducto = (prodData: Omit<ProductoVenta, 'id'>): ProductoVenta => {
    const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nuevo: ProductoVenta = {
      ...prodData,
      id,
    };
    setProductos((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const updateProducto = (id: string, cambios: Partial<ProductoVenta>) => {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const deleteProducto = (id: string): boolean => {
    const tieneVentas = ventas.some((v) => v.productoId === id);
    if (tieneVentas) {
      updateProducto(id, { activo: false });
      return false;
    }
    setProductos((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const addPresentacionAProducto = (
    productoId: string,
    presentacionData: Omit<PresentacionComercial, 'id'>
  ) => {
    const presId = `pres-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nuevaPres: PresentacionComercial = {
      ...presentacionData,
      id: presId,
    };

    setProductos((prev) =>
      prev.map((p) => {
        if (p.id !== productoId) return p;
        return {
          ...p,
          presentaciones: [...(p.presentaciones || []), nuevaPres],
        };
      })
    );
  };

  
const updatePresentacion = (
  productoId: string,
  presentacionId: string,
  cambios: Partial<PresentacionComercial>
) => {
  setProductos((prev) =>
    prev.map((p) => {
      if (p.id !== productoId) return p;

      const actualizadas = (p.presentaciones || []).map((pres) => {
        if (pres.id !== presentacionId) return pres;

        const actualizada = { ...pres, ...cambios };

        const margenDeseadoPct = Number.isFinite(
          actualizada.margenDeseadoPct
        )
          ? Math.min(
              Math.max(actualizada.margenDeseadoPct, 0),
              99
            )
          : 50;

        const costoUnitarioTotal =
          actualizada.costoBaseReceta +
          actualizada.costoEmpaqueTotal;

        const precioSugerido = calcularPrecioRecomendado(
          costoUnitarioTotal,
          margenDeseadoPct
        );

        const gananciaPorUnidad =
          actualizada.precioVentaReal - costoUnitarioTotal;

        const margenRealPct =
          actualizada.precioVentaReal > 0
            ? (gananciaPorUnidad / actualizada.precioVentaReal) * 100
            : 0;

        return {
          ...actualizada,
          margenDeseadoPct,
          costoUnitarioTotal,
          precioSugerido,
          gananciaPorUnidad,
          margenRealPct,
        };
      });

      return { ...p, presentaciones: actualizadas };
    })
  );
};


  const deletePresentacion = (productoId: string, presentacionId: string): boolean => {
    const producto = productos.find((p) => p.id === productoId);
    const presentacion = producto?.presentaciones?.find(
      (p) => p.id === presentacionId
    );
    if (!producto || !presentacion) return false;

    const stockPendiente = Math.max(0, presentacion.stockListo || 0);
    const receta = recetas.find((r) => r.id === producto.recetaId);
    const factorReceta = presentacion.factorReceta;
    const devoluciones = new Map<string, number>();

    if (stockPendiente > 0) {
      if (
        !receta ||
        !receta.ingredientes?.length ||
        !Number.isFinite(factorReceta) ||
        factorReceta <= 0
      ) {
        return false;
      }

      for (const ingrediente of receta.ingredientes || []) {
        devoluciones.set(
          ingrediente.insumoId,
          (devoluciones.get(ingrediente.insumoId) || 0) +
            ingrediente.cantidad * factorReceta * stockPendiente
        );
      }

      // No retirar el producto si no podemos devolver cada ingrediente con seguridad.
      if ([...devoluciones.keys()].some((id) => !insumos.some((i) => i.id === id))) {
        return false;
      }
    }

    const tieneVentas = ventas.some(
      (v) => v.productoId === productoId && v.presentacionId === presentacionId
    );

    if (devoluciones.size > 0) {
      setInsumos((prev) =>
        prev.map((insumo) => {
          const cantidadDevuelta = devoluciones.get(insumo.id) || 0;
          return cantidadDevuelta > 0
            ? {
                ...insumo,
                stockActual: insumo.stockActual + cantidadDevuelta,
                fechaActualizacion: new Date().toISOString().split('T')[0],
              }
            : insumo;
        })
      );
    }

    if (tieneVentas) {
      updatePresentacion(productoId, presentacionId, {
        activo: false,
        stockListo: 0,
      });
      return false;
    }

    setProductos((prev) =>
      prev.map((p) => {
        if (p.id !== productoId) return p;
        return {
          ...p,
          presentaciones: (p.presentaciones || []).filter((pres) => pres.id !== presentacionId),
        };
      })
    );
    return true;
  };

  // ==================== VENTAS ====================

  const addVenta = (
  ventaData: Omit<Venta, 'id'>,
  descontarStock = true
  ): { success: boolean; mensaje: string } => {
    const producto = productos.find(
      (p) => p.id === ventaData.productoId
    );

    const presentacion = producto?.presentaciones?.find(
      (p) => p.id === ventaData.presentacionId
    );

    if (descontarStock) {
      if (!producto || !presentacion) {
        return {
          success: false,
          mensaje: 'Selecciona un producto y una presentación válidos.',
        };
      }

      const stockDisponible = Math.max(
        0,
        presentacion.stockListo || 0
      );

      if (stockDisponible <= 0) {
        return {
          success: false,
          mensaje: `La presentación "${presentacion.nombre}" está agotada.`,
        };
      }

      if (
        !Number.isFinite(ventaData.cantidad) ||
        ventaData.cantidad <= 0
      ) {
        return {
          success: false,
          mensaje: 'La cantidad debe ser mayor que cero.',
        };
      }

      if (ventaData.cantidad > stockDisponible) {
        return {
          success: false,
          mensaje: `Solo tienes ${stockDisponible} en stock. La cantidad solicitada es mayor que las existencias.`,
        };
      }

      for (const empaque of presentacion.empaques || []) {
        const insumo = insumos.find(
          (i) => i.id === empaque.insumoId
        );
      
        if (!insumo) {
          return {
            success: false,
            mensaje: 'No se encontró un insumo de empaque asociado a la presentación.',
          };
        }
      
        const cantidadRequerida =
    empaque.cantidad * ventaData.cantidad;

  if (
    !Number.isFinite(cantidadRequerida) ||
          cantidadRequerida < 0 ||
          insumo.stockActual < cantidadRequerida
        ) {
          return {
            success: false,
            mensaje: `No hay suficientes existencias de ${insumo.nombre}.`,
          };
        }
      }
    }

    const empaquesDescontados: {
      insumoId: string;
      cantidadTotal: number;
    }[] = [];

    if (descontarStock && presentacion) {
      for (const empaque of presentacion.empaques || []) {
        const existente = empaquesDescontados.find(
          (e) => e.insumoId === empaque.insumoId
        );
      
        const cantidadTotal =
          empaque.cantidad * ventaData.cantidad;
      
        if (existente) {
          existente.cantidadTotal += cantidadTotal;
        } else {
          empaquesDescontados.push({
            insumoId: empaque.insumoId,
            cantidadTotal,
          });
        }
      }
    }

    const id = `vta-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)}`;

    const nueva: Venta = {
      ...ventaData,
      id,
      descontoStock: descontarStock,
      empaquesDescontados,
    };

    setVentas((prev) => [nueva, ...prev]);

    if (descontarStock && producto && presentacion) {
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== producto.id) return p;

          return {
            ...p,
            presentaciones: (p.presentaciones || []).map((pres) =>
              pres.id === presentacion.id
                ? {
                    ...pres,
                    stockListo:
                      (pres.stockListo || 0) - ventaData.cantidad,
                  }
                : pres
            ),
          };
        })
      );

      setInsumos((prev) =>
        prev.map((insumo) => {
          const empaque = empaquesDescontados.find(
            (e) => e.insumoId === insumo.id
          );

          if (!empaque) return insumo;

          return {
            ...insumo,
            stockActual: insumo.stockActual - empaque.cantidadTotal,
            fechaActualizacion: new Date().toISOString().split('T')[0],
          };
        })
      );
    }

    return {
      success: true,
      mensaje: 'Venta registrada correctamente.',
    };
  };

  const addCliente = (datos: Omit<Cliente, 'id'>): Cliente => {
    const existente = clientes.find((c) => c.nombre.trim().toLocaleLowerCase() === datos.nombre.trim().toLocaleLowerCase());
    if (existente) return existente;
    const nuevo = { ...datos, id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    setClientes((prev) => [nuevo, ...prev]);
    return nuevo;
  };
  const updateCliente = (id: string, cambios: Partial<Cliente>) => {
    setClientes((prev) => prev.map((c) => c.id === id ? { ...c, ...cambios, id } : c));
    setPedidos((prev) => prev.map((p) => p.clienteId === id && p.estado === 'pendiente' ? {
      ...p, clienteNombre: cambios.nombre?.trim() || p.clienteNombre,
      telefonoCliente: cambios.telefono, correoCliente: cambios.correo,
    } : p));
  };
  const deleteCliente = (id: string): boolean => {
    // Los pedidos guardan nombre y contacto como una instantánea; al borrar
    // el cliente solo quitamos el vínculo del catálogo y conservamos historial.
    setPedidos((prev) => prev.map((p) => p.clienteId === id ? { ...p, clienteId: undefined } : p));
    setClientes((prev) => prev.filter((c) => c.id !== id));
    return true;
  };
  const addPedido = (datos: Omit<Pedido, 'id' | 'folio'>) => {
    const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPedidos((prev) => [{ ...datos, id, folio: obtenerSiguienteFolioPedido(ventas, prev) }, ...prev]);
  };
  const generarSiguienteFolioPedido = () => obtenerSiguienteFolioPedido(ventas, pedidos);
  const updatePedido = (id: string, cambios: Partial<Pedido>) => setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...cambios } : p));
  const deletePedido = (id: string): boolean => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return false;
    const tieneVentas = ventas.some((v) => v.pedidoId === id || v.folioPedido === pedido.folio);
    if (tieneVentas || pedido.estado === 'completado') return false;
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const updateVenta = (
  id: string,
  cambios: Partial<Venta>
  ): { success: boolean; mensaje: string } => {
    const ventaAnterior = ventas.find((v) => v.id === id);

    if (!ventaAnterior) {
      return {
        success: false,
        mensaje: 'No se encontró la venta que deseas modificar.',
      };
    }

    const ventaActualizada: Venta = {
      ...ventaAnterior,
      ...cambios,
      id: ventaAnterior.id,
    };

    // Si la venta original no descontó inventario, actualizamos
    // únicamente sus datos comerciales.
    if (ventaAnterior.descontoStock !== true) {
      setVentas((prev) =>
        prev.map((v) => (v.id === id ? ventaActualizada : v))
      );

      return {
        success: true,
        mensaje: 'Venta actualizada correctamente.',
      };
    }

    // No permitir cambiar el producto o presentación sin procesar
    // correctamente la devolución y el nuevo descuento.
    const cambiaInventario =
      ventaActualizada.productoId !== ventaAnterior.productoId ||
      ventaActualizada.presentacionId !== ventaAnterior.presentacionId ||
      ventaActualizada.cantidad !== ventaAnterior.cantidad;

    if (cambiaInventario) {
      return {
        success: false,
        mensaje:
          'Para cambiar el producto, la presentación o la cantidad debemos validar el inventario antes de guardar. No se modificó la venta.',
      };
    }

    setVentas((prev) =>
      prev.map((v) => (v.id === id ? ventaActualizada : v))
    );

    return {
      success: true,
      mensaje: 'Venta actualizada correctamente.',
    };
  };

  
  
  const deleteVenta = (id: string) => {
    const ventaAEliminar = ventas.find((v) => v.id === id);
  
    if (!ventaAEliminar) return;
  
    // Eliminar la venta del historial.
    setVentas((prev) => prev.filter((v) => v.id !== id));
  
    // Solo restaurar inventario si esta venta lo descontó.
    if (ventaAEliminar.descontoStock !== true) return;
  
    if (ventaAEliminar.productoId) {
      // Restaurar el stock del producto terminado.
      setProductos((prev) =>
        prev.map((producto) => {
          if (producto.id !== ventaAEliminar.productoId) return producto;
        
          const presentacionesActualizadas = (
            producto.presentaciones || []
          ).map((presentacion) => {
            if (
              ventaAEliminar.presentacionId &&
              presentacion.id === ventaAEliminar.presentacionId
            ) {
              return {
                ...presentacion,
                stockListo:
                  (presentacion.stockListo || 0) + ventaAEliminar.cantidad,
              };
            }
          
            return presentacion;
          });
        
          return {
            ...producto,
            presentaciones: presentacionesActualizadas,
          };
        })
      );    
      
      // Restaurar los empaques descontados.
      if (ventaAEliminar.empaquesDescontados?.length) {
        setInsumos((prev) =>
          prev.map((insumo) => {
            const empaqueUsado =
              ventaAEliminar.empaquesDescontados!.find(
                (empaque) => empaque.insumoId === insumo.id
              );
            
            if (!empaqueUsado) return insumo;
            
            return {
              ...insumo,
              stockActual:
                insumo.stockActual + empaqueUsado.cantidadTotal,
              fechaActualizacion: new Date().toISOString().split('T')[0],
            };
          })
        );
      } else {
        // Compatibilidad con ventas antiguas sin historial de empaques.
        const producto = productos.find(
          (p) => p.id === ventaAEliminar.productoId
        );
      
        const presentacion = producto?.presentaciones?.find(
          (p) => p.id === ventaAEliminar.presentacionId
        );
      
        if (presentacion?.empaques?.length) {
          setInsumos((prev) =>
            prev.map((insumo) => {
              const empaqueUsado = presentacion.empaques!.find(
                (empaque) => empaque.insumoId === insumo.id
              );
            
              if (!empaqueUsado) return insumo;
            
              return {
                ...insumo,
                stockActual:
                  insumo.stockActual +
                  empaqueUsado.cantidad * ventaAEliminar.cantidad,
                fechaActualizacion: new Date().toISOString().split('T')[0],
              };
            })
          );
        }
      }
    }
  };



  const marcarVentaCobrada = (id: string, formaPago: Gasto['formaPago'] = 'efectivo') => {
    setVentas((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              estadoCobro: 'cobrada',
              formaPago,
              fechaCobro: new Date().toISOString().split('T')[0],
            }
          : v
      )
    );
  };

  // ==================== GASTOS ====================

  const addGasto = (gastoData: Omit<Gasto, 'id'>) => {
    const id = `gst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nuevo: Gasto = {
      ...gastoData,
      id,
    };
    setGastos((prev) => [nuevo, ...prev]);
  };

  const registrarCompraHistoricaInsumo = (
  insumo: Insumo,
  fechaCompra: string,
  formaPago: Gasto['formaPago']
  ) => {
    addGasto({
      fecha: fechaCompra,
      descripcion: `Compra inicial de insumo: ${insumo.nombre} (${insumo.cantidadCompra} ${insumo.unidadCompra})`,
      categoriaId:
        insumo.tipo === 'empaque'
          ? 'cat-empaques'
          : 'cat-ingredientes',
      categoriaNombre:
        insumo.tipo === 'empaque'
          ? 'Empaques, Cajas y Desechables'
          : 'Ingredientes y Materia Prima',
      importe: insumo.precioCompra,
      formaPago,
      ambito: 'negocio',
      tipoGastoNegocio: 'inventario_materia_prima',
      insumoIdRelacionado: insumo.id,
      notas: `Registro histórico de compra inicial. Proveedor: ${
        insumo.proveedor || 'N/A'
      }. No modifica las existencias.`,
    });
  };

  const updateGasto = (id: string, cambios: Partial<Gasto>) => {
    setGastos((prev) => prev.map((g) => (g.id === id ? { ...g, ...cambios } : g)));
  };

  const deleteGasto = (id: string) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  };

  // ==================== CATEGORÍAS ====================

  const addCategoria = (catData: Omit<CategoriaGasto, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const nueva: CategoriaGasto = {
      ...catData,
      id,
    };
    setCategorias((prev) => [...prev, nueva]);
  };

  const updateCategoria = (id: string, cambios: Partial<CategoriaGasto>) => {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
  };

  const deleteCategoria = (id: string): boolean => {
    const enUso = gastos.some((g) => g.categoriaId === id);
    if (enUso) return false;
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  // ==================== PRODUCCIÓN ====================

  const ejecutarProduccion = (
    recetaId: string,
    tandas: number,
    descontarStock = true,
    sumarStockProductoId?: string,
    sumarStockPresentacionId?: string,
    notas?: string
  ) => {
    const receta = recetas.find((r) => r.id === recetaId);
    if (!receta) {
      return { success: false, mensaje: 'Receta no encontrada' };
    }

    if (tandas <= 0) {
      return { success: false, mensaje: 'La cantidad de tandas debe ser mayor a 0' };
    }

    const insumoMap = new Map(insumos.map((i) => [i.id, i]));
    const faltantes: { nombre: string; requerido: number; disponible: number; unidad: string }[] = [];

    const requerimientosPorInsumo = new Map<string, number>();

    const consumosReceta = receta.ingredientes || [];
    
    for (const item of consumosReceta) {
      const requerido = item.cantidad * tandas;
    
      requerimientosPorInsumo.set(
        item.insumoId,
        (requerimientosPorInsumo.get(item.insumoId) || 0) + requerido
      );
    }

    if (descontarStock) {
      for (const [insumoId, requerido] of requerimientosPorInsumo) {
        const ins = insumoMap.get(insumoId);
      
        if (ins && ins.stockActual < requerido) {
          faltantes.push({
            nombre: ins.nombre,
            requerido,
            disponible: ins.stockActual,
            unidad: ins.unidadUso,
          });
        }
      }
    }

    if (faltantes.length > 0) {
      return {
        success: false,
        mensaje: `Stock insuficiente en ${faltantes.length} insumo(s).`,
        faltantes,
      };
    }

    const productoDestino = productos.find((p) => p.id === sumarStockProductoId);
    const presentacionDestino = productoDestino?.presentaciones?.find(
      (pres) => pres.id === sumarStockPresentacionId
    );
    const factorReceta = presentacionDestino?.factorReceta ?? 1;

    if (
      sumarStockProductoId &&
      sumarStockPresentacionId &&
      (!presentacionDestino || !Number.isFinite(factorReceta) || factorReceta <= 0)
    ) {
      return {
        success: false,
        mensaje: 'La presentación seleccionada no tiene un factor de receta válido.',
      };
    }

    // El stock de producto terminado se cuenta en unidades vendibles de la presentación.
    const totalUnidadesElaboradas = presentacionDestino
      ? tandas / factorReceta
      : receta.rendimientoCantidad * tandas;

    // Descontar ingredientes, empaques, desechables y otros insumos
    if (descontarStock) {
      setInsumos((prev) =>
        prev.map((ins) => {
          const consumoTotal = requerimientosPorInsumo.get(ins.id) || 0;
        
          if (consumoTotal > 0) {
            return {
              ...ins,
              stockActual: Math.max(0, ins.stockActual - consumoTotal),
              fechaActualizacion: new Date().toISOString().split('T')[0],
            };
          }
        
          return ins;
        })
      );
    }

    if (sumarStockProductoId && sumarStockPresentacionId) {
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== sumarStockProductoId) return p;
        
          return {
            ...p,
            presentaciones: (p.presentaciones || []).map((pres) =>
              pres.id === sumarStockPresentacionId
                ? {
                    ...pres,
                    stockListo:
                      (pres.stockListo || 0) + totalUnidadesElaboradas,
                  }
                : pres
            ),
          };
        })
      );
    }

    const registro: RegistroProduccion = {
      id: `prod-run-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      recetaId: receta.id,
      recetaNombre: receta.nombre,
      tandas,
      unidadesProducidas: totalUnidadesElaboradas,
      presentacionNombre: presentacionDestino?.nombre,
      costoTotalTanda: receta.costoTotalReceta * tandas,
      descontoInventario: descontarStock,
      notas,
    };

    setProducciones((prev) => [registro, ...prev]);

    return {
      success: true,
      mensaje: presentacionDestino
        ? `Producción registrada: ${totalUnidadesElaboradas} unidad(es) de "${presentacionDestino.nombre}" agregadas al stock.`
        : `Producción registrada: ${totalUnidadesElaboradas} ${receta.rendimientoUnidad} de "${receta.nombre}".`,
    };
  };

  // ==================== CONFIGURACIÓN Y TEMA ====================

  const updateConfiguracion = (cfg: Partial<ConfiguracionApp>) => {
    setConfiguracion((prev) => ({ ...prev, ...cfg }));
  };

  const toggleTema = () => {
    setConfiguracion((prev) => {
      const nuevoTema = prev.tema === 'dark' ? 'light' : 'dark';
      return { ...prev, tema: nuevoTema };
    });
  };

  useEffect(() => {
  const esOscuro = configuracion.tema === 'dark';

  document.documentElement.classList.toggle('dark', esOscuro);
}, [configuracion.tema]);

  // ==================== GESTIÓN DE DATOS ====================

  const cargarDatosEjemplo = () => {
    setInsumos(SAMPLE_INSUMOS);
    setRecetas(SAMPLE_RECETAS);
    setProductos(SAMPLE_PRODUCTOS);
    setGastos(SAMPLE_GASTOS);
    setVentas(SAMPLE_VENTAS);
    setCategorias(CATEGORIAS_DEFAULT);
    setProducciones([
      {
        id: 'prod-run-sample-01',
        fecha: '2026-10-13',
        recetaId: 'rec-pay-queso-clasico',
        recetaNombre: 'Pay de Queso Horneado Clásico (Molde 24cm)',
        tandas: 1,
        unidadesProducidas: 8,
        costoTotalTanda: 142.0,
        descontoInventario: true,
        notas: 'Tanda para pay completo y rebanadas',
      },
      {
        id: 'prod-run-sample-02',
        fecha: '2026-10-14',
        recetaId: 'rec-arroz-con-leche',
        recetaNombre: 'Arroz con Leche Cremoso Tradicional',
        tandas: 1,
        unidadesProducidas: 2000,
        costoTotalTanda: 134.0,
        descontoInventario: true,
        notas: 'Tanda 2 Litros para medio litro y vasitos 6 oz',
      },
    ]);
  };

  /**
   * Elimina EXCLUSIVAMENTE los registros didácticos de demostración (Pay de Queso, Arroz con Leche, etc.)
   * conservando íntegramente todos los insumos, recetas, productos y ventas reales ingresados por el usuario.
   */
  const limpiarSoloEjemplosDemostracion = () => {
    setInsumos((prev) => prev.filter((i) => !i.esDemostracion));
    setRecetas((prev) => prev.filter((r) => !r.esDemostracion));
    setProductos((prev) =>
      prev
        .filter((p) => !p.esDemostracion)
        .map((p) => ({
          ...p,
          presentaciones: (p.presentaciones || []).filter((pr) => !pr.esDemostracion),
        }))
    );
    setVentas((prev) => prev.filter((v) => !v.esDemostracion));
    const idsProductoDemo = new Set(productos.filter((p) => p.esDemostracion).map((p) => p.id));
    setPedidos((prev) => prev.filter((p) => !p.items.some((item) => idsProductoDemo.has(item.productoId))));
    setGastos((prev) => prev.filter((g) => !g.esDemostracion));
    setProducciones((prev) => prev.filter((pr) => !pr.id.startsWith('prod-run-sample')));
  };

  const reiniciarDatos = () => {
    setInsumos([]);
    setRecetas([]);
    setProductos([]);
    setVentas([]);
    setPedidos([]);
    setClientes([]);
    setGastos([]);
    setProducciones([]);
    setCategorias(CATEGORIAS_DEFAULT);
    setConfiguracion(CONFIGURACION_DEFAULT);
  };

  /**
   * Migración manual y segura:
   * - Solo crea documentos que todavía no existen en Firebase.
   * - Nunca sobrescribe documentos existentes.
   * - Omite registros de demostración para no subir datos de ejemplo.
   */
  

const migrarDatosLocalesAFirebase = async (): Promise<{
  success: boolean;
  mensaje: string;
  subidos: number;
  existentes: number;
  omitidos: number;
}> => {
  let subidos = 0;
  let existentes = 0;
  let omitidos = 0;

  try {
    await obtenerUsuarioAutorizado();

    // Las colecciones de Firestore se crean al guardar
    // su primer documento. No subimos registros de ejemplo.

    // Revisar únicamente la configuración general.
    const configuracionExistente = await obtenerDocumento(
      'configuracion',
      'general'
    );

    if (configuracionExistente) {
      existentes++;
    } else {
      await guardarDocumento(
        'configuracion',
        'general',
        CONFIGURACION_DEFAULT
      );

      subidos++;
    }

    return {
      success: true,
      mensaje:
        `Inicialización completada. Documentos creados: ${subidos}; ` +
        `configuraciones existentes: ${existentes}; omitidos: ${omitidos}. ` +
        'No se subieron datos de demostración.',
      subidos,
      existentes,
      omitidos,
    };
  } catch (error) {
    console.error(
      'Error al completar la estructura de Firebase:',
      error
    );

    return {
      success: false,
      mensaje:
        error instanceof Error
          ? error.message
          : 'No se pudo completar la inicialización de Firebase.',
      subidos,
      existentes,
      omitidos,
    };
  }
};



  const exportarRespaldoJSON = () => {
    const backup = {
      app: 'Control de Gastos y Costos',
      version: '2.0.0',
      fechaExportacion: new Date().toISOString(),
      configuracion,
      insumos,
      recetas,
      productos,
      ventas,
      clientes,
      pedidos,
      gastos,
      categorias,
      producciones,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `respaldo_gastos_y_costos_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importarRespaldoJSON = (jsonString: string): { success: boolean; mensaje: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, mensaje: 'El archivo no contiene un formato JSON válido.' };
      }

      if (data.insumos && Array.isArray(data.insumos)) setInsumos(data.insumos);
      if (data.recetas && Array.isArray(data.recetas)) setRecetas(data.recetas);
      if (data.productos && Array.isArray(data.productos)) setProductos(data.productos);
      if (data.ventas && Array.isArray(data.ventas)) setVentas(data.ventas);
      if (data.clientes && Array.isArray(data.clientes)) setClientes(data.clientes);
      if (data.pedidos && Array.isArray(data.pedidos)) setPedidos(data.pedidos);
      if (data.gastos && Array.isArray(data.gastos)) setGastos(data.gastos);
      if (data.categorias && Array.isArray(data.categorias)) setCategorias(data.categorias);
      if (data.producciones && Array.isArray(data.producciones)) setProducciones(data.producciones);
      if (data.configuracion) setConfiguracion({ ...CONFIGURACION_DEFAULT, ...data.configuracion });

      return {
        success: true,
        mensaje: 'Copia de seguridad restaurada correctamente.',
      };
    } catch {
      return { success: false, mensaje: 'Error al interpretar el archivo de respaldo.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        insumos,
        recetas,
        productos,
        ventas,
        clientes,
        pedidos,
        gastos,
        categorias,
        producciones,
        configuracion,
        isLoaded,
        loadError,
        temaActual,
        addInsumo,
        updateInsumo,
        deleteInsumo,
        ajustarStockInsumo,
        reabastecerInsumo,
        addReceta,
        updateReceta,
        deleteReceta,
        recalcularTodasLasRecetas,
        addProducto,
        updateProducto,
        deleteProducto,
        addPresentacionAProducto,
        updatePresentacion,
        deletePresentacion,
        addVenta,
        updateVenta,
        deleteVenta,
        marcarVentaCobrada,
        addCliente,
        updateCliente,
        deleteCliente,
        addPedido,
        generarSiguienteFolioPedido,
        updatePedido,
        deletePedido,
        mostrarAlerta,
        confirmarAccion,
        addGasto,
        registrarCompraHistoricaInsumo,
        updateGasto,
        deleteGasto,
        addCategoria,
        updateCategoria,
        deleteCategoria,
        ejecutarProduccion,
        updateConfiguracion,
        toggleTema,
        cargarDatosEjemplo,
        limpiarSoloEjemplosDemostracion,
        reiniciarDatos,
        exportarRespaldoJSON,
        importarRespaldoJSON,
        migrarDatosLocalesAFirebase,
      }}
    >
      {children}
      {dialogoAplicacion && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation">
        <div role="alertdialog" aria-modal="true" aria-labelledby="app-dialog-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <h2 id="app-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">{dialogoAplicacion.titulo}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{dialogoAplicacion.mensaje}</p>
          <div className="mt-5 flex justify-end gap-2">
            {dialogoAplicacion.tipo === 'confirmar' && <button autoFocus onClick={() => cerrarDialogoAplicacion(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">No, regresar</button>}
            {dialogoAplicacion.tipo === 'confirmar' ? <button onClick={() => cerrarDialogoAplicacion(true)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Sí, continuar</button> : <button autoFocus onClick={() => cerrarDialogoAplicacion(false)} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Entendido</button>}
          </div>
        </div>
      </div>}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
};
