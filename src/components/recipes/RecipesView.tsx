import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Flame,
  Zap,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Receta,
  IngredienteReceta,
  EmpaqueReceta,
  CostosIndirectosReceta,
  Insumo,
} from '../../types';
import {
  formatMXN,
  formatCostoUnitario,
  formatFecha,
} from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const RecipesView: React.FC = () => {
  const {
    recetas,
    insumos,
    configuracion,
    addReceta,
    updateReceta,
    deleteReceta,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
  const [recetaAEliminar, setRecetaAEliminar] = useState<Receta | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [rendimientoCantidad, setRendimientoCantidad] = useState('8');
  const [rendimientoUnidad, setRendimientoUnidad] = useState('rebanadas');
  const [mermaEstimada, setMermaEstimada] = useState('0');
  const [volumenUtilizable, setVolumenUtilizable] = useState('');
  const [unidadMedidaBase, setUnidadMedidaBase] = useState<'unidades' | 'ml' | 'litros' | 'g' | 'kg'>('unidades');
  const [tiempoElaboracion, setTiempoElaboracion] = useState('60');

  // Ingredientes en la receta
  const [ingredientes, setIngredientes] = useState<
    { insumoId: string; cantidad: number }[]
  >([]);

  // Empaques directos en la receta
  const [empaques, setEmpaques] = useState<
    { insumoId: string; cantidad: number }[]
  >([]);

  const [desechables, setDesechables] = useState<
    { insumoId: string; cantidad: number }[]
  >([]);

  const [otrosInsumos, setOtrosInsumos] = useState<
    { insumoId: string; cantidad: number }[]
  >([]);

  // Costos Indirectos
  const [minutosGas, setMinutosGas] = useState('45');
  const [costoHoraGas, setCostoHoraGas] = useState(
    String(configuracion.costoHoraGasDefault || 14)
  );

  const [minutosLuz, setMinutosLuz] = useState('20');
  const [costoHoraLuz, setCostoHoraLuz] = useState(
    String(configuracion.costoHoraLuzDefault || 7.5)
  );

  const [minutosManoObra, setMinutosManoObra] = useState('30');
  const [costoHoraManoObra, setCostoHoraManoObra] = useState(
    String(configuracion.costoHoraManoObraDefault || 65)
  );

  const [otrosCostosFijos, setOtrosCostosFijos] = useState('5.00');

  // Mapeo rápido de insumos
  const insumoMap = useMemo(() => {
    return new Map<string, Insumo>(insumos.map((i) => [i.id, i]));
  }, [insumos]);

  const insumosIngredientes = useMemo(() => {
  return insumos.filter((i) => i.tipo === 'ingrediente');
}, [insumos]);

const insumosEmpaques = useMemo(() => {
  return insumos.filter((i) => i.tipo === 'empaque');
}, [insumos]);

const insumosDesechables = useMemo(() => {
  return insumos.filter((i) => i.tipo === 'desechable');
}, [insumos]);

const insumosOtros = useMemo(() => {
  return insumos.filter((i) => i.tipo === 'otro');
}, [insumos]);

  // Cálculos reactivos en vivo para el modal
  const calculosEnVivo = useMemo(() => {
    let costoIng = 0;
    const listaIngCalculados = ingredientes.map((ing) => {
      const ins = insumoMap.get(ing.insumoId);
      const costoUnit = ins ? ins.costoPorUnidadUso : 0;
      const costo = ing.cantidad * costoUnit;
      costoIng += costo;
      return { ...ing, costoCalculado: costo };
    });

    let costoEmp = 0;
    const listaEmpCalculados = empaques.map((emp) => {
      const ins = insumoMap.get(emp.insumoId);
      const costoUnit = ins ? ins.costoPorUnidadUso : 0;
      const costo = emp.cantidad * costoUnit;
      costoEmp += costo;
      return { ...emp, costoCalculado: costo };
    });

    
    let costoDesechables = 0;
    const listaDesechablesCalculados = desechables.map((item) => {
      const ins = insumoMap.get(item.insumoId);
      const costoUnit = ins ? ins.costoPorUnidadUso : 0;
      const costo = item.cantidad * costoUnit;
      costoDesechables += costo;
      return { ...item, costoCalculado: costo };
    });

    let costoOtrosInsumos = 0;
    const listaOtrosInsumosCalculados = otrosInsumos.map((item) => {
      const ins = insumoMap.get(item.insumoId);
      const costoUnit = ins ? ins.costoPorUnidadUso : 0;
      const costo = item.cantidad * costoUnit;
      costoOtrosInsumos += costo;
      return { ...item, costoCalculado: costo };
    });


    const mGas = parseFloat(minutosGas) || 0;
    const cHGas = parseFloat(costoHoraGas) || 0;
    const cGas = (mGas / 60) * cHGas;

    const mLuz = parseFloat(minutosLuz) || 0;
    const cHLuz = parseFloat(costoHoraLuz) || 0;
    const cLuz = (mLuz / 60) * cHLuz;

    const mMano = parseFloat(minutosManoObra) || 0;
    const cHMano = parseFloat(costoHoraManoObra) || 0;
    const cMano = (mMano / 60) * cHMano;

    const cOtros = parseFloat(otrosCostosFijos) || 0;

    const costoInd = cGas + cLuz + cMano + cOtros;
    const costoTotal = costoIng + costoEmp + costoDesechables + costoOtrosInsumos + costoInd;
    const rendimiento = parseFloat(rendimientoCantidad) || 1;
    const costoPorUnidad = rendimiento > 0 ? costoTotal / rendimiento : 0;

    return {
      costoIng,
      costoEmp,
      costoDesechables,
      costoOtrosInsumos,
      costoInd,
      costoTotal,
      costoPorUnidad,
      cGas,
      cLuz,
      cMano,
      cOtros,
      listaIngCalculados,
      listaEmpCalculados,
      listaDesechablesCalculados,
      listaOtrosInsumosCalculados,
    };
  }, [
    ingredientes,
    empaques,
    desechables,
    otrosInsumos,
    insumoMap,
    minutosGas,
    costoHoraGas,
    minutosLuz,
    costoHoraLuz,
    minutosManoObra,
    costoHoraManoObra,
    otrosCostosFijos,
    rendimientoCantidad,
  ]);

  const handleOpenNuevo = () => {
    setEditingReceta(null);
    setNombre('');
    setDescripcion('');
    setRendimientoCantidad('8');
    setRendimientoUnidad('rebanadas');
    setVolumenUtilizable('');
    setUnidadMedidaBase('unidades');
    setTiempoElaboracion('60');
    setIngredientes([]);
    setEmpaques([]);
    setDesechables([]);
    setOtrosInsumos([]);
    setMinutosGas('45');
    setCostoHoraGas(String(configuracion.costoHoraGasDefault || 14));
    setMinutosLuz('20');
    setCostoHoraLuz(String(configuracion.costoHoraLuzDefault || 7.5));
    setMinutosManoObra('30');
    setCostoHoraManoObra(String(configuracion.costoHoraManoObraDefault || 65));
    setOtrosCostosFijos('5.00');
    setIsModalOpen(true);
  };

  const handleOpenEditar = (rec: Receta) => {
    setEditingReceta(rec);
    setNombre(rec.nombre);
    setDescripcion(rec.descripcion || '');
    setRendimientoCantidad(String(rec.rendimientoCantidad));
    setRendimientoUnidad(rec.rendimientoUnidad);
    setVolumenUtilizable(
      rec.volumenOUnidadesUtilizables != null
        ? String(rec.volumenOUnidadesUtilizables)
        : ''
    );
setUnidadMedidaBase(rec.unidadMedidaBase || 'unidades');
    setTiempoElaboracion(String(rec.tiempoElaboracionMinutos));
    setIngredientes(rec.ingredientes.map((i) => ({ insumoId: i.insumoId, cantidad: i.cantidad })));
    setEmpaques((rec.empaques || []).map((e) => ({ insumoId: e.insumoId, cantidad: e.cantidad })));
    setDesechables((rec.desechables || []).map((e) => ({insumoId: e.insumoId,cantidad: e.cantidad})));
    setOtrosInsumos((rec.otrosInsumos || []).map((e) => ({insumoId: e.insumoId,cantidad: e.cantidad})));
    setMinutosGas(String(rec.indirectos?.minutosGas || 0));
    setCostoHoraGas(String(rec.indirectos?.costoPorHoraGas || configuracion.costoHoraGasDefault));
    setMinutosLuz(String(rec.indirectos?.minutosLuz || 0));
    setCostoHoraLuz(String(rec.indirectos?.costoPorHoraLuz || configuracion.costoHoraLuzDefault));
    setMinutosManoObra(String(rec.indirectos?.minutosManoObra || 0));
    setCostoHoraManoObra(String(rec.indirectos?.costoPorHoraManoObra || configuracion.costoHoraManoObraDefault));
    setOtrosCostosFijos(String(rec.indirectos?.otrosCostosFijos || 0));
    setIsModalOpen(true);
  };

  const handleAddIngredienteFila = () => {
    const primerInsumo = insumosIngredientes[0] || insumos[0];
    if (!primerInsumo) {
      alert('Debes registrar insumos en el catálogo primero antes de crear una receta.');
      return;
    }
    setIngredientes((prev) => [...prev, { insumoId: primerInsumo.id, cantidad: 100 }]);
  };

  const handleAddEmpaqueFila = () => {
    const primerEmpaque = insumosEmpaques[0] || insumos[0];
    if (!primerEmpaque) {
      alert('Debes registrar insumos de empaque en el catálogo primero.');
      return;
    }
    setEmpaques((prev) => [...prev, { insumoId: primerEmpaque.id, cantidad: 1 }]);
  };

  
const handleAddDesechableFila = () => {
  const primer = insumosDesechables[0];

  if (!primer) {
    alert('Registra al menos un insumo de tipo Desechable en el catálogo.');
    return;
  }

  setDesechables((prev) => [
    ...prev,
    { insumoId: primer.id, cantidad: 1 },
  ]);
};

const handleAddOtroInsumoFila = () => {
  const primer = insumosOtros[0];

  if (!primer) {
    alert('Registra al menos un insumo de tipo Otro en el catálogo.');
    return;
  }

  setOtrosInsumos((prev) => [
    ...prev,
    { insumoId: primer.id, cantidad: 1 },
  ]);
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rendCant = parseFloat(rendimientoCantidad);
    if (!nombre.trim() || isNaN(rendCant) || rendCant <= 0) {
      alert('Ingresa un nombre y un rendimiento válido para la receta.');
      return;
    }

    if (ingredientes.length === 0) {
      alert('Agrega al menos un ingrediente a la receta.');
      return;
    }

    const indirectosData: CostosIndirectosReceta = {
      minutosGas: parseFloat(minutosGas) || 0,
      costoPorHoraGas: parseFloat(costoHoraGas) || 0,
      costoGas: calculosEnVivo.cGas,
      minutosLuz: parseFloat(minutosLuz) || 0,
      costoPorHoraLuz: parseFloat(costoHoraLuz) || 0,
      costoLuz: calculosEnVivo.cLuz,
      minutosManoObra: parseFloat(minutosManoObra) || 0,
      costoPorHoraManoObra: parseFloat(costoHoraManoObra) || 0,
      costoManoObra: calculosEnVivo.cMano,
      otrosCostosFijos: parseFloat(otrosCostosFijos) || 0,
    };

    if (editingReceta) {
      updateReceta(editingReceta.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        rendimientoCantidad: rendCant,
        rendimientoUnidad: rendimientoUnidad.trim(),
        volumenOUnidadesUtilizables: volumenUtilizable
          ? Number(volumenUtilizable)
          : undefined,
        unidadMedidaBase,
        tiempoElaboracionMinutos: parseFloat(tiempoElaboracion) || 0,
        ingredientes: calculosEnVivo.listaIngCalculados,
        empaques: calculosEnVivo.listaEmpCalculados,
        desechables: calculosEnVivo.listaDesechablesCalculados,
        otrosInsumos: calculosEnVivo.listaOtrosInsumosCalculados,
        costoDesechables: calculosEnVivo.costoDesechables,
        costoOtrosInsumos: calculosEnVivo.costoOtrosInsumos,
        indirectos: indirectosData,
        costoIngredientes: calculosEnVivo.costoIng,
        costoEmpaques: calculosEnVivo.costoEmp,
        costoIndirectos: calculosEnVivo.costoInd,
        costoTotalReceta: calculosEnVivo.costoTotal,
        costoPorUnidad: calculosEnVivo.costoPorUnidad,
      });
    } else {
      addReceta({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        rendimientoCantidad: rendCant,
        rendimientoUnidad: rendimientoUnidad.trim(),
        volumenOUnidadesUtilizables: volumenUtilizable
          ? Number(volumenUtilizable)
          : undefined,
        unidadMedidaBase,
        tiempoElaboracionMinutos: parseFloat(tiempoElaboracion) || 0,
        ingredientes: calculosEnVivo.listaIngCalculados,
        empaques: calculosEnVivo.listaEmpCalculados,
        desechables: calculosEnVivo.listaDesechablesCalculados,
        otrosInsumos: calculosEnVivo.listaOtrosInsumosCalculados,
        costoDesechables: calculosEnVivo.costoDesechables,
        costoOtrosInsumos: calculosEnVivo.costoOtrosInsumos,
        indirectos: indirectosData,
        costoIngredientes: calculosEnVivo.costoIng,
        costoEmpaques: calculosEnVivo.costoEmp,
        costoIndirectos: calculosEnVivo.costoInd,
        costoTotalReceta: calculosEnVivo.costoTotal,
        costoPorUnidad: calculosEnVivo.costoPorUnidad,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-500" />
            Recetas y Costeo de Producción
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Costea tandas completas: ingredientes, empaques, gas, luz y mano de obra
          </p>
        </div>

        <button
          onClick={handleOpenNuevo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Receta</span>
        </button>
      </div>

      {/* Grid de Recetas */}
      {recetas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            Aún no tienes recetas costeadas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Crea tu primera receta para conocer el costo exacto por rebanada, pastel o charola.
          </p>
          <button
            onClick={handleOpenNuevo}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold shadow-sm"
          >
            + Crear Primera Receta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recetas.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-800/80 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {rec.nombre}
                    </h3>
                    <div className="mt-1">
                      {rec.esDemostracion ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                          Ejemplo Demo
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          Dato Real
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                    Rinde: {rec.rendimientoCantidad} {rec.rendimientoUnidad}
                  </span>
                </div>

                {rec.descripcion && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {rec.descripcion}
                  </p>
                )}

                {/* Desglose de costos de la receta */}
                <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-500" />
                      Ingredientes ({rec.ingredientes.length}):
                    </span>
                    <span className="font-semibold">{formatMXN(rec.costoIngredientes)}</span>
                  </div>

                  
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-500" />
                      Empaques:
                    </span>
                    <span className="font-semibold">
                      {formatMXN(rec.costoEmpaques)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      Desechables:
                    </span>
                    <span className="font-semibold">
                      {formatMXN(rec.costoDesechables ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-500" />
                      Otros insumos:
                    </span>
                    <span className="font-semibold">
                      {formatMXN(rec.costoOtrosInsumos ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      Gas, Luz y Mano de obra:
                    </span>
                    <span className="font-semibold">
                      {formatMXN(rec.costoIndirectos)}
                    </span>
                  </div>


                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Costo Total Tanda:</span>
                    <span className="text-amber-600 dark:text-amber-400 text-sm">
                      {formatMXN(rec.costoTotalReceta)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Costo Unitario Destacado y Botones */}
              <div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                      Costo de Producción:
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Por {rec.rendimientoUnidad.replace(/s$/, '') || 'unidad'}
                    </p>
                  </div>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatMXN(rec.costoPorUnidad)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEditar(rec)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Editar receta"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRecetaAEliminar(rec)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Eliminar receta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Receta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReceta ? 'Editar Receta' : 'Crear y Costear Receta'}
        subtitle="Ingresa la fórmula, rendimiento y consumos indirectos"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos Generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Receta *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pay de Queso Horneado 24cm, Brownies de Nuez..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rendimiento en Unidades *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder="Ej. 8, 12, 1"
                value={rendimientoCantidad}
                onChange={(e) => setRendimientoCantidad(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Unidad Producida
              </label>
              <input
                type="text"
                placeholder="rebanadas, piezas, pasteles, domos"
                value={rendimientoUnidad}
                onChange={(e) => setRendimientoUnidad(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Volumen o peso utilizable de la receta
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={volumenUtilizable}
                  onChange={(e) => setVolumenUtilizable(e.target.value)}
                  placeholder="Ej. 6.5"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cantidad final que realmente puedes vender después de preparar la receta.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Unidad de medida base
                </label>
                <select
                  value={unidadMedidaBase}
                  onChange={(e) =>
                    setUnidadMedidaBase(
                      e.target.value as
                        | 'unidades'
                        | 'ml'
                        | 'litros'
                        | 'g'
                        | 'kg'
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                >
                  <option value="unidades">Unidades</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="litros">Litros (L)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="kg">Kilogramos (kg)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Selecciona la unidad en la que capturaste la cantidad anterior.
                </p>
              </div>
            </div>



          </div>

          {/* SECCIÓN 1: INGREDIENTES */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-500" />
                  1. Ingredientes del Catálogo ({ingredientes.length})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Se calcula el costo automáticamente según la cantidad usada
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredienteFila}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
              >
                + Añadir Ingrediente
              </button>
            </div>

            {ingredientes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No has agregado ingredientes. Haz clic en "+ Añadir Ingrediente".
              </p>
            ) : (
              <div className="space-y-2">
                {ingredientes.map((ing, idx) => {
                  const ins = insumoMap.get(ing.insumoId);
                  const costoCalc = ins ? ing.cantidad * ins.costoPorUnidadUso : 0;
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      {/* Insumo Selector */}
                      <select
                        value={ing.insumoId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setIngredientes((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, insumoId: newId } : item))
                          );
                        }}
                        className="flex-1 min-w-[140px] px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {insumosIngredientes.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} ({formatCostoUnitario(i.costoPorUnidadUso)}/{i.unidadUso})
                          </option>
                        ))}
                      </select>

                      {/* Cantidad */}
                      <div className="flex items-center gap-1 w-28 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={ing.cantidad}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setIngredientes((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, cantidad: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-right"
                        />
                        <span className="text-slate-500 font-medium">
                          {ins ? ins.unidadUso : 'g'}
                        </span>
                      </div>

                      {/* Costo Calculado */}
                      <div className="w-24 text-right font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {formatMXN(costoCalc)}
                      </div>

                      {/* Eliminar fila */}
                      <button
                        type="button"
                        onClick={() =>
                          setIngredientes((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">
              Subtotal Ingredientes: {formatMXN(calculosEnVivo.costoIng)}
            </div>
          </div>

          {/* SECCIÓN 2: EMPAQUES Y MATERIALES DIRECTOS */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-500" />
                  2. Empaques / Moldes Desechables de la Tanda
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bases de cartón, papel encerado, domos o capacillos usados al hornear
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddEmpaqueFila}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                + Añadir Empaque
              </button>
            </div>

            {empaques.length > 0 && (
              <div className="space-y-2">
                {empaques.map((emp, idx) => {
                  const ins = insumoMap.get(emp.insumoId);
                  const costoCalc = ins ? emp.cantidad * ins.costoPorUnidadUso : 0;
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <select
                        value={emp.insumoId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setEmpaques((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, insumoId: newId } : item))
                          );
                        }}
                        className="flex-1 min-w-[140px] px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {insumosEmpaques.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} ({formatCostoUnitario(i.costoPorUnidadUso)}/{i.unidadUso})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={emp.cantidad}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEmpaques((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, cantidad: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-right"
                        />
                        <span className="text-slate-500 font-medium">pza</span>
                      </div>

                      <div className="w-24 text-right font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {formatMXN(costoCalc)}
                      </div>

                      <button
                        type="button"
                        onClick={() => setEmpaques((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: DESECHABLES */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-500" />
                  3. Desechables
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vasos, cucharas, servilletas, bolsas y otros materiales desechables
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDesechableFila}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
              >
                + Añadir Desechable
              </button>
            </div>

            {desechables.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No has agregado desechables.
              </p>
            ) : (
              <div className="space-y-2">
                {desechables.map((item, idx) => {
                  const ins = insumoMap.get(item.insumoId);
                  const costoCalc = ins ? item.cantidad * ins.costoPorUnidadUso : 0;
                
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <select
                        value={item.insumoId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setDesechables((prev) =>
                            prev.map((fila, i) =>
                              i === idx ? { ...fila, insumoId: newId } : fila
                            )
                          );
                        }}
                        className="flex-1 min-w-[140px] px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {insumosDesechables.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} ({formatCostoUnitario(i.costoPorUnidadUso)}/{i.unidadUso})
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDesechables((prev) =>
                              prev.map((fila, i) =>
                                i === idx ? { ...fila, cantidad: val } : fila
                              )
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-right"
                        />
                        <span className="text-slate-500 font-medium">
                          {ins?.unidadUso || 'pza'}
                        </span>
                      </div>
                        
                      <div className="w-24 text-right font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {formatMXN(costoCalc)}
                      </div>
                        
                      <button
                        type="button"
                        onClick={() =>
                          setDesechables((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">
              Subtotal Desechables: {formatMXN(calculosEnVivo.costoDesechables)}
            </div>
          </div>

          
          {/* SECCIÓN 4: OTROS INSUMOS */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-500" />
                  4. Otros insumos
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Materiales auxiliares que no corresponden a ingredientes, empaques o desechables
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOtroInsumoFila}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              >
                + Añadir insumo
              </button>
            </div>

            {otrosInsumos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No has agregado otros insumos.
              </p>
            ) : (
              <div className="space-y-2">
                {otrosInsumos.map((item, idx) => {
                  const ins = insumoMap.get(item.insumoId);
                  const costoCalc = ins ? item.cantidad * ins.costoPorUnidadUso : 0;
                
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <select
                        value={item.insumoId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setOtrosInsumos((prev) =>
                            prev.map((fila, i) =>
                              i === idx ? { ...fila, insumoId: newId } : fila
                            )
                          );
                        }}
                        className="flex-1 min-w-[140px] px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        {insumosOtros.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} ({formatCostoUnitario(i.costoPorUnidadUso)}/{i.unidadUso})
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setOtrosInsumos((prev) =>
                              prev.map((fila, i) =>
                                i === idx ? { ...fila, cantidad: val } : fila
                              )
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-right"
                        />
                        <span className="text-slate-500 font-medium">
                          {ins?.unidadUso || 'pza'}
                        </span>
                      </div>
                        
                      <div className="w-24 text-right font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {formatMXN(costoCalc)}
                      </div>
                        
                      <button
                        type="button"
                        onClick={() =>
                          setOtrosInsumos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">
              Subtotal Otros insumos: {formatMXN(calculosEnVivo.costoOtrosInsumos)}
            </div>
          </div>


          {/* SECCIÓN 5: COSTOS INDIRECTOS (GAS, LUZ, MANO DE OBRA) */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              3. Servicios y Mano de Obra Asignada
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Gas */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Gas LP de Horno
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Minutos"
                    value={minutosGas}
                    onChange={(e) => setMinutosGas(e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <span>min a</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={costoHoraGas}
                    onChange={(e) => setCostoHoraGas(e.target.value)}
                    className="w-14 px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <span>$/h</span>
                </div>
                <p className="font-mono font-bold text-right text-rose-600 dark:text-rose-400">
                  {formatMXN(calculosEnVivo.cGas)}
                </p>
              </div>

              {/* Luz */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  Luz / Batidora / Frío
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Minutos"
                    value={minutosLuz}
                    onChange={(e) => setMinutosLuz(e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <span>min a</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={costoHoraLuz}
                    onChange={(e) => setCostoHoraLuz(e.target.value)}
                    className="w-14 px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <span>$/h</span>
                </div>
                <p className="font-mono font-bold text-right text-yellow-600 dark:text-yellow-400">
                  {formatMXN(calculosEnVivo.cLuz)}
                </p>
              </div>

              {/* Mano de Obra */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Mano de Obra
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Minutos"
                    value={minutosManoObra}
                    onChange={(e) => setMinutosManoObra(e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <span>min a</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={costoHoraManoObra}
                    onChange={(e) => setCostoHoraManoObra(e.target.value)}
                    className="w-14 px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <span>$/h</span>
                </div>
                <p className="font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                  {formatMXN(calculosEnVivo.cMano)}
                </p>
              </div>
            </div>
          </div>

          {/* RESUMEN FINAL EN VIVO */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                Costo Total Tanda ({rendimientoCantidad} {rendimientoUnidad}):
              </span>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300">
                {formatMXN(calculosEnVivo.costoTotal)}
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-amber-200 dark:border-amber-800 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                Costo Unitario de Producción:
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatMXN(calculosEnVivo.costoPorUnidad)}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition active:scale-95"
            >
              {editingReceta ? 'Actualizar Receta' : 'Guardar y Costear Receta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Eliminar Receta */}
      {recetaAEliminar && (
        <ConfirmDialog
          isOpen={!!recetaAEliminar}
          onClose={() => setRecetaAEliminar(null)}
          onConfirm={() => {
            const exito = deleteReceta(recetaAEliminar.id);
            if (!exito) {
              alert(
                'No se puede eliminar esta receta porque está vinculada a uno o más productos a la venta. Desvincula primero los productos.'
              );
            }
            setRecetaAEliminar(null);
          }}
          title="Eliminar Receta"
          message={`¿Estás seguro de que deseas eliminar la receta "${recetaAEliminar.nombre}"?`}
          confirmText="Eliminar Receta"
          isDestructive={true}
        />
      )}
    </div>
  );
};
