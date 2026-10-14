import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  PieChart,
  Scale,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatMXN,
  formatPorcentaje,
  formatFecha,
  getFechaHoy,
  exportarACSV,
} from '../../utils/formatters';
import { PeriodoFiltro } from '../../types';

export const ReportsView: React.FC = () => {
  const { ventas, gastos, productos, insumos, recetas, categorias } = useApp();

  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState<string>(getFechaHoy);

  // Filtrado de Ventas
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const f = v.fecha;
      if (periodo === 'todo') return true;
      const hoy = getFechaHoy();
      if (periodo === 'hoy') return f === hoy;
      if (periodo === 'semana') {
        const d = new Date();
        const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
        const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
        return f >= lunes && f <= hoy;
      }
      if (periodo === 'mes') {
        const d = new Date();
        const mesActual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return f.startsWith(mesActual);
      }
      if (periodo === 'anio') {
        return f.startsWith(String(new Date().getFullYear()));
      }
      if (periodo === 'personalizado') {
        return (!fechaInicio || f >= fechaInicio) && (!fechaFin || f <= fechaFin);
      }
      return true;
    });
  }, [ventas, periodo, fechaInicio, fechaFin]);

  // Filtrado de Gastos
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const f = g.fecha;
      if (periodo === 'todo') return true;
      const hoy = getFechaHoy();
      if (periodo === 'hoy') return f === hoy;
      if (periodo === 'semana') {
        const d = new Date();
        const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
        const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
        return f >= lunes && f <= hoy;
      }
      if (periodo === 'mes') {
        const d = new Date();
        const mesActual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return f.startsWith(mesActual);
      }
      if (periodo === 'anio') {
        return f.startsWith(String(new Date().getFullYear()));
      }
      if (periodo === 'personalizado') {
        return (!fechaInicio || f >= fechaInicio) && (!fechaFin || f <= fechaFin);
      }
      return true;
    });
  }, [gastos, periodo, fechaInicio, fechaFin]);

  // Totales
  const totalVentas = ventasFiltradas.reduce((s, v) => s + v.totalVenta, 0);
  const totalCostoVendido = ventasFiltradas.reduce((s, v) => s + v.costoTotalVendido, 0);
  const utilidadBruta = totalVentas - totalCostoVendido;

  const gastosNegocio = gastosFiltrados.filter((g) => g.ambito === 'negocio');
  const gastosPersonales = gastosFiltrados.filter((g) => g.ambito === 'personal');

  // Gastos fijos operativos del negocio (no compras de inventario)
  const gastosOperativosNegocio = gastosNegocio
    .filter((g) => g.tipoGastoNegocio !== 'inventario_materia_prima')
    .reduce((s, g) => s + g.importe, 0);

  const comprasInventario = gastosNegocio
    .filter((g) => g.tipoGastoNegocio === 'inventario_materia_prima')
    .reduce((s, g) => s + g.importe, 0);

  const utilidadOperativa = utilidadBruta - gastosOperativosNegocio;

  const totalGastosNegocioEfectivo = gastosNegocio.reduce((s, g) => s + g.importe, 0);
  const totalGastosPersonalEfectivo = gastosPersonales.reduce((s, g) => s + g.importe, 0);

  // Desglose de Gastos por Categoría
  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; ambito: string; color: string }>();

    categorias.forEach((c) => {
      map.set(c.id, { nombre: c.nombre, total: 0, ambito: c.ambito, color: c.color });
    });

    gastosFiltrados.forEach((g) => {
      const entry = map.get(g.categoriaId);
      if (entry) {
        entry.total += g.importe;
      } else {
        map.set(g.categoriaId, {
          nombre: g.categoriaNombre,
          total: g.importe,
          ambito: g.ambito,
          color: '#f97316',
        });
      }
    });

    return Array.from(map.values())
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [gastosFiltrados, categorias]);

  const granTotalGastosPeriodo = gastosPorCategoria.reduce((s, c) => s + c.total, 0);

    // Ventas y rentabilidad agrupadas por Presentación Comercial
    const rankingPresentaciones = useMemo(() => {
      const map = new Map<
        string,
        {
          productoNombre: string;
          presentacionNombre: string;
          unidadesVendidas: number;
          ingresosTotales: number;
          costoTotal: number;
          utilidadTotal: number;
        }
      >();

      ventasFiltradas.forEach((v) => {
        const presKey = `${v.productoId}_${v.presentacionId || 'unica'}`;
        const existing = map.get(presKey) || {
          productoNombre: v.productoNombre,
          presentacionNombre: v.presentacionNombre || 'Presentación Única',
          unidadesVendidas: 0,
          ingresosTotales: 0,
          costoTotal: 0,
          utilidadTotal: 0,
        };

        existing.unidadesVendidas += v.cantidad;
        existing.ingresosTotales += v.totalVenta;
        existing.costoTotal += v.costoTotalVendido;
        existing.utilidadTotal += v.utilidadEstimada;

        map.set(presKey, existing);
      });

      return Array.from(map.values()).sort((a, b) => b.utilidadTotal - a.utilidadTotal);
    }, [ventasFiltradas]);

    // Funciones de Exportación a CSV
    const handleExportarGastos = () => {
      const headers = [
        'Fecha',
        'Descripcion',
        'Ambito',
        'Tipo de Gasto',
        'Categoria',
        'Forma de Pago',
        'Importe MXN',
        'Notas',
      ];
      const filas = gastosFiltrados.map((g) => [
        g.fecha,
        g.descripcion,
        g.ambito,
        g.tipoGastoNegocio || 'N/A',
        g.categoriaNombre,
        g.formaPago,
        g.importe,
        g.notas || '',
      ]);
      exportarACSV(`gastos_${periodo}_${getFechaHoy()}`, headers, filas);
    };

    const handleExportarVentas = () => {
      const headers = [
        'Fecha',
        'Producto',
        'Presentacion',
        'Cantidad',
        'Precio Unitario MXN',
        'Descuento MXN',
        'Total Venta MXN',
        'Costo Postre MXN',
        'Utilidad Estimada MXN',
        'Estado',
        'Forma de Pago',
        'Cliente',
        'Notas',
      ];
      const filas = ventasFiltradas.map((v) => [
        v.fecha,
        v.productoNombre,
        v.presentacionNombre || 'Estándar',
        v.cantidad,
        v.precioUnitario,
        v.descuento,
        v.totalVenta,
        v.costoTotalVendido,
        v.utilidadEstimada,
        v.estadoCobro,
        v.formaPago || 'N/A',
        v.cliente || '',
        v.notas || '',
      ]);
    exportarACSV(`ventas_${periodo}_${getFechaHoy()}`, headers, filas);
  };

  const handleExportarInsumos = () => {
    const headers = [
      'Nombre',
      'Marca',
      'Tipo',
      'Unidad Compra',
      'Cantidad Compra',
      'Precio Compra MXN',
      'Unidad Uso',
      'Costo por Unidad de Receta MXN',
      'Stock Actual',
      'Stock Minimo',
      'Proveedor',
    ];
    const filas = insumos.map((i) => [
      i.nombre,
      i.marca || '',
      i.tipo,
      i.unidadCompra,
      i.cantidadCompra,
      i.precioCompra,
      i.unidadUso,
      i.costoPorUnidadUso.toFixed(4),
      i.stockActual,
      i.stockMinimo,
      i.proveedor || '',
    ]);
    exportarACSV(`catalogo_insumos_${getFechaHoy()}`, headers, filas);
  };

  return (
    <div className="space-y-6">
      {/* Header y Filtro de Periodo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Reportes Financieros y Rentabilidad
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Estado de resultados, gastos por categoría y postres más rentables
          </p>
        </div>

        {/* Periodo Buttons */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(
            [
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Semana' },
              { id: 'mes', label: 'Mes' },
              { id: 'anio', label: 'Año' },
              { id: 'todo', label: 'Todo' },
              { id: 'personalizado', label: 'Fechas' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodo(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                periodo === item.id
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rango de fechas si es personalizado */}
      {periodo === 'personalizado' && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-amber-900 dark:text-amber-200">Desde:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <span className="font-semibold text-amber-900 dark:text-amber-200">Hasta:</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      )}

      {/* ESTADO DE RESULTADOS EJECUTIVO (P&L) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              Estado de Resultados del Negocio de Postres
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cálculo contable transparente para el periodo seleccionado
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            MXN
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* 1. Ingresos por Ventas */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              (+) Ingresos por Ventas de Postres:
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {formatMXN(totalVentas)}
            </span>
          </div>

          {/* 2. Costo de Ventas */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                (-) Costo de Productos Vendidos (COGS):
              </span>
              <p className="text-[10px] text-slate-400">
                Insumos, empaques directos y gas consumidos en los postres vendidos
              </p>
            </div>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400">
              -{formatMXN(totalCostoVendido)}
            </span>
          </div>

          {/* 3. Utilidad Bruta */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 font-bold">
            <span className="text-emerald-900 dark:text-emerald-200">
              (=) Utilidad Bruta del Negocio:
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatMXN(utilidadBruta)}
            </span>
          </div>

          {/* 4. Gastos Operativos Fijos */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                (-) Gastos Operativos del Taller:
              </span>
              <p className="text-[10px] text-slate-400">
                Publicidad, transporte, recargas fijas no asignadas a receta
              </p>
            </div>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400">
              -{formatMXN(gastosOperativosNegocio)}
            </span>
          </div>

          {/* 5. Utilidad Operativa Neta */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 font-extrabold text-sm sm:text-base">
            <div>
              <span className="text-amber-900 dark:text-amber-200">
                (=) Utilidad Operativa Real del Negocio:
              </span>
              <p className="text-[11px] font-normal text-amber-800/80 dark:text-amber-300/80">
                Lo que generó tu repostería después de cubrir costos y gastos fijos
              </p>
            </div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatMXN(utilidadOperativa)}
            </span>
          </div>

          {/* Comparativo con Gastos Personales */}
          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                Gastos Personales del Periodo (Separados):
              </span>
              <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80">
                Despensa familiar, casa, salud (no restados de la utilidad del taller)
              </p>
            </div>
            <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
              {formatMXN(totalGastosPersonalEfectivo)}
            </span>
          </div>
        </div>
      </div>

      {/* GRÁFICAS Y DESGLOSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoría */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              Gastos por Categoría
            </h3>
            <span className="text-xs text-slate-400">{formatMXN(granTotalGastosPeriodo)}</span>
          </div>

          {gastosPorCategoria.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No hay gastos en el periodo seleccionado.
            </p>
          ) : (
            <div className="space-y-3">
              {gastosPorCategoria.map((cat, idx) => {
                const pct =
                  granTotalGastosPeriodo > 0 ? (cat.total / granTotalGastosPeriodo) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {cat.nombre}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({cat.ambito === 'negocio' ? 'Negocio' : 'Personal'})
                        </span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMXN(cat.total)}{' '}
                        <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>

                    {/* Barra de progreso visual */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color || '#f97316',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ranking de Presentaciones Comerciales Más Rentables */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Rentabilidad por Presentación Comercial
              </h3>
              <p className="text-[11px] text-slate-400">
                Unidades, ingresos y utilidad neta por tamaño o porción
              </p>
            </div>
            <span className="text-xs text-slate-400">Mayor utilidad generada</span>
          </div>

          {rankingPresentaciones.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No hay ventas registradas en este periodo.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rankingPresentaciones.map((p, idx) => {
                const margen = p.ingresosTotales > 0 ? (p.utilidadTotal / p.ingresosTotales) * 100 : 0;
                return (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">{p.productoNombre}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                            {p.presentacionNombre}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.unidadesVendidas} unidades • Ventas: {formatMXN(p.ingresosTotales)} • Costos: {formatMXN(p.costoTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        +{formatMXN(p.utilidadTotal)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {formatPorcentaje(margen)} margen
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* EXPORTACIÓN A CSV */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          Exportar Datos a Formato Excel / CSV
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Descarga tus registros organizados con codificación compatible con Excel en español (acentos y signos de pesos).
        </p>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={handleExportarGastos}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            <span>Exportar Gastos (CSV)</span>
          </button>

          <button
            onClick={handleExportarVentas}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exportar Ventas (CSV)</span>
          </button>

          <button
            onClick={handleExportarInsumos}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Exportar Catálogo de Insumos (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
