import { UnidadMedida } from '../types';

/**
 * Formateador de moneda oficial para Pesos Mexicanos (MXN)
 */
export const formatMXN = (amount: number, includeCode = false): string => {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  return includeCode ? `${formatted} MXN` : formatted;
};

/**
 * Formato para costos unitarios de precisión (ej. $/gramo o $/ml)
 */
export const formatCostoUnitario = (amount: number): string => {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  if (safeAmount === 0) return '$0.00';
  if (safeAmount < 0.01) {
    return `$${safeAmount.toFixed(4)}`;
  }
  if (safeAmount < 1) {
    return `$${safeAmount.toFixed(3)}`;
  }
  return formatMXN(safeAmount);
};

/**
 * Formato de porcentaje
 */
export const formatPorcentaje = (percentage: number): string => {
  const safePct = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
  return `${safePct.toFixed(1)}%`;
};

/**
 * Conversión de cantidad de compra a unidad de uso (gramos, ml, o piezas)
 */
export const convertirAUnidadUso = (
  cantidadCompra: number,
  unidadCompra: UnidadMedida,
  piezasPorPaquete = 1
): { cantidadEnUnidadUso: number; unidadUso: 'g' | 'ml' | 'pieza' } => {
  const cantidad = Math.max(0, cantidadCompra);

  switch (unidadCompra) {
    case 'kg':
      return { cantidadEnUnidadUso: cantidad * 1000, unidadUso: 'g' };
    case 'g':
      return { cantidadEnUnidadUso: cantidad, unidadUso: 'g' };
    case 'litro':
      return { cantidadEnUnidadUso: cantidad * 1000, unidadUso: 'ml' };
    case 'ml':
      return { cantidadEnUnidadUso: cantidad, unidadUso: 'ml' };
    case 'pieza':
      return { cantidadEnUnidadUso: cantidad, unidadUso: 'pieza' };
    case 'paquete':
      return {
        cantidadEnUnidadUso: cantidad * Math.max(1, piezasPorPaquete),
        unidadUso: 'pieza',
      };
    default:
      return { cantidadEnUnidadUso: cantidad, unidadUso: 'pieza' };
  }
};

export const calcularCostoPorUnidadUso = (
  precioCompra: number,
  cantidadCompra: number,
  unidadCompra: UnidadMedida,
  piezasPorPaquete = 1
): {
  costoPorUnidadUso: number;
  unidadUso: 'g' | 'ml' | 'pieza';
  cantidadTotal: number;
} => {
  const { cantidadEnUnidadUso, unidadUso } = convertirAUnidadUso(
    cantidadCompra,
    unidadCompra,
    piezasPorPaquete
  );

  const costo =
    cantidadEnUnidadUso > 0 ? precioCompra / cantidadEnUnidadUso : 0;

  return {
    costoPorUnidadUso: costo,
    unidadUso,
    cantidadTotal: cantidadEnUnidadUso,
  };
};

/**
 * Conversión de onzas líquidas americanas (fl oz) a mililitros (ml)
 * 1 fl oz = 29.5735 ml (aprox 177.4 ml para 6 oz)
 */
export const convertirFlOzAMl = (flOz: number): number => {
  return Math.round(flOz * 29.5735 * 10) / 10;
};

/**
 * Calcula el factor de receta (proporción matemática exacta) de una presentación
 * respecto a la tanda total de la receta considerando rendimientos y mermas.
 */
