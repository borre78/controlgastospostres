import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Flame,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Clock,
  History,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Receta, Insumo, ProductoVenta } from '../../types';
import { formatMXN, formatFecha, formatCostoUnitario } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const InventoryView: React.FC = () => {
  const {
    insumos,
    recetas,
    productos,
    producciones,
    ejecutarProduccion,
    ajustarStockInsumo,
  } = useApp();

  // Modal Hornear / Registrar Producción
  const [isHornearModalOpen, setIsHornearModalOpen] = useState(false);
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState('');
  const [tandas, setTandas] = useState('1');
  const [sumarStockProdId, setSumarStockProdId] = useState('');
  const [sumarStockPresId, setSumarStockPresId] = useState('');
  const [descontarInsumos, setDescontarInsumos] = useState(true);
  const [notasProduccion, setNotasProduccion] = useState('');
  const [mensajeResultado, setMensajeResultado] = useState<{
    tipo: 'success' | 'error';
    texto: string;
    faltantes?: { nombre: string; requerido: number; disponible: number; unidad: string }[];
  } | null>(null);

  // Modal Ajuste Rápido de Insumo
  const [insumoAAjustar, setInsumoAAjustar] = useState<Insumo | null>(null);
  const [nuevoStock, setNuevoStock] = useState('');

  // Filtros de tabla
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingrediente' | 'empaque' | 'bajo'>('todos');

  // Mapeos
  const insumoMap = useMemo(() => new Map(insumos.map((i) => [i.id, i])), [insumos]);
  const recetaMap = useMemo(() => new Map(recetas.map((r) => [r.id, r])), [recetas]);

  const recetaSeleccionada = recetaMap.get(recetaSeleccionadaId);

  // Previsualización de consumos para la tanda
  const previewConsumos = useMemo(() => {
    if (!recetaSeleccionada) return [];
    const t = parseFloat(tandas) || 1;
    const items: {
      nombre: string;
      consumo: number;
      unidad: string;
      stockActual: number;
      suficiente: boolean;
    }[] = [];

    recetaSeleccionada.ingredientes.forEach((ing) => {
      const ins = insumoMap.get(ing.insumoId);
      if (ins) {
        const consumo = ing.cantidad * t;
        items.push({
          nombre: ins.nombre,
          consumo,
          unidad: ins.unidadUso,
          stockActual: ins.stockActual,
          suficiente: ins.stockActual >= consumo,
        });
      }
    });

    (recetaSeleccionada.empaques || []).forEach((emp) => {
      const ins = insumoMap.get(emp.insumoId);
      if (ins) {
        const consumo = emp.cantidad * t;
        items.push({
          nombre: ins.nombre,
          consumo,
          unidad: ins.unidadUso,
          stockActual: ins.stockActual,
          suficiente: ins.stockActual >= consumo,
        });
      }
    });

    return items;
  }, [recetaSeleccionada, tandas, insumoMap]);

  const hayFaltantes = previewConsumos.some((i) => !i.suficiente);

  const handleOpenHornear = () => {
    setMensajeResultado(null);
    const primerReceta = recetas[0];
    setRecetaSeleccionadaId(primerReceta ? primerReceta.id : '');
    setTandas('1');
    setDescontarInsumos(true);
    setNotasProduccion('');
    // Buscar si hay producto vinculado a esta receta
    const prodVinculado = productos.find((p) => p.recetaId === (primerReceta ? primerReceta.id : ''));
    const primeraPresentacion = prodVinculado?.presentaciones?.[0];

    setSumarStockProdId(prodVinculado ? prodVinculado.id : '');
    setSumarStockPresId(primeraPresentacion ? primeraPresentacion.id : '');
    setIsHornearModalOpen(true);
  };

  const handleConfirmHornear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recetaSeleccionadaId) {
      alert('Selecciona una receta');
      return;
    }
    const tNum = parseFloat(tandas);
    if (isNaN(tNum) || tNum <= 0) {
      alert('Ingresa un número de tandas válido');
      return;
    }

    const res = ejecutarProduccion(
      recetaSeleccionadaId,
      tNum,
      descontarInsumos,
      sumarStockProdId || undefined,
      sumarStockPresId || undefined,
      notasProduccion
    );

    if (res.success) {
      setMensajeResultado({ tipo: 'success', texto: res.mensaje });
      setTimeout(() => {
        setIsHornearModalOpen(false);
        setMensajeResultado(null);
      }, 1500);
    } else {
      setMensajeResultado({
        tipo: 'error',
        texto: res.mensaje,
        faltantes: res.faltantes,
      });
    }
  };

  // Filtrado de insumos
  const insumosFiltrados = useMemo(() => {
    return insumos.filter((ins) => {
      if (filtroTipo === 'bajo') return ins.stockActual <= ins.stockMinimo;
      if (filtroTipo === 'ingrediente') return ins.tipo === 'ingrediente';
      if (filtroTipo === 'empaque') return ins.tipo === 'empaque' || ins.tipo === 'desechable';
      return true;
    });
  }, [insumos, filtroTipo]);

  const totalBajoStock = insumos.filter((i) => i.stockActual <= i.stockMinimo).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-500" />
            Inventario y Registro de Producción
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Hornea tandas, descuenta consumos de ingredientes y controla existencias
          </p>
        </div>

        <button
          onClick={handleOpenHornear}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Flame className="w-4 h-4" />
          <span>+ Hornear / Registrar Tanda</span>
        </button>
      </div>

      {/* Alerta de Stock Bajo */}
      {totalBajoStock > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                {totalBajoStock} insumo(s) requieren reabastecimiento pronto
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Filtra por "Stock Bajo" para verificar los ingredientes por agotarse antes de hornear.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFiltroTipo('bajo')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
          >
            Ver Insumos Bajos
          </button>
        </div>
      )}

      {/* Filtros de Pestañas */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setFiltroTipo('todos')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtroTipo === 'todos'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Todos ({insumos.length})
        </button>
        <button
          onClick={() => setFiltroTipo('ingrediente')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtroTipo === 'ingrediente'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Ingredientes
        </button>
        <button
          onClick={() => setFiltroTipo('empaque')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtroTipo === 'empaque'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Empaques y Cajas
        </button>
        <button
          onClick={() => setFiltroTipo('bajo')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filtroTipo === 'bajo'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          Stock Bajo ({totalBajoStock})
        </button>
      </div>

      {/* Tabla de Existencias de Insumos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Insumo</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Stock Disponible</th>
                <th className="py-3 px-4">Mínimo Requerido</th>
                <th className="py-3 px-4">Valor en Almacén</th>
                <th className="py-3 px-4 text-center">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {insumosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No hay insumos que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                insumosFiltrados.map((ins) => {
                  const esBajo = ins.stockActual <= ins.stockMinimo;
                  const valor = ins.stockActual * ins.costoPorUnidadUso;
                  return (
                    <tr
                      key={ins.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {ins.nombre}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {ins.marca || 'Genérico'} • {formatCostoUnitario(ins.costoPorUnidadUso)}/{ins.unidadUso}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ins.tipo}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              esBajo ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {ins.stockActual} {ins.unidadUso}
                          </span>
                          {esBajo && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                              Bajo Stock
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {ins.stockMinimo} {ins.unidadUso}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                        {formatMXN(valor)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            setInsumoAAjustar(ins);
                            setNuevoStock(String(ins.stockActual));
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Producciones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            Historial de Tandas Horneadas
          </h3>
          <span className="text-xs text-slate-400">{producciones.length} tandas elaboradas</span>
        </div>

        {producciones.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Aún no has registrado tandas de producción. Haz clic en "+ Hornear / Registrar Tanda".
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {producciones.map((prod) => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {prod.recetaNombre}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatFecha(prod.fecha, true)} • {prod.tandas} tanda(s) ={' '}
                    <strong>{prod.unidadesProducidas} unidades elaboradas</strong>
                    {prod.notas && ` • ${prod.notas}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatMXN(prod.costoTotalTanda)}
                  </span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                    {prod.descontoInventario ? '✓ Insumos descontados' : 'Sin descuento'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Hornear Tanda */}
      <Modal
        isOpen={isHornearModalOpen}
        onClose={() => setIsHornearModalOpen(false)}
        title="Registrar Tanda de Producción / Hornear"
        subtitle="Selecciona la receta y la cantidad de tandas que vas a elaborar"
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmHornear} className="space-y-4">
          {mensajeResultado && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold ${
                mensajeResultado.tipo === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300'
              }`}
            >
              {mensajeResultado.texto}
              {mensajeResultado.faltantes && (
                <ul className="mt-2 space-y-1 font-normal list-disc list-inside">
                  {mensajeResultado.faltantes.map((f, i) => (
                    <li key={i}>
                      <strong>{f.nombre}</strong>: requiere {f.requerido} {f.unidad}, disponible {f.disponible} {f.unidad}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Receta a Elaborar *
              </label>
              <select
                required
                value={recetaSeleccionadaId}
                onChange={(e) => {
                  const id = e.target.value;
                  setRecetaSeleccionadaId(id);
                  const prodVinculado = productos.find((p) => p.recetaId === id);
                  const primeraPresentacion = prodVinculado?.presentaciones?.[0];
                  setSumarStockProdId(prodVinculado ? prodVinculado.id : '');
                  setSumarStockPresId(primeraPresentacion ? primeraPresentacion.id : '');
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="">-- Selecciona una receta --</option>
                {recetas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} (Rinde: {r.rendimientoCantidad} {r.rendimientoUnidad})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Número de Tandas a Hornear *
              </label>
              <input
                type="number"
                step="any"
                min="0.5"
                required
                value={tandas}
                onChange={(e) => setTandas(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Resumen de Unidades Resultantes */}
          {recetaSeleccionada && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Resultado de la tanda:{' '}
                {recetaSeleccionada.rendimientoCantidad * (parseFloat(tandas) || 1)}{' '}
                {recetaSeleccionada.rendimientoUnidad}
              </span>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Costo estimado de la tanda:{' '}
                <strong>
                  {formatMXN(recetaSeleccionada.costoTotalReceta * (parseFloat(tandas) || 1))}
                </strong>
              </p>
            </div>
          )}

          {/* Sumar a presentación comercial de producto terminado listo */}
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sumar estas unidades al stock de una presentación comercial (Opcional):
            </label>
                  
            <select
              value={
                sumarStockProdId && sumarStockPresId
                  ? `${sumarStockProdId}::${sumarStockPresId}`
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value;
              
                if (!val) {
                  setSumarStockProdId('');
                  setSumarStockPresId('');
                  return;
                }
              
                const [pId, presId] = val.split('::');
                setSumarStockProdId(pId);
                setSumarStockPresId(presId);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">
                No sumar a presentación (solo registrar producción)
              </option>
            
              {productos
                .filter((p) => p.recetaId === recetaSeleccionadaId)
                .flatMap((p) =>
                  (p.presentaciones || []).map((pres) => (
                    <option
                      key={`${p.id}::${pres.id}`}
                      value={`${p.id}::${pres.id}`}
                    >
                      {p.nombre} — {pres.nombre} (Stock actual: {pres.stockListo || 0})
                    </option>
                  ))
                )}
            </select>
          </div>


          {/* Lista de Insumos que se consumirán */}
          {previewConsumos.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <input
                  type="checkbox"
                  checked={descontarInsumos}
                  onChange={(e) => setDescontarInsumos(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>Descontar automáticamente estos insumos del inventario:</span>
              </label>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs">
                {previewConsumos.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      item.suficiente
                        ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200'
                    }`}
                  >
                    <span>{item.nombre}</span>
                    <span className="font-medium">
                      -{item.consumo} {item.unidad}{' '}
                      <span className="text-[10px] text-slate-400">
                        (disp: {item.stockActual})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas de la Producción
            </label>
            <input
              type="text"
              placeholder="Ej. Tanda para pedidos de fin de semana..."
              value={notasProduccion}
              onChange={(e) => setNotasProduccion(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsHornearModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={descontarInsumos && hayFaltantes}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition ${
                descontarInsumos && hayFaltantes
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {descontarInsumos && hayFaltantes
                ? 'Stock Insuficiente'
                : 'Confirmar y Descontar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajuste Rápido */}
      {insumoAAjustar && (
        <Modal
          isOpen={!!insumoAAjustar}
          onClose={() => setInsumoAAjustar(null)}
          title={`Ajustar Stock: ${insumoAAjustar.nombre}`}
          subtitle={`Existencia actual: ${insumoAAjustar.stockActual} ${insumoAAjustar.unidadUso}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nuevo Stock Físico ({insumoAAjustar.unidadUso})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={nuevoStock}
                onChange={(e) => setNuevoStock(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInsumoAAjustar(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(nuevoStock);
                  if (!isNaN(val) && val >= 0) {
                    ajustarStockInsumo(insumoAAjustar.id, val);
                  }
                  setInsumoAAjustar(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
              >
                Guardar Ajuste
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
