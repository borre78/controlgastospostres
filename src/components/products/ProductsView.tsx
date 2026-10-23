import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  Package,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Coffee,
  PieChart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ProductoVenta,
  PresentacionComercial,
  Receta,
  Insumo,
  TipoCalculoPresentacion,
  EmpaquePresentacionItem,
} from '../../types';
import {
  formatMXN,
  formatPorcentaje,
  calcularPrecioRecomendado,
  convertirFlOzAMl,
  calcularFactorPresentacion,
} from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ProductsView: React.FC = () => {
  const {
    productos,
    recetas,
    insumos,
    configuracion,
    addProducto,
    updateProducto,
    deleteProducto,
    addPresentacionAProducto,
    updatePresentacion,
    deletePresentacion,
  } = useApp();

  // Estados de modales
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<ProductoVenta | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<ProductoVenta | null>(null);

  const [isPresModalOpen, setIsPresModalOpen] = useState(false);
  const [productoPadreId, setProductoPadreId] = useState<string>('');
  const [editingPres, setEditingPres] = useState<PresentacionComercial | null>(null);
  const [presAEliminar, setPresAEliminar] = useState<{
    prodId: string;
    presId: string;
    nombre: string;
  } | null>(null);

  // Form Producto Padre
  const [prodNombre, setProdNombre] = useState('');
  const [prodDescripcion, setProdDescripcion] = useState('');
  const [prodCategoria, setProdCategoria] = useState('Pastelería y Postres');
  const [prodRecetaId, setProdRecetaId] = useState('');

  // Form Presentación Comercial
  const [presNombre, setPresNombre] = useState('');
  const [presDescripcion, setPresDescripcion] = useState('');
  const [presTipoCalculo, setPresTipoCalculo] = useState<TipoCalculoPresentacion>('fraccion');
  const [presCantidadOVolumen, setPresCantidadOVolumen] = useState('1');
  const [presUnidadMedida, setPresUnidadMedida] = useState('pieza');
  const [presRebanadasTotales, setPresRebanadasTotales] = useState('8');
  const [presEmpaques, setPresEmpaques] = useState<EmpaquePresentacionItem[]>([]);
  const [presMargenDeseado, setPresMargenDeseado] = useState(
    String(configuracion.margenGananciaDefaultPct || 50)
  );
  const [presPrecioVentaReal, setPresPrecioVentaReal] = useState('');
  const [presStockListo, setPresStockListo] = useState('0');

  // Mapeos
  const insumoMap = useMemo(() => new Map<string, Insumo>(insumos.map((i) => [i.id, i])), [insumos]);
  const recetaMap = useMemo(() => new Map<string, Receta>(recetas.map((r) => [r.id, r])), [recetas]);
  const insumosEmpaques = useMemo(
    () => insumos.filter((i) => i.tipo === 'empaque' || i.tipo === 'desechable' || i.tipo === 'otro'),
    [insumos]
  );

  // Receta del producto actual en el modal de presentación
  const recetaDelProducto = useMemo(() => {
    const prod = productos.find((p) => p.id === productoPadreId);
    if (!prod) return null;
    return recetaMap.get(prod.recetaId) || null;
  }, [productoPadreId, productos, recetaMap]);

  // Cálculos en vivo para el modal de presentación
  const calculoPresEnVivo = useMemo(() => {
    const cantVol = parseFloat(presCantidadOVolumen) || 1;
    const rebanadasTot = parseFloat(presRebanadasTotales) || 8;
    const recetaCostoTotal = recetaDelProducto ? recetaDelProducto.costoTotalReceta : 0;
    const recetaRendimiento = recetaDelProducto?.volumenOUnidadesUtilizables ?? recetaDelProducto?.rendimientoCantidad ?? 1;
    const recetaUnidad = recetaDelProducto?.unidadMedidaBase ?? recetaDelProducto?.rendimientoUnidad ?? 'unidades';
    const mermaPct = recetaDelProducto?.mermaEstimadaPct || 0;

    // Calcular factor matemático
    let factor = 1;
    if (presTipoCalculo === 'porciones') {
      factor = rebanadasTot > 0 ? (1 / rebanadasTot) * cantVol : 1 / 8;
    } else if (presTipoCalculo === 'fraccion') {
      factor = cantVol; // ej 1.0 para pay completo
    } else if (presTipoCalculo === 'volumen_ml') {
      factor = calcularFactorPresentacion(
        'volumen_ml',
        cantVol,
        undefined,
        recetaRendimiento,
        recetaUnidad,
        mermaPct
      );
    } else if (presTipoCalculo === 'peso_g') {
      factor = calcularFactorPresentacion(
        'peso_g',
        cantVol,
        undefined,
        recetaRendimiento,
        recetaUnidad,
        mermaPct
      );
    }

    const costoBaseReceta = factor * recetaCostoTotal;

    // Sumar empaques
    let costoEmpaqueTotal = 0;
    const empaquesCalculados = presEmpaques.map((item) => {
      const ins = insumoMap.get(item.insumoId);
      const unit = ins ? ins.costoPorUnidadUso : 0;
      const sub = item.cantidad * unit;
      costoEmpaqueTotal += sub;
      return {
        ...item,
        nombre: ins ? ins.nombre : 'Empaque',
        costoUnitario: unit,
        costoTotal: sub,
      };
    });

    const costoUnitarioTotal = costoBaseReceta + costoEmpaqueTotal;
    const mDeseado = parseFloat(presMargenDeseado) || 50;
    const precioSugerido = calcularPrecioRecomendado(costoUnitarioTotal, mDeseado);

    const pReal = parseFloat(presPrecioVentaReal) || precioSugerido;
    const ganancia = pReal - costoUnitarioTotal;
    const margenReal = pReal > 0 ? (ganancia / pReal) * 100 : 0;

    return {
      factor,
      costoBaseReceta,
      costoEmpaqueTotal,
      costoUnitarioTotal,
      precioSugerido,
      pReal,
      ganancia,
      margenReal,
      empaquesCalculados,
    };
  }, [
    presTipoCalculo,
    presCantidadOVolumen,
    presRebanadasTotales,
    presEmpaques,
    presMargenDeseado,
    presPrecioVentaReal,
    recetaDelProducto,
    insumoMap,
  ]);

  // Handlers de Producto Padre
  const handleOpenNuevoProducto = () => {
    setEditingProducto(null);
    setProdNombre('');
    setProdDescripcion('');
    setProdCategoria('Pastelería y Postres');
    setProdRecetaId(recetas[0]?.id || '');
    setIsProdModalOpen(true);
  };

  const handleOpenEditarProducto = (prod: ProductoVenta) => {
    setEditingProducto(prod);
    setProdNombre(prod.nombre);
    setProdDescripcion(prod.descripcion || '');
    setProdCategoria(prod.categoria || 'Pastelería y Postres');
    setProdRecetaId(prod.recetaId);
    setIsProdModalOpen(true);
  };

  const handleSubmitProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodRecetaId) {
      alert('Ingresa el nombre del producto y selecciona su receta base.');
      return;
    }

    if (editingProducto) {
      updateProducto(editingProducto.id, {
        nombre: prodNombre.trim(),
        descripcion: prodDescripcion.trim() || undefined,
        categoria: prodCategoria.trim() || undefined,
        recetaId: prodRecetaId,
      });
    } else {
      addProducto({
        nombre: prodNombre.trim(),
        descripcion: prodDescripcion.trim() || undefined,
        categoria: prodCategoria.trim() || undefined,
        recetaId: prodRecetaId,
        presentaciones: [],
        activo: true,
      });
    }

    setIsProdModalOpen(false);
  };

  // Handlers de Presentaciones
  const handleOpenNuevaPresentacion = (prod: ProductoVenta) => {
    setProductoPadreId(prod.id);
    setEditingPres(null);
    setPresNombre('');
    setPresDescripcion('');
    setPresTipoCalculo('fraccion');
    setPresCantidadOVolumen('1');
    setPresUnidadMedida('pieza');
    setPresRebanadasTotales('8');
    setPresEmpaques([]);
    setPresMargenDeseado(String(configuracion.margenGananciaDefaultPct || 50));
    setPresPrecioVentaReal('');
    setPresStockListo('0');
    setIsPresModalOpen(true);
  };

  const handleOpenEditarPresentacion = (prod: ProductoVenta, pres: PresentacionComercial) => {
    setProductoPadreId(prod.id);
    setEditingPres(pres);
    setPresNombre(pres.nombre);
    setPresDescripcion(pres.descripcion || '');
    setPresTipoCalculo(pres.tipoCalculo || 'fraccion');
    setPresCantidadOVolumen(String(pres.cantidadOVolumen));
    setPresUnidadMedida(pres.unidadMedida || 'pieza');
    setPresRebanadasTotales(String(pres.rebanadasTotalesPorReceta || 8));
    setPresEmpaques(pres.empaques || []);
    setPresMargenDeseado(String(pres.margenDeseadoPct || 50));
    setPresPrecioVentaReal(String(pres.precioVentaReal));
    setPresStockListo(String(pres.stockListo || 0));
    setIsPresModalOpen(true);
  };

  const handleAddEmpaqueItem = () => {
    const primerEmp = insumosEmpaques[0] || insumos[0];
    if (!primerEmp) {
      alert('Debes registrar insumos de empaque en el Catálogo de Insumos primero.');
      return;
    }
    setPresEmpaques((prev) => [...prev, { insumoId: primerEmp.id, cantidad: 1 }]);
  };

  const handleSubmitPresentacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presNombre.trim()) {
      alert('Ingresa el nombre de la presentación (ej. Pay completo, Rebanada, Medio Litro, Vaso 6 oz).');
      return;
    }

    const pReal = parseFloat(presPrecioVentaReal) || calculoPresEnVivo.precioSugerido;
    if (isNaN(pReal) || pReal <= 0) {
      alert('Ingresa un precio de venta válido.');
      return;
    }

    const presData: Omit<PresentacionComercial, 'id'> = {
      nombre: presNombre.trim(),
      descripcion: presDescripcion.trim() || undefined,
      tipoCalculo: presTipoCalculo,
      cantidadOVolumen: parseFloat(presCantidadOVolumen) || 1,
      unidadMedida: presUnidadMedida.trim() || 'pieza',
      rebanadasTotalesPorReceta:
        presTipoCalculo === 'porciones' ? parseFloat(presRebanadasTotales) || 8 : undefined,
      factorReceta: calculoPresEnVivo.factor,
      empaques: calculoPresEnVivo.empaquesCalculados,
      costoBaseReceta: calculoPresEnVivo.costoBaseReceta,
      costoEmpaqueTotal: calculoPresEnVivo.costoEmpaqueTotal,
      costoUnitarioTotal: calculoPresEnVivo.costoUnitarioTotal,
      margenDeseadoPct: parseFloat(presMargenDeseado) || 50,
      precioSugerido: calculoPresEnVivo.precioSugerido,
      precioVentaReal: pReal,
      gananciaPorUnidad: calculoPresEnVivo.ganancia,
      margenRealPct: calculoPresEnVivo.margenReal,
      stockListo: parseInt(presStockListo, 10) || 0,
      activo: true,
    };

    if (editingPres) {
      updatePresentacion(productoPadreId, editingPres.id, presData);
    } else {
      addPresentacionAProducto(productoPadreId, presData);
    }

    setIsPresModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" />
            Productos y Presentaciones Comerciales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Vende cada postre en múltiples tamaños y porciones sin duplicar recetas ni costos
          </p>
        </div>

        <button
          onClick={handleOpenNuevoProducto}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Tarjeta Educativa de Demostración vs Datos Reales */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-300/70 dark:border-amber-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Múltiples Presentaciones Derivadas de una Misma Receta:</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
              Ejemplo: Pay Completo ($180 MXN) y Rebanada ($40 MXN)
            </span>
            <span className="px-2 py-0.5 rounded-md font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
              Ejemplo: Arroz con Leche 500 ml y Vaso 6 oz
            </span>
          </div>
        </div>
        <p className="leading-relaxed">
          Una sola receta (como un pay horneado o una olla de 2 litros de arroz con leche) se distribuye matemáticamente en cada porción. Los costos de empaque (caja grande vs domo individual, o envase 500 ml vs vaso de 6 oz) se agregan por separado para que veas la ganancia real y margen exacto de cada tamaño.
        </p>
      </div>

      {/* Lista de Productos y sus Presentaciones */}
      {productos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Tag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            Aún no tienes productos registrados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Crea tu primer producto (como "Pay de Queso" o "Arroz con Leche") y agrega sus presentaciones comerciales.
          </p>
          <button
            onClick={handleOpenNuevoProducto}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold shadow-sm"
          >
            + Crear Primer Producto
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {productos.map((prod) => {
            const receta = recetaMap.get(prod.recetaId);
            const tienePresentaciones = (prod.presentaciones || []).length > 0;

            return (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                {/* Cabecera del Producto */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {prod.nombre}
                      </h3>
                      {prod.categoria && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {prod.categoria}
                        </span>
                      )}
                      {prod.esDemostracion ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                          Ejemplo de Demostración
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                          Tus Datos Reales
                        </span>
                      )}
                    </div>
                    {prod.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {prod.descripcion}
                      </p>
                    )}
                    {receta && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          Receta base: {receta.nombre}
                        </span>
                        <span>•</span>
                        <span>
                          Rendimiento total: {receta.rendimientoCantidad} {receta.rendimientoUnidad}
                        </span>
                        <span>•</span>
                        <span>Costo tanda: {formatMXN(receta.costoTotalReceta)}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones del Producto Padre */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenNuevaPresentacion(prod)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Presentación</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditarProducto(prod)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar producto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProductoAEliminar(prod)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabla de Presentaciones Comerciales */}
                <div className="p-4 sm:p-5">
                  {!tienePresentaciones ? (
                    <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      Este producto no tiene presentaciones aún. Haz clic en "+ Presentación" para agregar una (ej. Pay completo, Rebanada, Medio Litro, Vaso 6 oz).
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prod.presentaciones.map((pres) => (
                        <div
                          key={pres.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-800 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                  {pres.nombre}
                                </h4>
                                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                  {pres.tipoCalculo === 'porciones' &&
                                    `1 de ${pres.rebanadasTotalesPorReceta || 8} rebanadas (${(pres.factorReceta * 100).toFixed(1)}% receta)`}
                                  {pres.tipoCalculo === 'fraccion' &&
                                    `Receta completa (${(pres.factorReceta * 100).toFixed(0)}%)`}
                                  {pres.tipoCalculo === 'volumen_ml' &&
                                    `${pres.cantidadOVolumen} ml (${(pres.factorReceta * 100).toFixed(1)}% volumen receta)`}
                                  {pres.tipoCalculo === 'peso_g' &&
                                    `${pres.cantidadOVolumen} g (${(pres.factorReceta * 100).toFixed(1)}% peso receta)`}
                                </span>
                              </div>

                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                Stock: {pres.stockListo || 0}
                              </span>
                            </div>

                            {pres.descripcion && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {pres.descripcion}
                              </p>
                            )}

                            {/* Desglose de Costos de la Presentación */}
                            <div className="my-3 space-y-1.5 text-xs p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Costo Base Receta:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {formatMXN(pres.costoBaseReceta)}
                                </span>
                              </div>

                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Empaque ({pres.empaques?.length || 0} insumos):</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {formatMXN(pres.costoEmpaqueTotal)}
                                </span>
                              </div>

                              <div className="flex justify-between font-bold pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                                <span>Costo Unitario Total:</span>
                                <span className="text-rose-600 dark:text-rose-400 font-mono">
                                  {formatMXN(pres.costoUnitarioTotal)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Precios y Rentabilidad */}
                          <div>
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between mb-2.5">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                                  Precio de Venta:
                                </span>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                  {formatMXN(pres.precioVentaReal)}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                                  Ganancia Limpia:
                                </span>
                                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                                  +{formatMXN(pres.gananciaPorUnidad)}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                                  ({formatPorcentaje(pres.margenRealPct)} margen)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="text-[11px] text-slate-400">
                                Sugerido ({pres.margenDeseadoPct}%): {formatMXN(pres.precioSugerido)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditarPresentacion(prod, pres)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Editar presentación"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setPresAEliminar({
                                      prodId: prod.id,
                                      presId: pres.id,
                                      nombre: pres.nombre,
                                    })
                                  }
                                  className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Eliminar presentación"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO PADRE */}
      <Modal
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        title={editingProducto ? 'Editar Producto' : 'Crear Nuevo Producto'}
        subtitle="Un producto agrupa varias presentaciones comerciales vinculadas a una misma receta"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitProducto} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Pay de Queso, Arroz con Leche, Pastel Tres Leches..."
              value={prodNombre}
              onChange={(e) => setProdNombre(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Receta Base Asociada *
            </label>
            <select
              required
              value={prodRecetaId}
              onChange={(e) => setProdRecetaId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="">-- Selecciona la receta costeadora --</option>
              {recetas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} (Rinde: {r.rendimientoCantidad} {r.rendimientoUnidad} • Costo:{' '}
                  {formatMXN(r.costoTotalReceta)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <input
                type="text"
                placeholder="Ej. Pays, Postres Tradicionales, Galletas..."
                value={prodCategoria}
                onChange={(e) => setProdCategoria(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descripción (Opcional)
              </label>
              <input
                type="text"
                placeholder="Descripción general del producto..."
                value={prodDescripcion}
                onChange={(e) => setProdDescripcion(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProdModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              {editingProducto ? 'Actualizar Producto' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL CREAR / EDITAR PRESENTACIÓN COMERCIAL */}
      <Modal
        isOpen={isPresModalOpen}
        onClose={() => setIsPresModalOpen(false)}
        title={editingPres ? 'Editar Presentación Comercial' : 'Agregar Presentación Comercial'}
        subtitle="Configura el tamaño, porción o volumen, empaques y precio de venta"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitPresentacion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Presentación *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pay Completo, Rebanada, Medio Litro (500 ml), Vaso 6 oz..."
                value={presNombre}
                onChange={(e) => setPresNombre(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Porción o Cálculo *
              </label>
              <select
                value={presTipoCalculo}
                onChange={(e) => {
                  const t = e.target.value as TipoCalculoPresentacion;
                  setPresTipoCalculo(t);
                  if (t === 'porciones') {
                    setPresCantidadOVolumen('1');
                    setPresUnidadMedida('rebanada');
                  } else if (t === 'volumen_ml') {
                    setPresCantidadOVolumen('500');
                    setPresUnidadMedida('ml');
                  } else if (t === 'fraccion') {
                    setPresCantidadOVolumen('1');
                    setPresUnidadMedida('pieza');
                  }
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="fraccion">Producto Completo (Pay / Pastel entero)</option>
                <option value="porciones">Rebanada / Porción (ej. 1 de 8 rebanadas)</option>
                <option value="volumen_ml">Volumen Líquido en Mililitros (ml o fl oz)</option>
                <option value="peso_g">Porción por Peso en Gramos (g)</option>
              </select>
            </div>

            {/* Configuración de Rebanadas si es porciones */}
            {presTipoCalculo === 'porciones' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ¿Cuántas rebanadas se obtienen del pay completo? *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ej. 8 o 10"
                  value={presRebanadasTotales}
                  onChange={(e) => setPresRebanadasTotales(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Cada rebanada absorberá 1/{presRebanadasTotales || 8} del costo total de producción del pay.
                </span>
              </div>
            )}

            {/* Configuración de Volumen si es volumen_ml */}
            {presTipoCalculo === 'volumen_ml' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Volumen Servido (ml) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="Ej. 500 o 177.4"
                    value={presCantidadOVolumen}
                    onChange={(e) => setPresCantidadOVolumen(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">ml</span>
                </div>
                {/* Botones de acceso rápido para medidas típicas */}
                <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPresCantidadOVolumen('500');
                      setPresNombre((prev) => prev || 'Medio Litro (500 ml)');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                  >
                    Medio Litro (500 ml)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPresCantidadOVolumen('177.4');
                      setPresNombre((prev) => prev || 'Vaso 6 oz (~177.4 ml)');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                  >
                    Vaso 6 oz (177.4 ml)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPresCantidadOVolumen('236.6');
                      setPresNombre((prev) => prev || 'Vaso 8 oz (236.6 ml)');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                  >
                    Vaso 8 oz
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPresCantidadOVolumen('1000');
                      setPresNombre((prev) => prev || '1 Litro (1000 ml)');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                  >
                    1 Litro
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* EMPAQUES ESPECÍFICOS DE LA PRESENTACIÓN */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  Empaque y Desechables de esta Presentación
                </span>
                <p className="text-[10px] text-slate-500">
                  Agrega caja, domo, vaso, tapa, cuchara y etiqueta específicos de este tamaño
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddEmpaqueItem}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                + Empaque
              </button>
            </div>

            {presEmpaques.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-1">
                Sin empaque asignado. Haz clic en "+ Empaque" si usas caja, domo, vaso o etiqueta.
              </p>
            ) : (
              <div className="space-y-1.5">
                {presEmpaques.map((item, idx) => {
                  const ins = insumoMap.get(item.insumoId);
                  const costo = ins ? item.cantidad * ins.costoPorUnidadUso : 0;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <select
                        value={item.insumoId}
                        onChange={(e) => {
                          const nId = e.target.value;
                          setPresEmpaques((prev) =>
                            prev.map((el, i) => (i === idx ? { ...el, insumoId: nId } : el))
                          );
                        }}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {insumosEmpaques.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} ({formatMXN(i.costoPorUnidadUso)}/pza)
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-20">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setPresEmpaques((prev) =>
                              prev.map((el, i) => (i === idx ? { ...el, cantidad: val } : el))
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right"
                        />
                        <span className="text-[10px] text-slate-400">pza</span>
                      </div>

                      <span className="w-20 text-right font-mono font-bold">{formatMXN(costo)}</span>

                      <button
                        type="button"
                        onClick={() => setPresEmpaques((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FIJACIÓN DE PRECIOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Margen Objetivo Deseado (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="95"
                  value={presMargenDeseado}
                  onChange={(e) => setPresMargenDeseado(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Precio Sugerido:{' '}
                <strong className="text-amber-600 dark:text-amber-400">
                  {formatMXN(calculoPresEnVivo.precioSugerido)}
                </strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                Precio de Venta al Público ($ MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  required
                  placeholder={String(calculoPresEnVivo.precioSugerido)}
                  value={presPrecioVentaReal}
                  onChange={(e) => setPresPrecioVentaReal(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-base font-black rounded-xl border border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Ej. $180 (pay completo), $40 (rebanada), etc.
              </span>
            </div>
          </div>

          {/* RESUMEN DE RENTABILIDAD EN VIVO */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Costo Base de Receta ({(calculoPresEnVivo.factor * 100).toFixed(1)}%):
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatMXN(calculoPresEnVivo.costoBaseReceta)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Costo de Empaque Específico:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatMXN(calculoPresEnVivo.costoEmpaqueTotal)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Costo Total Unitario de esta Presentación:</span>
              <span className="font-mono">{formatMXN(calculoPresEnVivo.costoUnitarioTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
              <span>Ganancia Neta por Unidad Vendida:</span>
              <span className="font-mono text-sm">+{formatMXN(calculoPresEnVivo.ganancia)}</span>
            </div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
              <span>Margen Real Obtenido:</span>
              <span>{formatPorcentaje(calculoPresEnVivo.margenReal)}</span>
            </div>
          </div>

          
          {/* EXISTENCIAS DE LA PRESENTACIÓN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Stock listo de {presNombre.trim() || 'esta presentación'}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={presStockListo}
              onChange={(e) => setPresStockListo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Cuenta unidades vendibles de esta presentación. Por ejemplo, pays completos y rebanadas llevan existencias separadas.
            </span>
          </div>


          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPresModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              {editingPres ? 'Actualizar Presentación' : 'Guardar Presentación'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMAR ELIMINAR PRODUCTO */}
      {productoAEliminar && (
        <ConfirmDialog
          isOpen={!!productoAEliminar}
          onClose={() => setProductoAEliminar(null)}
          onConfirm={() => {
            deleteProducto(productoAEliminar.id);
            setProductoAEliminar(null);
          }}
          title="Eliminar Producto"
          message={`¿Estás seguro de eliminar el producto "${productoAEliminar.nombre}" y todas sus presentaciones comerciales?`}
          confirmText="Eliminar Producto"
          isDestructive={true}
        />
      )}

      {/* CONFIRMAR ELIMINAR PRESENTACIÓN */}
      {presAEliminar && (
        <ConfirmDialog
          isOpen={!!presAEliminar}
          onClose={() => setPresAEliminar(null)}
          onConfirm={() => {
            deletePresentacion(presAEliminar.prodId, presAEliminar.presId);
            setPresAEliminar(null);
          }}
          title="Eliminar Presentación"
          message={`¿Eliminar "${presAEliminar.nombre}"? Si queda stock, se pondrá en cero y se devolverán sus ingredientes según la receta y el factor actuales. Si ya tuvo ventas, se conservará desactivada para mantener el historial. Los empaques de esta presentación se descuentan al vender, así que no se devuelven por el stock que aún queda.`}
          confirmText="Eliminar Presentación"
          isDestructive={true}
        />
      )}
    </div>
  );
};