export const calcularFactorPresentacion = (
  tipoCalculo: 'fraccion' | 'volumen_ml' | 'peso_g' | 'porciones',
  cantidadOVolumen: number,
  rebanadasTotales?: number,
  recetaRendimiento?: number,
  recetaUnidad?: string,
  mermaEstimadaPct = 0
): number => {
  const mermaFactor = 1 - Math.min(Math.max(mermaEstimadaPct, 0), 90) / 100;
  
  if (tipoCalculo === 'porciones' || tipoCalculo === 'fraccion') {
    // Si es rebanada de un pay completo con rebanadasTotales configuradas
    if (rebanadasTotales && rebanadasTotales > 0) {
      return (1 / rebanadasTotales) * cantidadOVolumen;
    }
    // Si la cantidad es 1 y el rendimiento de la receta es e.g. 8
    const totalReceta = recetaRendimiento && recetaRendimiento > 0 ? recetaRendimiento : 1;
    return cantidadOVolumen / totalReceta;
  }

  if (tipoCalculo === 'volumen_ml') {
    // cantidadOVolumen en ml
    // Si la receta rinde en litros (ej. 2 L) o en ml (ej. 2000 ml)
    let volumenTotalRecetaMl = recetaRendimiento || 1000;
    if (recetaUnidad === 'litros' || recetaUnidad === 'litro' || recetaUnidad === 'L') {
      volumenTotalRecetaMl = (recetaRendimiento || 1) * 1000;
    }
    // Considerar volumen neto utilizable con merma
    const volumenNetoUtilizable = volumenTotalRecetaMl * mermaFactor;
    return volumenNetoUtilizable > 0 ? cantidadOVolumen / volumenNetoUtilizable : 0;
  }

  if (tipoCalculo === 'peso_g') {
    let pesoTotalRecetaG = recetaRendimiento || 1000;
    if (recetaUnidad === 'kg') {
      pesoTotalRecetaG = (recetaRendimiento || 1) * 1000;
    }
    const pesoNetoUtilizable = pesoTotalRecetaG * mermaFactor;
    return pesoNetoUtilizable > 0 ? cantidadOVolumen / pesoNetoUtilizable : 0;
  }

  return 1;
};

/**
 * Cálculo de ganancia en pesos ($ MXN):
 * Ganancia = Precio de Venta - Costo
 */
export const calcularGanancia = (precioVenta: number, costo: number): number => {
  const p = isNaN(precioVenta) ? 0 : precioVenta;
  const c = isNaN(costo) ? 0 : costo;
  return Math.round((p - c) * 100) / 100;
};

/**
 * Margen sobre Ventas (Margen Bruto Porcentual):
 * Margen sobre Ventas = ((Precio de Venta - Costo) / Precio de Venta) * 100
 * Ejemplo: Precio $180, Costo $142 -> Ganancia $38 -> Margen = (38 / 180) * 100 = 21.1111...%
 * Ejemplo: Precio $40, Costo $17.75 -> Ganancia $22.25 -> Margen = (22.25 / 40) * 100 = 55.625%
 */
export const calcularMargenSobreVentas = (precioVenta: number, costo: number): number => {
  if (!precioVenta || precioVenta <= 0) return 0;
  const ganancia = precioVenta - costo;
  return (ganancia / precioVenta) * 100;
};

/**
 * Recargo sobre Costo (Markup Porcentual):
 * Recargo sobre Costo = ((Precio de Venta - Costo) / Costo) * 100
 * Indica cuánto porcentaje se le añade al costo de elaboración para fijar el precio.
 */
export const calcularRecargoSobreCosto = (precioVenta: number, costo: number): number => {
  if (!costo || costo <= 0) return 0;
  const ganancia = precioVenta - costo;
  return (ganancia / costo) * 100;
};

/**
 * Cálculo de precio recomendado según margen objetivo sobre ventas:
 * Fórmula obligatoria: Precio = Costo Total / (1 - Margen Objetivo)
 * Ejemplo: Costo $40.05, Margen 50% -> 40.05 / (1 - 0.50) = $80.10 MXN
 */

export const calcularPrecioRecomendado = (  costoUnitario: number,  margenDeseadoPct: number): number => 
{
  if (!Number.isFinite(costoUnitario) || costoUnitario <= 0) 
    {
      return 0;
    }

  const margenValido = Number.isFinite(margenDeseadoPct)
    ? Math.min(Math.max(margenDeseadoPct, 0), 99)
    : 50;

  const margenDecimal = margenValido / 100;
  const precio = costoUnitario / (1 - margenDecimal);

  return Math.round((precio + Number.EPSILON) * 100) / 100;
};


/**
 * Formateador de fechas en español
 */
export const formatFecha = (fechaStr: string, compact = false): string => {
  if (!fechaStr) return '';
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  const fecha = new Date(year, (month || 1) - 1, day || 1);
  
  if (compact) {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(fecha);
  }
  
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

export const formatFechaHora = (isoStr: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoStr;
  }
};

/**
 * Obtener fecha de hoy en formato YYYY-MM-DD
 */
export const getFechaHoy = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Exportador genérico a CSV con codificación UTF-8 con BOM para Excel en español
 */
export const exportarACSV = (nombreArchivo: string, headers: string[], filas: (string | number)[][]) => {
  const escapeCSV = (valor: string | number) => {
    const str = String(valor ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...filas.map((fila) => fila.map(escapeCSV).join(',')),
  ].join('\r\n');

  // BOM para que Excel en Windows y Mac reconozca acentos en español
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
