import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Receipt,
  Scale,
  Calendar,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Layers,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatMXN, formatPorcentaje, formatFecha, getFechaHoy } from '../../utils/formatters';
import { PeriodoFiltro, TipoAmbito } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenNewGasto?: () => void;
  onOpenNewVenta?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    ventas,
    gastos,
    productos,
    insumos,
    recalcularTodasLasRecetas,
    reiniciarDatos,
    limpiarSoloEjemplosDemostracion,
    cargarDatosEjemplo,
  } = useApp();

  // Estados de filtro
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Primer día del mes
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState<string>(getFechaHoy);
  const [filtroAmbito, setFiltroAmbito] = useState<TipoAmbito | 'ambos'>('ambos');

  // Filtrado de ventas por fecha
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const fechaVenta = v.fecha;
      if (periodo === 'todo') return true;

      const hoy = getFechaHoy();
      if (periodo === 'hoy') return fechaVenta === hoy;

      if (periodo === 'semana') {
        const d = new Date();
        const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1); // Lunes
        const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
        return fechaVenta >= lunes && fechaVenta <= hoy;
      }

      if (periodo === 'mes') {
        const d = new Date();
        const mesActual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return fechaVenta.startsWith(mesActual);
      }

      if (periodo === 'anio') {
        const anio = String(new Date().getFullYear());
        return fechaVenta.startsWith(anio);
      }

      if (periodo === 'personalizado') {
        return (!fechaInicio || fechaVenta >= fechaInicio) && (!fechaFin || fechaVenta <= fechaFin);
      }

      return true;
    });
  }, [ventas, periodo, fechaInicio, fechaFin]);

  // Filtrado de gastos por fecha y ámbito
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      // Filtro ámbito
      if (filtroAmbito !== 'ambos' && g.ambito !== filtroAmbito) {
        return false;
      }

      const fechaGasto = g.fecha;
      if (periodo === 'todo') return true;

      const hoy = getFechaHoy();
      if (periodo === 'hoy') return fechaGasto === hoy;

      if (periodo === 'semana') {
        const d = new Date();
        const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
        const lunes = new Date(d.setDate(diff)).toISOString().split('T')[0];
        return fechaGasto >= lunes && fechaGasto <= hoy;
      }

      if (periodo === 'mes') {
        const d = new Date();
        const mesActual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return fechaGasto.startsWith(mesActual);
      }

      if (periodo === 'anio') {
        const anio = String(new Date().getFullYear());
        return fechaGasto.startsWith(anio);
      }

      if (periodo === 'personalizado') {
        return (!fechaInicio || fechaGasto >= fechaInicio) && (!fechaFin || fechaGasto <= fechaFin);
      }

      return true;
    });
  }, [gastos, periodo, fechaInicio, fechaFin, filtroAmbito]);

  // Cálculos Financieros del Negocio
  const totalVentasRegistradas = ventasFiltradas.reduce((sum, v) => sum + v.totalVenta, 0);
  const totalVentasCobradas = ventasFiltradas
    .filter((v) => v.estadoCobro === 'cobrada')
    .reduce((sum, v) => sum + v.totalVenta, 0);
  const totalVentasPendientes = ventasFiltradas
    .filter((v) => v.estadoCobro === 'pendiente')
    .reduce((sum, v) => sum + v.totalVenta, 0);

  // Costo de Ventas (COGS) de los postres que se vendieron
  const costoTotalProductosVendidos = ventasFiltradas.reduce(
    (sum, v) => sum + (v.costoTotalVendido || 0),
    0
  );

  // Utilidad Bruta del Negocio = Ventas totales - Costo de los postres vendidos
  const utilidadBrutaNegocio = totalVentasRegistradas - costoTotalProductosVendidos;

  // Gastos clasificados
  const gastosNegocio = gastosFiltrados.filter((g) => g.ambito === 'negocio');
  const gastosPersonales = gastosFiltrados.filter((g) => g.ambito === 'personal');

  // Gastos operativos fijos del negocio (Luz, gas no asignado, renta de local, publicidad, transporte)
  // Excluyendo compras de materia prima/inventario para evitar la doble contabilización con el costo del producto vendido
  const gastosOperativosNegocio = gastosNegocio
    .filter((g) => g.tipoGastoNegocio !== 'inventario_materia_prima')
    .reduce((sum, g) => sum + g.importe, 0);

  const comprasInsumosInventario = gastosNegocio
    .filter((g) => g.tipoGastoNegocio === 'inventario_materia_prima')
    .reduce((sum, g) => sum + g.importe, 0);

  const totalGastosNegocioEfectivo = gastosNegocio.reduce((sum, g) => sum + g.importe, 0);
  const totalGastosPersonalesEfectivo = gastosPersonales.reduce((sum, g) => sum + g.importe, 0);
  const totalGastosGlobalEfectivo = totalGastosNegocioEfectivo + totalGastosPersonalesEfectivo;

  // Utilidad Operativa Real del Negocio (Estado de Resultados):
  // Ingresos - Costo de postres vendidos - Gastos operativos
  const utilidadOperativaNegocio = utilidadBrutaNegocio - gastosOperativosNegocio;

  // Flujo de Caja Real (Dinero en efectivo que entró menos dinero que salió):
  const saldoFlujoCajaNegocio = totalVentasCobradas - totalGastosNegocioEfectivo;
  const saldoFlujoCajaTotal = totalVentasCobradas - totalGastosGlobalEfectivo;

  // Alertas de inventario
  const insumosBajoStock = insumos.filter((i) => i.stockActual <= i.stockMinimo);

  return (
    <div className="space-y-6">
      {/* Barra Superior con Filtros y Bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel Financiero
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas precisas de tu negocio repostero y finanzas personales
          </p>
        </div>

        {/* Selector de Periodo */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(
              [
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Semana' },
                { id: 'mes', label: 'Este Mes' },
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

          {/* Selector de Ámbito */}
          <select
            value={filtroAmbito}
            onChange={(e) => setFiltroAmbito(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ambos">Negocio + Personal</option>
            <option value="negocio">Solo Negocio de Postres</option>
            <option value="personal">Solo Gastos Personales</option>
          </select>
        </div>
      </div>

      {/* Rango de fechas personalizado si está activo */}
      {periodo === 'personalizado' && (
        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-amber-900 dark:text-amber-200">Rango personalizado:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-600 dark:text-slate-300">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-600 dark:text-slate-300">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      )}

      {/* Banner Informativo de Demostración vs Datos Reales */}
      {productos.some((p) => p.esDemostracion) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-black bg-amber-500 text-white text-[10px] tracking-wide uppercase">
                Modo Demostración Activo
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                Ejemplos didácticos cargados (Pay de Queso y Arroz con Leche)
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Los valores que ves corresponden a los ejemplos solicitados para verificar los cálculos de múltiples presentaciones (Pay completo $180 / Rebanada $40; Arroz con Leche 500 ml / Vaso 6 oz). Cuando desees empezar con tus datos propios, puedes limpiar todos los registros.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('products')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs transition text-xs whitespace-nowrap"
            >
              Ver Presentaciones
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Deseas retirar los ejemplos de demostración? Todos tus productos, recetas, insumos y gastos reales se conservarán intactos.')) {
                  limpiarSoloEjemplosDemostracion();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold transition text-xs whitespace-nowrap"
            >
              Limpiar Ejemplos (Conservar Datos Reales)
            </button>
          </div>
        </div>
      )}

      {/* TARJETAS PRINCIPALES DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ingresos por Ventas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ventas Totales
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatMXN(totalVentasRegistradas)}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Cobradas: {formatMXN(totalVentasCobradas)}
              </span>
              {totalVentasPendientes > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Por cobrar: {formatMXN(totalVentasPendientes)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Costo de Ventas (COGS de los postres vendidos) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Costo de Postres Vendidos
              </span>
              <p className="text-[10px] text-slate-400">Insumos + Empaques usados</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatMXN(costoTotalProductosVendidos)}
            </p>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>Margen Bruto:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {totalVentasRegistradas > 0
                  ? formatPorcentaje((utilidadBrutaNegocio / totalVentasRegistradas) * 100)
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Utilidad Operativa del Negocio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Utilidad Real Negocio
              </span>
              <p className="text-[10px] text-slate-400">Ventas - Costos - Operación</p>
            </div>
            <div
              className={`p-2 rounded-xl ${
                utilidadOperativaNegocio >= 0
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl sm:text-3xl font-black ${
                utilidadOperativaNegocio >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatMXN(utilidadOperativaNegocio)}
            </p>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>Gastos fijos op:</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {formatMXN(gastosOperativosNegocio)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Flujo de Caja Real (Saldo en mano) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Saldo / Flujo de Caja
              </span>
              <p className="text-[10px] text-slate-400">Cobrado menos Pagado real</p>
            </div>
            <div
              className={`p-2 rounded-xl ${
                saldoFlujoCajaNegocio >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl sm:text-3xl font-black ${
                saldoFlujoCajaNegocio >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatMXN(saldoFlujoCajaNegocio)}
            </p>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>Con gastos personales:</span>
              <span className="font-medium">{formatMXN(saldoFlujoCajaTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CLARIDAD FINANCIERA: PANEL EDUCATIVO DE SEPARACIÓN DE COSTOS */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 p-5 rounded-2xl border border-amber-300/60 dark:border-amber-800/60 text-slate-800 dark:text-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Principio Contable Antidoble Contabilización
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100">
                Cálculos Verificados
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              En este sistema, una compra de bulto de harina o queso de $500 se registra como{' '}
              <strong>Salida de Efectivo para Inventario</strong>. Cuando preparas y vendes tus postres,{' '}
              <strong>no se vuelve a restar como gasto doble</strong>: la utilidad real descuenta solo la porción de insumos consumida en los postres efectivamente vendidos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Compras a Inventario (Salidas):
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatMXN(comprasInsumosInventario)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Gastos Fijos del Negocio:
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatMXN(gastosOperativosNegocio)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Gastos Personales (Separados):
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatMXN(totalGastosPersonalesEfectivo)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('sales')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>+ Registrar Venta</span>
        </button>

        <button
          onClick={() => onNavigate('expenses')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <Receipt className="w-4 h-4" />
          <span>+ Registrar Gasto</span>
        </button>

        <button
          onClick={() => onNavigate('recipes')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Costear Receta</span>
        </button>

        <button
          onClick={() => onNavigate('inventory')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <Clock className="w-4 h-4" />
          <span>Hornear Tanda</span>
        </button>
      </div>

      {/* ALERTAS Y ESTADO RÁPIDO */}
      {insumosBajoStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                Alerta: {insumosBajoStock.length} insumo(s) con existencias mínimas o agotados
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                {insumosBajoStock.map((i) => i.nombre).slice(0, 3).join(', ')}
                {insumosBajoStock.length > 3 && ` y ${insumosBajoStock.length - 3} más`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('ingredients')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
          >
            Ver Catálogo
          </button>
        </div>
      )}

      {/* TABLAS RESUMEN DE ACTIVIDAD RECIENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Ventas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Últimas Ventas
              </h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Ver todas ({ventas.length})
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {ventas.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay ventas registradas aún. Haz clic en "+ Registrar Venta".
              </div>
            ) : (
              ventas.slice(0, 5).map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {v.cantidad}x {v.productoNombre}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatFecha(v.fecha, true)} • {v.cliente || 'Venta general'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatMXN(v.totalVenta)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        v.estadoCobro === 'cobrada'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {v.estadoCobro === 'cobrada' ? 'Cobrada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimos Gastos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Últimos Gastos y Desembolsos
              </h3>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Ver todos ({gastos.length})
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {gastos.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay gastos registrados aún. Haz clic en "+ Registrar Gasto".
              </div>
            ) : (
              gastos.slice(0, 5).map((g) => (
                <div key={g.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {g.descripcion}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatFecha(g.fecha, true)} • {g.categoriaNombre}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400">
                      -{formatMXN(g.importe)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        g.ambito === 'negocio'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {g.ambito === 'negocio' ? 'Negocio' : 'Personal'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
