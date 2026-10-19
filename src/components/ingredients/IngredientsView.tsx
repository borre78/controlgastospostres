import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Apple,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Package,
  Layers,
  Sparkles,
  DollarSign,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Insumo, TipoInsumo, UnidadMedida, FormaPago, Gasto } from '../../types';
import {
  formatMXN,
  formatCostoUnitario,
  calcularCostoPorUnidadUso,
  formatFecha,
} from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';


export const IngredientsView: React.FC = () => {
  const {
    insumos,
    configuracion,
    updateConfiguracion,
    gastos,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    ajustarStockInsumo,
    reabastecerInsumo,
    registrarCompraHistoricaInsumo,
    recalcularTodasLasRecetas,
  } = useApp();

  const insumosConCompraHistoricaRegistrada = new Set(
    gastos
      .filter(
        (gasto: Gasto) =>
          gasto.insumoIdRelacionado &&
          gasto.descripcion.startsWith('Compra inicial de insumo:')
      )
      .map((gasto: Gasto) => gasto.insumoIdRelacionado)
  );

const insumosPendientesCompraHistorica = insumos.filter(
  (insumo) => !insumosConCompraHistoricaRegistrada.has(insumo.id)
);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoInsumo | 'todos'>('todos');
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);

  // Registro de compras históricas
  const [fechaCompraHistorica, setFechaCompraHistorica] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [formaPagoHistorica, setFormaPagoHistorica] =
    useState<FormaPago>('efectivo');

  // Modal Insumo (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  // Form State Insumo
  const [formNombre, setFormNombre] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formTipo, setFormTipo] = useState<TipoInsumo>('ingrediente');
  const [formUnidadCompra, setFormUnidadCompra] = useState<UnidadMedida>('kg');
  const [formCantidadCompra, setFormCantidadCompra] = useState('1');
  const [formPrecioCompra, setFormPrecioCompra] = useState('');
  const [formStockMinimo, setFormStockMinimo] = useState('200');
  const [formStockRequerido, setFormStockRequerido] = useState('0');
  const [formProveedor, setFormProveedor] = useState('');
  const [formNotas, setFormNotas] = useState('');

  // Modal Reabastecer Rápido
  const [insumoAReabastecer, setInsumoAReabastecer] = useState<Insumo | null>(null);
  const [reabastecerCantidad, setReabastecerCantidad] = useState('1');
  const [reabastecerPrecio, setReabastecerPrecio] = useState('');
  const [reabastecerCrearGasto, setReabastecerCrearGasto] = useState(true);
  const [reabastecerFormaPago, setReabastecerFormaPago] = useState<FormaPago>('efectivo');

  // Modal Ajuste Rápido de Stock
  const [insumoAAjustar, setInsumoAAjustar] = useState<Insumo | null>(null);
  const [nuevoStockAjuste, setNuevoStockAjuste] = useState('');

  // Confirmación eliminar
  const [insumoAEliminar, setInsumoAEliminar] = useState<Insumo | null>(null);

  // Menú de acciones para móvil (mantener presionada la fila)
  const [insumoMenuMovil, setInsumoMenuMovil] = useState<Insumo | null>(null);
  const temporizadorPulsacion = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulsacionLargaActivada = useRef(false);

  const cancelarPulsacionLarga = () => {
    if (temporizadorPulsacion.current) {
      clearTimeout(temporizadorPulsacion.current);
      temporizadorPulsacion.current = null;
    }
  };

  useEffect(() => {
    return () => cancelarPulsacionLarga();
  }, []);

  const [formPiezasPorPaquete, setFormPiezasPorPaquete] = useState('1');

  // Cálculo en vivo para el formulario
  
