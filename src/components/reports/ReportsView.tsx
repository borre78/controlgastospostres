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

  const [periodo, setPeriodo] = useState<PeriodoFiltro>('quincena');
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
      if (periodo === 'quincena') {
       const d = new Date();
       const anio = d.getFullYear();
       const mes = d.getMonth();
            
       const diaInicio = d.getDate() <= 15 ? 1 : 16;
       const diaFin =
         d.getDate() <= 15
           ? 15
           : new Date(anio, mes + 1, 0).getDate();
            
       const inicio = [
         anio,
         String(mes + 1).padStart(2, '0'),
         String(diaInicio).padStart(2, '0'),
       ].join('-');
     
       const fin = [
         anio,
         String(mes + 1).padStart(2, '0'),
         String(diaFin).padStart(2, '0'),
       ].join('-');
     
       return f >= inicio && f <= fin;
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
      if (periodo === 'quincena') {
        const d = new Date();
        const anio = d.getFullYear();
        const mes = d.getMonth();

        const diaInicio = d.getDate() <= 15 ? 1 : 16;
        const diaFin =
          d.getDate() <= 15
            ? 15
            : new Date(anio, mes + 1, 0).getDate();

        const inicio = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(diaInicio).padStart(2, '0')}`;
        const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(diaFin).padStart(2, '0')}`;

        return f >= inicio && f <= fin;
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

  
  // Comparación de gastos contra el periodo anterior
  
const comparacionGastos = useMemo(() => {
  const parseFecha = (fecha: string) => {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  };

  const formatearFecha = (fecha: Date) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const hoy = parseFecha(getFechaHoy());
  let inicioActual: Date;
  let finActual: Date;
  let inicioAnterior: Date;
  let finAnterior: Date;

  if (periodo === 'personalizado') {
    if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) {
      return null;
    }

    inicioActual = parseFecha(fechaInicio);
    finActual = parseFecha(fechaFin);

    const diasPeriodo =
      Math.round(
        (finActual.getTime() - inicioActual.getTime()) / 86400000
      ) + 1;

    finAnterior = new Date(inicioActual);
    finAnterior.setDate(finAnterior.getDate() - 1);

    inicioAnterior = new Date(finAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - diasPeriodo + 1);
  } else if (periodo === 'hoy') {
    inicioActual = new Date(hoy);
    finActual = new Date(hoy);

    inicioAnterior = new Date(hoy);
    inicioAnterior.setDate(inicioAnterior.getDate() - 1);
    finAnterior = new Date(inicioAnterior);
  } else if (periodo === 'semana') {
    const diaSemana = (hoy.getDay() + 6) % 7;

    inicioActual = new Date(hoy);
    inicioActual.setDate(hoy.getDate() - diaSemana);

    finActual = new Date(inicioActual);
    finActual.setDate(finActual.getDate() + 6);

    inicioAnterior = new Date(inicioActual);
    inicioAnterior.setDate(inicioAnterior.getDate() - 7);

    finAnterior = new Date(finActual);
    finAnterior.setDate(finAnterior.getDate() - 7);
  } else if (periodo === 'quincena') {
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();

    // Inicio y fin de la quincena actual
    if (dia <= 15) {
      inicioActual = new Date(anio, mes, 1);
      finActual = new Date(anio, mes, 15);

      // Quincena anterior: segunda mitad del mes pasado
      inicioAnterior = new Date(anio, mes - 1, 16);
      finAnterior = new Date(anio, mes, 0);
    } else {
      inicioActual = new Date(anio, mes, 16);
      finActual = new Date(anio, mes + 1, 0);

      // Quincena anterior: primera mitad del mes actual
      inicioAnterior = new Date(anio, mes, 1);
      finAnterior = new Date(anio, mes, 15);
    }
  } else if (periodo === 'mes') {
    inicioActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    finActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    inicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    finAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  } else if (periodo === 'anio') {
    inicioActual = new Date(hoy.getFullYear(), 0, 1);
    finActual = new Date(hoy.getFullYear(), 11, 31);

    inicioAnterior = new Date(hoy.getFullYear() - 1, 0, 1);
    finAnterior = new Date(hoy.getFullYear() - 1, 11, 31);
  } else {
    return null;
  }

  const sumarGastos = (inicio: Date, fin: Date) => {
    const desde = formatearFecha(inicio);
    const hasta = formatearFecha(fin);

    return gastos
      .filter((g) => g.fecha >= desde && g.fecha <= hasta)
      .reduce((total, g) => total + g.importe, 0);
  };

  const totalActual = sumarGastos(inicioActual, finActual);
  const totalAnterior = sumarGastos(inicioAnterior, finAnterior);
  const diferencia = totalActual - totalAnterior;

  const variacionPorcentaje =
    totalAnterior > 0
      ? (diferencia / totalAnterior) * 100
      : null;

  return {
    inicioActual: formatearFecha(inicioActual),
    finActual: formatearFecha(finActual),
    inicioAnterior: formatearFecha(inicioAnterior),
    finAnterior: formatearFecha(finAnterior),
    totalActual,
    totalAnterior,
    diferencia,
    variacionPorcentaje,
  };
}, [gastos, periodo, fechaInicio, fechaFin]);


  // Comparación de ventas y utilidad entre periodos
  const comparacionFinanciera = useMemo(() => {
    if (!comparacionGastos) return null;

    const {
      inicioActual,
      finActual,
      inicioAnterior,
      finAnterior,
    } = comparacionGastos;

    const ventasDelPeriodo = (desde: string, hasta: string) =>
      ventas.filter(
        (v) => v.fecha >= desde && v.fecha <= hasta
      );

    const gastosDelPeriodo = (desde: string, hasta: string) =>
      gastos.filter(
        (g) =>
          g.fecha >= desde &&
          g.fecha <= hasta &&
          g.ambito === 'negocio'
      );

    const calcularIndicadores = (desde: string, hasta: string) => {
      const ventasPeriodo = ventasDelPeriodo(desde, hasta);
      const gastosPeriodo = gastosDelPeriodo(desde, hasta);

      const ingresos = ventasPeriodo.reduce(
        (total, v) => total + v.totalVenta,
        0
      );

      const costoVendido = ventasPeriodo.reduce(
        (total, v) => total + v.costoTotalVendido,
        0
      );

      const utilidadBrutaPeriodo = ingresos - costoVendido;

      const gastosOperativos = gastosPeriodo
        .filter(
          (g) => g.tipoGastoNegocio !== 'inventario_materia_prima'
        )
        .reduce((total, g) => total + g.importe, 0);

      return {
        ingresos,
        costoVendido,
        utilidadBruta: utilidadBrutaPeriodo,
        gastosOperativos,
        utilidadOperativa: utilidadBrutaPeriodo - gastosOperativos,
      };
    };

    const actual = calcularIndicadores(inicioActual, finActual);
    const anterior = calcularIndicadores(inicioAnterior, finAnterior);

    const calcularVariacion = (actual: number, anterior: number) => ({
      diferencia: actual - anterior,
      porcentaje:
        anterior > 0
          ? ((actual - anterior) / anterior) * 100
          : null,
    });

    return {
      actual,
      anterior,
      ventas: calcularVariacion(actual.ingresos, anterior.ingresos),
      utilidad: calcularVariacion(
        actual.utilidadOperativa,
        anterior.utilidadOperativa
      ),
    };
  }, [ventas, gastos, comparacionGastos]);




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

  // Obteenr Dias Periodo
  const obtenerDescripcionPeriodo = () => {
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);

    const formatoFecha = (fecha: Date) =>
      fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    let inicio = new Date(hoy);
    let fin = new Date(hoy);

    switch (periodo) {
      case 'hoy':
        return `Hoy es ${hoy.toLocaleDateString('es-MX', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`;

      case 'semana': {
        const diaSemana = (hoy.getDay() + 6) % 7;

        inicio.setDate(hoy.getDate() - diaSemana);
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        break;
      }

      case 'quincena':
        if (hoy.getDate() <= 15) {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
        } else {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
          fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
        break;

      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;

      case 'anio':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
        break;

      case 'todo':
        return 'Mostrando todos los registros';

      case 'personalizado':
        return 'Consulta del periodo de fechas personalizado';
    }

    return `Del ${formatoFecha(inicio)} al ${formatoFecha(fin)}`;
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
              { id: 'quincena', label: 'Quincena' },
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


      <p className="mt-2 text-s text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {obtenerDescripcionPeriodo()}
        </span>
      </p>

      
      {/* COMPARACIÓN DE GASTOS */}
      {comparacionGastos && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Comparación de gastos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Compara tus gastos con el periodo anterior de la misma duración.
            </p>
          </div>
      
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Gasto actual */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Gastos del periodo actual
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
                {formatMXN(comparacionGastos.totalActual)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {formatFecha(comparacionGastos.inicioActual, true)} –{' '}
                {formatFecha(comparacionGastos.finActual, true)}
              </p>
            </div>
      
            {/* Gasto anterior */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Gastos del periodo anterior
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
                {formatMXN(comparacionGastos.totalAnterior)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {formatFecha(comparacionGastos.inicioAnterior, true)} –{' '}
                {formatFecha(comparacionGastos.finAnterior, true)}
              </p>
            </div>
      
            {/* Diferencia en pesos */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Diferencia en pesos
              </p>
              <p
                className={`text-xl font-black mt-2 ${
                  comparacionGastos.diferencia > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : comparacionGastos.diferencia < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                }`}
              >
                {comparacionGastos.diferencia > 0 ? '+' : ''}
                {formatMXN(comparacionGastos.diferencia)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {comparacionGastos.diferencia > 0
                  ? 'Gastaste más que en el periodo anterior'
                  : comparacionGastos.diferencia < 0
                    ? 'Gastaste menos que en el periodo anterior'
                    : 'El gasto fue igual en ambos periodos'}
              </p>
            </div>
                
            {/* Variación porcentual */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Variación porcentual
              </p>
              <div className="flex items-center gap-2 mt-2">
                {comparacionGastos.variacionPorcentaje !== null &&
                  (comparacionGastos.variacionPorcentaje > 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-rose-500" />
                  ) : comparacionGastos.variacionPorcentaje < 0 ? (
                    <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                  ) : null)}
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {comparacionGastos.variacionPorcentaje === null
                    ? 'N/D'
                    : `${comparacionGastos.variacionPorcentaje > 0 ? '+' : ''}${comparacionGastos.variacionPorcentaje.toFixed(1)}%`}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {comparacionGastos.variacionPorcentaje === null
                  ? 'No hay gastos anteriores para calcular el porcentaje'
                  : comparacionGastos.variacionPorcentaje > 0
                    ? 'Aumento del gasto'
                    : comparacionGastos.variacionPorcentaje < 0
                      ? 'Reducción del gasto'
                      : 'Sin variación'}
              </p>
            </div>
          </div>
        </div>
      )}

      
      {/* COMPARACIÓN DE VENTAS Y UTILIDAD */}
      {comparacionFinanciera && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Comparación de ventas y utilidad
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Resultados del periodo actual frente al periodo anterior.
            </p>
          </div>
      
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Ventas actuales */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ventas actuales
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
                {formatMXN(comparacionFinanciera.actual.ingresos)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Periodo seleccionado
              </p>
            </div>
      
            {/* Ventas anteriores */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ventas del periodo anterior
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
                {formatMXN(comparacionFinanciera.anterior.ingresos)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-2">
                Periodo de comparación
              </p>
            </div>
      
            {/* Variación de ventas */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Variación de ventas
              </p>
              <p className={`text-xl font-black mt-2 ${
                comparacionFinanciera.ventas.diferencia > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : comparacionFinanciera.ventas.diferencia < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
              }`}>
                {comparacionFinanciera.ventas.diferencia > 0 ? '+' : ''}
                {formatMXN(comparacionFinanciera.ventas.diferencia)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {comparacionFinanciera.ventas.porcentaje === null
                  ? 'Sin base anterior para calcular porcentaje'
                  : `${comparacionFinanciera.ventas.porcentaje > 0 ? '+' : ''}${comparacionFinanciera.ventas.porcentaje.toFixed(1)}% respecto al periodo anterior`}
              </p>
            </div>
                
            {/* Utilidad operativa */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Utilidad operativa actual
              </p>
              <p className={`text-xl font-black mt-2 ${
                comparacionFinanciera.actual.utilidadOperativa >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatMXN(comparacionFinanciera.actual.utilidadOperativa)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Anterior: {formatMXN(comparacionFinanciera.anterior.utilidadOperativa)}
              </p>
              <p className={`text-[11px] font-semibold mt-1 ${
                comparacionFinanciera.utilidad.diferencia > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : comparacionFinanciera.utilidad.diferencia < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400'
              }`}>
                Diferencia: {comparacionFinanciera.utilidad.diferencia > 0 ? '+' : ''}
                {formatMXN(comparacionFinanciera.utilidad.diferencia)}
                {comparacionFinanciera.utilidad.porcentaje !== null
                  ? ` (${comparacionFinanciera.utilidad.porcentaje > 0 ? '+' : ''}${comparacionFinanciera.utilidad.porcentaje.toFixed(1)}%)`
                  : ''}
              </p>
            </div>
          </div>
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
