import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface AppContextType {
  // Estado
  insumos: Insumo[];
  recetas: Receta[];
  productos: ProductoVenta[];
  ventas: Venta[];
  gastos: Gasto[];
  categorias: CategoriaGasto[];
  producciones: RegistroProduccion[];
  configuracion: ConfiguracionApp;
  isLoaded: boolean;
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
  addVenta: (venta: Omit<Venta, 'id'>, descontarStock?: boolean) => void;
  updateVenta: (id: string, venta: Partial<Venta>) => void;
  deleteVenta: (id: string) => void;
  marcarVentaCobrada: (id: string, formaPago: Gasto['formaPago']) => void;

  // Gastos
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
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
}

const STORAGE_KEY_PREFIX = 'gastos_costos_v2_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Estados principales
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>(CATEGORIAS_DEFAULT);
  const [producciones, setProducciones] = useState<RegistroProduccion[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionApp>(CONFIGURACION_DEFAULT);
  const [temaActual, setTemaActual] = useState<'light' | 'dark'>('light');

  // Carga inicial desde localStorage con migración suave para productos con múltiples presentaciones
  useEffect(() => {
    try {
      // Intentar cargar v2, fallback a v1 si existe
      const getStored = (key: string) => {
        return (
          localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`) ||
          localStorage.getItem(`gastos_costos_v1_${key}`)
        );
      };

      const storedCfg = getStored('config');
      const storedInsumos = getStored('insumos');
      const storedRecetas = getStored('recetas');
      const storedProductos = getStored('productos');
      const storedVentas = getStored('ventas');
      const storedGastos = getStored('gastos');
      const storedCategorias = getStored('categorias');
      const storedProducciones = getStored('producciones');

      if (storedCfg) {
        const parsed = JSON.parse(storedCfg);
        setConfiguracion({ ...CONFIGURACION_DEFAULT, ...parsed });
      }

      const wasCleared = getStored('cleared') === 'true';

      if (storedInsumos) {
        setInsumos(JSON.parse(storedInsumos));
      } else if (!wasCleared) {
        setInsumos(SAMPLE_INSUMOS);
      }

      if (storedRecetas) {
        setRecetas(JSON.parse(storedRecetas));
      } else if (!wasCleared) {
        setRecetas(SAMPLE_RECETAS);
      }

      if (storedVentas) {
        setVentas(JSON.parse(storedVentas));
      } else if (!wasCleared) {
        setVentas(SAMPLE_VENTAS);
      }

      if (storedGastos) {
        setGastos(JSON.parse(storedGastos));
      } else if (!wasCleared) {
        setGastos(SAMPLE_GASTOS);
      }

      if (storedCategorias) setCategorias(JSON.parse(storedCategorias));

      if (storedProducciones) {
        setProducciones(JSON.parse(storedProducciones));
      } else if (!wasCleared) {
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
      }

      if (storedProductos) {
        const rawProds = JSON.parse(storedProductos);
        // Normalización si el producto venía de v1 (sin array presentaciones)
        const normalized: ProductoVenta[] = rawProds.map((p: any) => {
          if (p.presentaciones && Array.isArray(p.presentaciones) && p.presentaciones.length > 0) {
            return p;
          }
          const defaultPres: PresentacionComercial = {
            id: `pres-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            nombre: 'Presentación Única',
            tipoCalculo: 'fraccion',
            cantidadOVolumen: 1,
            unidadMedida: 'unidad',
            factorReceta: p.factorReceta || 1,
            empaques: (p.empaqueAdicionalIds || []).map((e: any) => ({
              insumoId: e.insumoId,
              cantidad: e.cantidad,
            })),
            costoBaseReceta: p.costoBaseReceta || 0,
            costoEmpaqueTotal: p.costoEmpaqueVenta || 0,
            costoUnitarioTotal: p.costoUnitarioTotal || 0,
            margenDeseadoPct: p.margenDeseadoPct || 50,
            precioSugerido: p.precioSugerido || 0,
            precioVentaReal: p.precioVentaReal || 0,
            gananciaPorUnidad: p.gananciaPorUnidad || 0,
            margenRealPct: p.margenRealPct || 0,
            stockListo: p.stockListoParaVenta || 0,
            activo: p.activo ?? true,
          };
          return {
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            categoria: p.categoria,
            recetaId: p.recetaId || '',
            presentaciones: [defaultPres],
            activo: p.activo ?? true,
          };
        });
        setProductos(normalized);
      } else if (!wasCleared) {
        setProductos(SAMPLE_PRODUCTOS);
      }
    } catch (e) {
      console.error('Error al cargar datos locales:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persistencia automática al cambiar estados
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}config`, JSON.stringify(configuracion));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}insumos`, JSON.stringify(insumos));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}recetas`, JSON.stringify(recetas));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}productos`, JSON.stringify(productos));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}ventas`, JSON.stringify(ventas));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}gastos`, JSON.stringify(gastos));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}categorias`, JSON.stringify(categorias));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}producciones`, JSON.stringify(producciones));
    } catch (e) {
      console.error('Error al persistir datos:', e);
    }
  }, [isLoaded, insumos, recetas, productos, ventas, gastos, categorias, producciones, configuracion]);

  // Manejo de tema (Claro / Oscuro)
  useEffect(() => {
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
      r.ingredientes.some((i) => i.insumoId === id) || r.empaques.some((e) => e.insumoId === id)
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
    if (insumo.unidadCompra === 'kg') incrementoUnidadUso = cantidadCompra * 1000;
    else if (insumo.unidadCompra === 'litro') incrementoUnidadUso = cantidadCompra * 1000;

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

      let costoEmpaques = 0;
      const nuevosEmpaques = (receta.empaques || []).map((emp) => {
        const costoUnit = insumoMap.get(emp.insumoId) || 0;
        const costoCalculado = emp.cantidad * costoUnit;
        costoEmpaques += costoCalculado;
        return { ...emp, costoCalculado };
      });

      const costoIndirectos =
        (receta.indirectos?.costoGas || 0) +
        (receta.indirectos?.costoLuz || 0) +
        (receta.indirectos?.costoManoObra || 0) +
        (receta.indirectos?.otrosCostosFijos || 0);

      const costoTotalReceta = costoIngredientes + costoEmpaques + costoIndirectos;
      const rendimiento = receta.rendimientoCantidad > 0 ? receta.rendimientoCantidad : 1;
      const costoPorUnidad = costoTotalReceta / rendimiento;

      return {
        ...receta,
        ingredientes: nuevosIngredientes,
        empaques: nuevosEmpaques,
        costoIngredientes,
        costoEmpaques,
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
          return { ...pres, ...cambios };
        });
        return { ...p, presentaciones: actualizadas };
      })
    );
  };

  const deletePresentacion = (productoId: string, presentacionId: string): boolean => {
    const tieneVentas = ventas.some(
      (v) => v.productoId === productoId && v.presentacionId === presentacionId
    );
    if (tieneVentas) {
      updatePresentacion(productoId, presentacionId, { activo: false });
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

  const addVenta = (ventaData: Omit<Venta, 'id'>, descontarStock = true) => {
    const id = `vta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nueva: Venta = {
      ...ventaData,
      id,
    };

    setVentas((prev) => [nueva, ...prev]);

    // Descontar stock de la presentación vendida si aplica
    if (descontarStock && ventaData.productoId) {
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== ventaData.productoId) return p;
          const presActualizadas = (p.presentaciones || []).map((pres) => {
            if (ventaData.presentacionId && pres.id === ventaData.presentacionId) {
              return {
                ...pres,
                stockListo: Math.max(0, (pres.stockListo || 0) - ventaData.cantidad),
              };
            }
            return pres;
          });
          return { ...p, presentaciones: presActualizadas };
        })
      );

      // Descontar empaques correspondientes del inventario de insumos
      const prod = productos.find((p) => p.id === ventaData.productoId);
      const pres = prod?.presentaciones?.find((pr) => pr.id === ventaData.presentacionId);
      if (pres && pres.empaques && pres.empaques.length > 0) {
        setInsumos((prev) =>
          prev.map((ins) => {
            const empUsado = pres.empaques.find((e) => e.insumoId === ins.id);
            if (empUsado) {
              const cantidadDescontar = empUsado.cantidad * ventaData.cantidad;
              return {
                ...ins,
                stockActual: Math.max(0, ins.stockActual - cantidadDescontar),
                fechaActualizacion: new Date().toISOString().split('T')[0],
              };
            }
            return ins;
          })
        );
      }
    }
  };

  const updateVenta = (id: string, cambios: Partial<Venta>) => {
    setVentas((prev) => prev.map((v) => (v.id === id ? { ...v, ...cambios } : v)));
  };

  const deleteVenta = (id: string) => {
    setVentas((prev) => prev.filter((v) => v.id !== id));
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

    if (descontarStock) {
      for (const ing of receta.ingredientes) {
        const ins = insumoMap.get(ing.insumoId);
        if (ins) {
          const requerido = ing.cantidad * tandas;
          if (ins.stockActual < requerido) {
            faltantes.push({
              nombre: ins.nombre,
              requerido,
              disponible: ins.stockActual,
              unidad: ins.unidadUso,
            });
          }
        }
      }
      for (const emp of receta.empaques || []) {
        const ins = insumoMap.get(emp.insumoId);
        if (ins) {
          const requerido = emp.cantidad * tandas;
          if (ins.stockActual < requerido) {
            faltantes.push({
              nombre: ins.nombre,
              requerido,
              disponible: ins.stockActual,
              unidad: ins.unidadUso,
            });
          }
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

    // Descontar insumos
    if (descontarStock) {
      setInsumos((prev) =>
        prev.map((ins) => {
          const ingUsado = receta.ingredientes.find((i) => i.insumoId === ins.id);
          const empUsado = (receta.empaques || []).find((e) => e.insumoId === ins.id);
          let consumoTotal = 0;
          if (ingUsado) consumoTotal += ingUsado.cantidad * tandas;
          if (empUsado) consumoTotal += empUsado.cantidad * tandas;

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

    // Sumar a stock de la presentación o producto seleccionado
    const totalUnidadesElaboradas = receta.rendimientoCantidad * tandas;
    if (sumarStockProductoId) {
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== sumarStockProductoId) return p;
          const presActualizadas = (p.presentaciones || []).map((pres) => {
            if (sumarStockPresentacionId && pres.id === sumarStockPresentacionId) {
              return {
                ...pres,
                stockListo: (pres.stockListo || 0) + totalUnidadesElaboradas,
              };
            }
            return pres;
          });
          return { ...p, presentaciones: presActualizadas };
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
      costoTotalTanda: receta.costoTotalReceta * tandas,
      descontoInventario: descontarStock,
      notas,
    };

    setProducciones((prev) => [registro, ...prev]);

    return {
      success: true,
      mensaje: `Producción registrada con éxito: ${totalUnidadesElaboradas} ${receta.rendimientoUnidad} de "${receta.nombre}".`,
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
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}cleared`);
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
    setGastos((prev) => prev.filter((g) => !g.esDemostracion));
    setProducciones((prev) => prev.filter((pr) => !pr.id.startsWith('prod-run-sample')));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}cleared`, 'true');
  };

  const reiniciarDatos = () => {
    setInsumos([]);
    setRecetas([]);
    setProductos([]);
    setVentas([]);
    setGastos([]);
    setProducciones([]);
    setCategorias(CATEGORIAS_DEFAULT);
    setConfiguracion(CONFIGURACION_DEFAULT);
    Object.keys(localStorage)
      .filter((k) => k.startsWith('gastos_costos_'))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}cleared`, 'true');
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
        gastos,
        categorias,
        producciones,
        configuracion,
        isLoaded,
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
        addGasto,
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
      }}
    >
      {children}
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