const calculoEnVivo = useMemo(() => {
  const cant = parseFloat(formCantidadCompra) || 1;
  const precio = parseFloat(formPrecioCompra) || 0;
  const piezas = Math.max(
    1,
    parseInt(formPiezasPorPaquete, 10) || 1
  );

  return calcularCostoPorUnidadUso(
    precio,
    cant,
    formUnidadCompra,
    piezas
  );
}, [
  formCantidadCompra,
  formPrecioCompra,
  formUnidadCompra,
  formPiezasPorPaquete,
]);


  const handleOpenNuevo = () => {
    setEditingInsumo(null);
    setFormNombre('');
    setFormMarca('');
    setFormTipo('ingrediente');
    setFormUnidadCompra('kg');
    setFormCantidadCompra('1');
    setFormPrecioCompra('');
    setFormStockMinimo('200');
    setFormStockRequerido('0');
    setFormProveedor('');
    setFormNotas('');
    setIsModalOpen(true);
    setFormPiezasPorPaquete('1');
  };

  const handleOpenEditar = (ins: Insumo) => {
    setEditingInsumo(ins);
    setFormNombre(ins.nombre);
    setFormMarca(ins.marca || '');
    setFormTipo(ins.tipo);
    setFormUnidadCompra(ins.unidadCompra);
    setFormCantidadCompra(String(ins.cantidadCompra));
    setFormPrecioCompra(String(ins.precioCompra));
    setFormStockMinimo(String(ins.stockMinimo));
    setFormStockRequerido(String(ins.stockRequerido ?? 0));
    setFormProveedor(ins.proveedor || '');
    setFormNotas(ins.notas || '');
    setIsModalOpen(true);
    setFormPiezasPorPaquete(
      String(ins.piezasPorPaquete ?? 1)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cantCompra = parseFloat(formCantidadCompra);
    const precioCompra = parseFloat(formPrecioCompra);
    const stockMin = parseFloat(formStockMinimo) || 0;
    const stockReq = Math.max(0, parseFloat(formStockRequerido) || 0);

    if (!formNombre.trim() || isNaN(cantCompra) || cantCompra <= 0 || isNaN(precioCompra) || precioCompra <= 0) {
      alert('Por favor ingresa un nombre, cantidad comprada y precio válidos.');
      return;
    }

    const { costoPorUnidadUso, unidadUso, cantidadTotal } = calcularCostoPorUnidadUso(
      precioCompra,
      cantCompra,
      formUnidadCompra,
      Number(formPiezasPorPaquete) || 1
    );

    if (editingInsumo) {
      updateInsumo(editingInsumo.id, {
        nombre: formNombre.trim(),
        marca: formMarca.trim() || undefined,
        tipo: formTipo,
        unidadCompra: formUnidadCompra,
        cantidadCompra: cantCompra,
        precioCompra,
        unidadUso,
        cantidadEnUnidadUso: cantidadTotal,
        costoPorUnidadUso,
        stockMinimo: stockMin,
        stockRequerido: stockReq,
        proveedor: formProveedor.trim() || undefined,
        notas: formNotas.trim() || undefined,
        piezasPorPaquete:
          formUnidadCompra === 'paquete'
            ? Number(formPiezasPorPaquete)
            : 1,
      });
      // Recalcular recetas automáticamente cuando un ingrediente cambia de precio
      recalcularTodasLasRecetas();
    } else {
      addInsumo({
        nombre: formNombre.trim(),
        marca: formMarca.trim() || undefined,
        tipo: formTipo,
        unidadCompra: formUnidadCompra,
        cantidadCompra: cantCompra,
        precioCompra,
        unidadUso,
        cantidadEnUnidadUso: cantidadTotal,
        costoPorUnidadUso,
        stockActual: cantidadTotal, // Arranca con el stock recién comprado
        stockMinimo: stockMin,
        stockRequerido: stockReq,
        proveedor: formProveedor.trim() || undefined,
        notas: formNotas.trim() || undefined,
        piezasPorPaquete:
          formUnidadCompra === 'paquete'
            ? Number(formPiezasPorPaquete)
            : 1,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmReabastecer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoAReabastecer) return;
    const cant = parseFloat(reabastecerCantidad);
    const precio = parseFloat(reabastecerPrecio);
    if (isNaN(cant) || cant <= 0 || isNaN(precio) || precio <= 0) {
      alert('Por favor introduce cantidad y precio válidos.');
      return;
    }

    reabastecerInsumo(
      insumoAReabastecer.id,
      cant,
      precio,
      reabastecerCrearGasto,
      reabastecerFormaPago
    );
    recalcularTodasLasRecetas();
    setInsumoAReabastecer(null);
  };

  
  const handleRegistrarComprasHistoricas = () => {
    if (insumosPendientesCompraHistorica.length === 0) {
      alert('Todos los insumos ya tienen registrada su compra inicial.');
      return;
    }

    const confirmar = window.confirm(
      `Se registrarán ${insumosPendientesCompraHistorica.length} compras históricas por un total de ${formatMXN(
        insumosPendientesCompraHistorica.reduce(
          (total, insumo) => total + insumo.precioCompra,
          0
        )
      )}. No se modificarán las existencias. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    insumosPendientesCompraHistorica.forEach((insumo) => {
      registrarCompraHistoricaInsumo(
        insumo,
        fechaCompraHistorica,
        formaPagoHistorica
      );
    });

    alert('Las compras históricas se registraron correctamente.');
  };


  const handleConfirmAjusteStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoAAjustar) return;
    const nuevo = parseFloat(nuevoStockAjuste);
    if (isNaN(nuevo) || nuevo < 0) {
      alert('Ingresa un valor de stock válido.');
      return;
    }
    ajustarStockInsumo(insumoAAjustar.id, nuevo);
    setInsumoAAjustar(null);
  };

  // Filtrado de lista
  const insumosFiltrados = useMemo(() => {
    return insumos.filter((ins) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincide =
          ins.nombre.toLowerCase().includes(q) ||
          (ins.marca && ins.marca.toLowerCase().includes(q)) ||
          (ins.proveedor && ins.proveedor.toLowerCase().includes(q));
        if (!coincide) return false;
      }
      if (filtroTipo !== 'todos' && ins.tipo !== filtroTipo) {
        return false;
      }
      if (filtroStockBajo && ins.stockActual > ins.stockMinimo) {
        return false;
      }
      return true;
    });
  }, [insumos, busqueda, filtroTipo, filtroStockBajo]);

  // Contadores
  const totalInsumos = insumos.length;
  const insumosBajoStockCount = insumos.filter((i) => i.stockActual <= i.stockMinimo).length;

  const handleRegistrarRevision = () => {
    const confirmar = window.confirm(
      '¿Confirmas que realizaste la revisión del inventario de hoy?'
    );

    if (!confirmar) return;

    const fechaHoy = new Date();
    const fechaLocal =
      `${fechaHoy.getFullYear()}-${String(fechaHoy.getMonth() + 1).padStart(2, '0')}-${String(fechaHoy.getDate()).padStart(2, '0')}`;

    updateConfiguracion({
      fechaUltimaRevisionStock: fechaLocal,
    });

    alert('La revisión de inventario se registró correctamente.');
  };

  // Configuración de la revisión de inventario
  const frecuenciaRevision = configuracion.frecuenciaRevisionStock ?? 'quincenal';
  
  const diasEntreRevisiones = (() => {
    switch (frecuenciaRevision) {
      case 'semanal':
        return 7;
      case 'quincenal':
        return 15;
      case 'mensual':
        return 30;
      case 'personalizada':
        return Math.max(1, configuracion.diasRevisionStock ?? 15);
      default:
        return 15;
    }
  })();
  
  // Comparar fechas sin considerar la hora
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaUltimaRevision = configuracion.fechaUltimaRevisionStock
    ? new Date(`${configuracion.fechaUltimaRevisionStock.slice(0, 10)}T00:00:00`)
    : null;
  
  const fechaProximaRevision = fechaUltimaRevision
    ? new Date(
        fechaUltimaRevision.getTime() +
          diasEntreRevisiones * 24 * 60 * 60 * 1000
      )
    : null;
    
  // Si nunca se ha registrado una revisión, se considera pendiente
  const revisionPendiente =
    !fechaUltimaRevision ||
    Number.isNaN(fechaUltimaRevision.getTime()) ||
    !fechaProximaRevision ||
    hoy >= fechaProximaRevision;
    
  const insumosConFaltante = insumos.filter(
    (ins) =>
      (ins.stockRequerido ?? 0) > 0 &&
      ins.stockActual < (ins.stockRequerido ?? 0)
  );


  const valorTotalInventario = insumos.reduce(
    (sum, i) => sum + i.stockActual * i.costoPorUnidadUso,
    0
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Apple className="w-6 h-6 text-amber-500" />
            Catálogo de Insumos y Materiales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Calcula automáticamente el costo por gramo, mililitro o pieza para tus recetas
          </p>
        </div>

        <button
          onClick={handleOpenNuevo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Insumo</span>
        </button>
      </div>

      
      {/* Registro de compras históricas */}
      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">
            Registrar compras iniciales como gastos
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Registra las compras originales de tus insumos sin modificar las
            existencias actuales.
          </p>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">
            Insumos pendientes: {insumosPendientesCompraHistorica.length}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha de compra
            </label>
            <input
              type="date"
              value={fechaCompraHistorica}
              onChange={(e) => setFechaCompraHistorica(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Forma de pago
            </label>
            <select
              value={formaPagoHistorica}
              onChange={(e) =>
                setFormaPagoHistorica(e.target.value as FormaPago)
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta_debito">Tarjeta de débito</option>
              <option value="tarjeta_credito">Tarjeta de crédito</option>
              <option value="transferencia">Transferencia SPEI</option>
            </select>
          </div>
        </div>
            
        <button
          type="button"
          onClick={handleRegistrarComprasHistoricas}
          disabled={insumosPendientesCompraHistorica.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
        >
          Registrar compras pendientes
        </button>
      </div>

      
      {/* Alerta de revisión de inventario */}
      {revisionPendiente && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Revisión de inventario pendiente
              </h3>

              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                {fechaUltimaRevision
                  ? `Han transcurrido al menos ${diasEntreRevisiones} días desde la última revisión.`
                  : 'Todavía no se ha registrado una revisión de inventario.'}
              </p>

              <button
                type="button"
                onClick={handleRegistrarRevision}
                className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                Registrar revisión de hoy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de insumos con faltantes */}
      {insumosConFaltante.length > 0 && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-rose-900 dark:text-rose-200">
                Reabastecimiento pendiente
              </h3>

              <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">
                Tienes {insumosConFaltante.length} insumo(s) por debajo del stock requerido.
              </p>

              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-rose-800 dark:text-rose-300">
                {insumosConFaltante.slice(0, 5).map((ins) => (
                  <li key={ins.id}>
                    {ins.nombre}: faltan{' '}
                    {Math.max(
                      0,
                      (ins.stockRequerido ?? 0) - ins.stockActual
                    )}{' '}
                    {ins.unidadUso}
                  </li>
                ))}
              </ul>

              {insumosConFaltante.length > 5 && (
                <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">
                  Y {insumosConFaltante.length - 5} insumos más con faltante.
                </p>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Métricas del Catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Insumos Registrados:
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalInsumos}
          </p>
          <span className="text-[11px] text-slate-400">Ingredientes y empaques</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Valor Estimado de Insumos:
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMXN(valorTotalInventario)}
          </p>
          <span className="text-[11px] text-slate-400">Existencias actuales en taller</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Alertas de Stock Bajo:
          </span>
          <p
            className={`text-xl sm:text-2xl font-black mt-1 ${
              insumosBajoStockCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {insumosBajoStockCount}
          </p>
          <span className="text-[11px] text-slate-400">Por debajo del stock mínimo</span>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar insumo por nombre, marca o proveedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="todos">Todos los tipos</option>
            <option value="ingrediente">Solo Ingredientes</option>
            <option value="empaque">Solo Empaques</option>
            <option value="desechable">Solo Desechables</option>
          </select>

          <button
            type="button"
            onClick={() => setFiltroStockBajo(!filtroStockBajo)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
              filtroStockBajo
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Solo Stock Bajo
          </button>
        </div>
      </div>

      {/* Lista de Insumos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Insumo / Marca</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Compra Habitual</th>
                <th className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">
                  Costo por Unidad de Receta
                </th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="px-4 py-3 text-left">Stock requerido</th>
                <th className="px-4 py-3 text-left">Faltante</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {insumosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No hay insumos registrados. Haz clic en "+ Nuevo Insumo".
                  </td>
                </tr>
              ) : (
                insumosFiltrados.map((ins) => {
                  const esStockBajo = ins.stockActual <= ins.stockMinimo;
                  return (
                    <tr
                      key={ins.id}
                      onTouchStart={() => {
                        pulsacionLargaActivada.current = false;
                        cancelarPulsacionLarga();
                        temporizadorPulsacion.current = setTimeout(() => {
                          pulsacionLargaActivada.current = true;
                          setInsumoMenuMovil(ins);
                        }, 550);
                      }}
                      onTouchEnd={cancelarPulsacionLarga}
                      onTouchMove={cancelarPulsacionLarga}
                      onContextMenu={(e) => {
                        // En móvil, el menú propio sustituye al menú contextual del navegador.
                        if (window.matchMedia('(max-width: 639px)').matches) {
                          e.preventDefault();
                          setInsumoMenuMovil(ins);
                        }
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition select-none"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {ins.nombre}
                          </span>
                          {ins.esDemostracion ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
                              Demo
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                              Real
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {ins.marca && <span>{ins.marca}</span>}
                          {ins.proveedor && <span>• {ins.proveedor}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {ins.tipo}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {ins.cantidadCompra} {ins.unidadCompra} = {formatMXN(ins.precioCompra)}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                          {formatCostoUnitario(ins.costoPorUnidadUso)} / {ins.unidadUso}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {ins.unidadUso === 'g'
                            ? `(${formatMXN(ins.costoPorUnidadUso * 1000)} / kg)`
                            : ins.unidadUso === 'ml'
                            ? `(${formatMXN(ins.costoPorUnidadUso * 1000)} / L)`
                            : ''}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              esStockBajo
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {ins.stockActual} {ins.unidadUso}
                          </span>
                          {esStockBajo && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Bajo
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Mín: {ins.stockMinimo} {ins.unidadUso}</span>
                      </td>

                      <td className="px-4 py-3">
                        {(ins.stockRequerido ?? 0) > 0 ? (
                          <span>
                            {ins.stockRequerido} {ins.unidadUso}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin configurar</span>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {(ins.stockRequerido ?? 0) > 0 ? (
                          <span
                            className={
                              Math.max(0, (ins.stockRequerido ?? 0) - ins.stockActual) > 0
                                ? 'font-semibold text-red-600'
                                : 'font-semibold text-green-600'
                            }
                          >
                            {Math.max(0, (ins.stockRequerido ?? 0) - ins.stockActual)}{' '}
                            {ins.unidadUso}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 whitespace-nowrap text-center"
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setInsumoAReabastecer(ins);
                              setReabastecerCantidad(String(ins.cantidadCompra));
                              setReabastecerPrecio(String(ins.precioCompra));
                              setReabastecerCrearGasto(true);
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                            title="Registrar compra / reabastecer"
                          >
                            + Reabastecer
                          </button>
                          <button
                            onClick={() => {
                              setInsumoAAjustar(ins);
                              setNuevoStockAjuste(String(ins.stockActual));
                            }}
                            className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Ajustar stock físico"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditar(ins)}
                            className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Editar insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInsumoAEliminar(ins)}
                            className="hidden sm:inline-flex p-1.5 rounded-lg text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menú contextual móvil: se abre al mantener presionada una fila */}
      {insumoMenuMovil && (
        <div
          className="fixed inset-0 z-[90] sm:hidden flex items-end bg-black/40"
          onClick={() => setInsumoMenuMovil(null)}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            role="menu"
            aria-label={`Acciones para ${insumoMenuMovil.nombre}`}
            className="w-full rounded-t-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">Acciones del insumo</p>
                <p className="font-bold text-slate-900 dark:text-white truncate">{insumoMenuMovil.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setInsumoMenuMovil(null)}
                className="shrink-0 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setInsumoAAjustar(insumoMenuMovil);
                setNuevoStockAjuste(String(insumoMenuMovil.stockActual));
                setInsumoMenuMovil(null);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Ajustar stock</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleOpenEditar(insumoMenuMovil);
                setInsumoMenuMovil(null);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Edit2 className="w-5 h-5" />
              <span>Editar insumo</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setInsumoAEliminar(insumoMenuMovil);
                setInsumoMenuMovil(null);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-5 h-5" />
              <span>Eliminar insumo</span>
            </button>
            <p className="mt-2 text-[11px] text-center text-slate-400">Mantén presionada otra fila para abrir sus acciones.</p>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Insumo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInsumo ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
        subtitle="Ingresa los datos del insumo o empaque para calcular su costo unitario"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Insumo / Material *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Queso Crema, Harina de trigo, Cajas 26cm"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca / Presentación
              </label>
              <input
                type="text"
                placeholder="Ej. Philadelphia, San Juan, Kraft"
                value={formMarca}
                onChange={(e) => setFormMarca(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo *
              </label>
              <select
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value as TipoInsumo)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ingrediente">Ingrediente Comestible</option>
                <option value="empaque">Empaque / Caja / Base</option>
                <option value="desechable">Desechable / Cubierto / Servilleta</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unidad de Compra *
              </label>
              <select
                value={formUnidadCompra}
                onChange={(e) => setFormUnidadCompra(e.target.value as UnidadMedida)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="litro">Litros (L)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="pieza">Pieza individual</option>
                <option value="paquete">Paquete con piezas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad Comprada *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                required
                placeholder="Ej. 1.8 o 50"
                value={formCantidadCompra}
                onChange={(e) => setFormCantidadCompra(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          {formUnidadCompra === 'paquete' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Piezas por paquete *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={formPiezasPorPaquete}
                onChange={(e) => setFormPiezasPorPaquete(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                ¿Cuántas piezas contiene cada paquete?
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Precio Pagado en Compra ($ MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formPrecioCompra}
                  onChange={(e) => setFormPrecioCompra(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alerta de Stock Mínimo ({calculoEnVivo.unidadUso})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Ej. 200"
                value={formStockMinimo}
                onChange={(e) => setFormStockMinimo(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stock requerido ({calculoEnVivo.unidadUso})
            </label>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Ej. 500"
              value={formStockRequerido}
              onChange={(e) => setFormStockRequerido(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cantidad que deseas tener disponible.
            </p>
          </div>

          {/* VISTA PREVIA DEL CÁLCULO AUTOMÁTICO */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-900/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                Costo Calculado para Recetas:
              </span>
              <p className="text-xs text-amber-900/70 dark:text-amber-300/70 mt-0.5">
                {formCantidadCompra || 0}{' '}
                  {formUnidadCompra === 'paquete'
                    ? Number(formCantidadCompra) === 1
                      ? 'paquete'
                      : 'paquetes'
                    : formUnidadCompra}
                  {' = '}
                  {calculoEnVivo.cantidadTotal}{' '}
                  {calculoEnVivo.unidadUso === 'pieza' &&
                  formUnidadCompra === 'paquete'
                    ? Number(calculoEnVivo.cantidadTotal) === 1
                      ? 'pieza'
                      : 'piezas'
                    : calculoEnVivo.unidadUso}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                {formatCostoUnitario(calculoEnVivo.costoPorUnidadUso)}
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 ml-1">
                / {calculoEnVivo.unidadUso}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proveedor Habitual (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Central de Abastos, Sam's Club, Cremería"
                value={formProveedor}
                onChange={(e) => setFormProveedor(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notas (Opcional)
              </label>
              <input
                type="text"
                placeholder="Rendimiento, conservación, tips..."
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

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
              {editingInsumo ? 'Actualizar Insumo' : 'Guardar Insumo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Reabastecer Rápido */}
      {insumoAReabastecer && (
        <Modal
          isOpen={!!insumoAReabastecer}
          onClose={() => setInsumoAReabastecer(null)}
          title={`Reabastecer: ${insumoAReabastecer.nombre}`}
          subtitle={`Aumenta el inventario y actualiza el costo promedio`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmReabastecer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad Comprada ({insumoAReabastecer.unidadCompra}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={reabastecerCantidad}
                onChange={(e) => setReabastecerCantidad(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Pagado ($ MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={reabastecerPrecio}
                onChange={(e) => setReabastecerPrecio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={reabastecerCrearGasto}
                  onChange={(e) => setReabastecerCrearGasto(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>Crear registro de gasto automáticamente</span>
              </label>

              {reabastecerCrearGasto && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Forma de Pago del Gasto
                  </label>
                  <select
                    value={reabastecerFormaPago}
                    onChange={(e) => setReabastecerFormaPago(e.target.value as FormaPago)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                    <option value="transferencia">Transferencia SPEI</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInsumoAReabastecer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirmar Compra
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Ajuste Manual de Stock */}
      {insumoAAjustar && (
        <Modal
          isOpen={!!insumoAAjustar}
          onClose={() => setInsumoAAjustar(null)}
          title={`Ajuste de Stock: ${insumoAAjustar.nombre}`}
          subtitle={`Existencia actual registrada: ${insumoAAjustar.stockActual} ${insumoAAjustar.unidadUso}`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmAjusteStock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nuevo Stock Real en Taller ({insumoAAjustar.unidadUso})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={nuevoStockAjuste}
                onChange={(e) => setNuevoStockAjuste(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Úsalo para corregir mermas, derrames o inventario físico.
              </p>
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
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
              >
                Actualizar Stock
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmar Eliminar */}
      {insumoAEliminar && (
        <ConfirmDialog
          isOpen={!!insumoAEliminar}
          onClose={() => setInsumoAEliminar(null)}
          onConfirm={() => {
            const exito = deleteInsumo(insumoAEliminar.id);
            if (!exito) {
              alert(
                'No se puede eliminar este insumo porque forma parte de una o más recetas activas. Elimínalo primero de las recetas.'
              );
            }
            setInsumoAEliminar(null);
          }}
          title="Eliminar Insumo"
          message={`¿Estás seguro de que deseas eliminar "${insumoAEliminar.nombre}" del catálogo?`}
          confirmText="Eliminar"
          isDestructive={true}
        />
      )}
    </div>
  );
};
