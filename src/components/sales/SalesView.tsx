import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  User,
  Phone,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Venta, FormaPago, ProductoVenta, PresentacionComercial } from '../../types';
import { formatMXN, formatFecha, getFechaHoy } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SalesView: React.FC = () => {
  const {
    ventas,
    productos,
    recetas,
    insumos,
    addVenta,
    updateVenta,
    deleteVenta,
    marcarVentaCobrada,
  } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'cobrada' | 'pendiente'>('todas');
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');

  const [filtroFormaPago, setFiltroFormaPago] = useState<'todas' | FormaPago>('todas');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [ventaAEliminar, setVentaAEliminar] = useState<Venta | null>(null);

  // Modal Cobrar Rápido
  const [ventaACobrar, setVentaACobrar] = useState<Venta | null>(null);
  const [cobroFormaPago, setCobroFormaPago] = useState<FormaPago>('efectivo');

  // Form State
  type ProductoEnPedido = {
  productoId: string;
  presentacionId: string;
  cantidad: string;
  precioUnitario: string;
  descuento: string;
};

  const [productosPedido, setProductosPedido] = useState<ProductoEnPedido[]>([]);
  const [fecha, setFecha] = useState(getFechaHoy);
  const [cliente, setCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [productoId, setProductoId] = useState('');
  const [presentacionId, setPresentacionId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [descuento, setDescuento] = useState('0');
  const [estadoCobro, setEstadoCobro] = useState<'cobrada' | 'pendiente'>('cobrada');
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo');
  const [notas, setNotas] = useState('');
  const [descontarStock, setDescontarStock] = useState(true);

  // Mapeo
  const productoMap = useMemo(() => {
    return new Map(productos.map((p) => [p.id, p]));
  }, [productos]);

  const productoSeleccionado = productoMap.get(productoId);
  const presentacionesDisponibles = useMemo(() => {
    return productoSeleccionado?.presentaciones || [];
  }, [productoSeleccionado]);

  const presentacionSeleccionada = useMemo(() => {
    return presentacionesDisponibles.find((p) => p.id === presentacionId);
  }, [presentacionesDisponibles, presentacionId]);

  // Cálculos en vivo para modal de venta
  
  const calculoEnVivo = useMemo(() => {
    const cant = parseFloat(cantidad) || 1;
    const pUnit =
      parseFloat(precioUnitario) ||
      (presentacionSeleccionada
        ? presentacionSeleccionada.precioVentaReal
        : 0);
    const desc = parseFloat(descuento) || 0;

    const subtotal = cant * pUnit;
    const totalVentaPrincipal = Math.max(0, subtotal - desc);
    const costoUnit = presentacionSeleccionada
      ? presentacionSeleccionada.costoUnitarioTotal
      : 0;
    const costoTotalPrincipal = cant * costoUnit;

    // Calcular visualmente los productos adicionales
    const totalAdicionales = productosPedido.reduce((total, item) => {
      const cantidadItem = parseFloat(item.cantidad) || 0;
      const precioItem = parseFloat(item.precioUnitario) || 0;
      const descuentoItem = parseFloat(item.descuento) || 0;

      return total + Math.max(
        0,
        cantidadItem * precioItem - descuentoItem
      );
    }, 0);

    const costoAdicionales = productosPedido.reduce((total, item) => {
      const cantidadItem = parseFloat(item.cantidad) || 0;
      const productoItem = productos.find(
        (p) => p.id === item.productoId
      );
      const presentacionItem = productoItem?.presentaciones?.find(
        (p) => p.id === item.presentacionId
      );

      return total +
        cantidadItem * (presentacionItem?.costoUnitarioTotal || 0);
    }, 0);

    const totalVenta = totalVentaPrincipal + totalAdicionales;
    const costoTotal = costoTotalPrincipal + costoAdicionales;
    const utilidad = totalVenta - costoTotal;

    const stockDisponible = presentacionSeleccionada?.stockListo || 0;
    const stockInsuficiente =
      stockDisponible > 0 && cant > stockDisponible;

    // Análisis de volumen de receta e insumos del producto principal
    const recetaBase = recetas.find(
      (r) => r.id === productoSeleccionado?.recetaId
    );

    let volumenRequerido = 0;
    let unidadRequerida = '';
    let tandasNecesarias = 0;
    let superaVolumenReceta = false;

    const ingredientesFaltantes: {
      nombre: string;
      requerido: number;
      disponible: number;
      unidad: string;
    }[] = [];

    if (recetaBase && presentacionSeleccionada) {
      const factor = presentacionSeleccionada.factorReceta || 1;
      tandasNecesarias = cant * factor;

      volumenRequerido =
        cant * (presentacionSeleccionada.cantidadOVolumen || 1);

      unidadRequerida =
        presentacionSeleccionada.unidadMedida ||
        recetaBase.rendimientoUnidad ||
        'unidades';

      if (tandasNecesarias > 1.001) {
        superaVolumenReceta = true;
      }

      const insumoMap = new Map(insumos.map((i) => [i.id, i]));

      for (const ing of recetaBase.ingredientes) {
        const ins = insumoMap.get(ing.insumoId);

        if (ins) {
          const req = ing.cantidad * tandasNecesarias;

          if (ins.stockActual < req) {
            ingredientesFaltantes.push({
              nombre: ins.nombre,
              requerido: req,
              disponible: ins.stockActual,
              unidad: ins.unidadUso,
            });
          }
        }
      }
    }

    return {
      subtotal,
      totalVenta,
      costoTotal,
      utilidad,
      stockDisponible,
      stockInsuficiente,
      recetaBase,
      volumenRequerido,
      unidadRequerida,
      tandasNecesarias,
      superaVolumenReceta,
      ingredientesFaltantes,
    };
  }, [
    cantidad,
    precioUnitario,
    descuento,
    presentacionSeleccionada,
    productoSeleccionado,
    recetas,
    insumos,
    productos,
    productosPedido,
  ]);


  const handleOpenNuevo = () => {
    setEditingVenta(null);
    setFecha(getFechaHoy());
    setCliente('');
    setTelefonoCliente('');

    const primerProd = productos.find((p) => p.activo !== false) || productos[0];
    const primerId = primerProd ? primerProd.id : '';
    setProductoId(primerId);

    const primerPres = primerProd?.presentaciones?.[0];
    setPresentacionId(primerPres ? primerPres.id : '');
    setPrecioUnitario(primerPres ? String(primerPres.precioVentaReal) : '');
    
    setProductosPedido([]);
    setCantidad('1');
    setDescuento('0');
    setEstadoCobro('cobrada');
    setFormaPago('efectivo');
    setNotas('');
    setDescontarStock(true);
    setIsModalOpen(true);
  };

  const agregarProductoAlPedido = () => {
    const primerProducto = productos.find((p) => p.activo !== false) || productos[0];
    const primeraPresentacion = primerProducto?.presentaciones?.[0];

    if (!primerProducto || !primeraPresentacion) {
      alert('No hay productos con presentaciones disponibles.');
      return;
    }

    setProductosPedido((prev) => [
      ...prev,
      {
        productoId: primerProducto.id,
        presentacionId: primeraPresentacion.id,
        cantidad: '1',
        precioUnitario: String(primeraPresentacion.precioVentaReal),
        descuento: '0',
      },
    ]);
  };

  const quitarProductoDelPedido = (indice: number) => {
    setProductosPedido((prev) =>
      prev.filter((_, i) => i !== indice)
    );
  };

  const handleOpenEditar = (v: Venta) => {
    setEditingVenta(v);
    setFecha(v.fecha);
    setCliente(v.cliente || '');
    setTelefonoCliente(v.telefonoCliente || '');
    setProductoId(v.productoId);
    setPresentacionId(v.presentacionId || '');
    setCantidad(String(v.cantidad));
    setPrecioUnitario(String(v.precioUnitario));
    setDescuento(String(v.descuento || 0));
    setEstadoCobro(v.estadoCobro);
    setFormaPago(v.formaPago || 'efectivo');
    setNotas(v.notas || '');
    setDescontarStock(false);
    setIsModalOpen(true);
  };

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cant = parseFloat(cantidad);
    const pUnit = parseFloat(precioUnitario);
    const desc = parseFloat(descuento) || 0;

    if (
      !productoId ||
      isNaN(cant) ||
      cant <= 0 ||
      isNaN(pUnit) ||
      pUnit <= 0 ||
      desc < 0
    ) {
      alert('Selecciona un producto y especifica cantidad y precio válidos.');
      return;
    }

    // Validar los productos adicionales antes de guardar
    if (!editingVenta) {
      for (let i = 0; i < productosPedido.length; i++) {
        const item = productosPedido[i];
        const cantidadItem = parseFloat(item.cantidad);
        const precioItem = parseFloat(item.precioUnitario);
        const descuentoItem = parseFloat(item.descuento) || 0;
        const productoItem = productoMap.get(item.productoId);
        const presentacionItem = productoItem?.presentaciones?.find(
          (p) => p.id === item.presentacionId
        );

        if (
          !productoItem ||
          !presentacionItem ||
          isNaN(cantidadItem) ||
          cantidadItem <= 0 ||
          isNaN(precioItem) ||
          precioItem <= 0 ||
          descuentoItem < 0
        ) {
          alert(
            `Revisa el producto adicional ${i + 1}: selecciona una presentación e indica cantidad y precio válidos.`
          );
          return;
        }
      }
    }

    const prod = productoMap.get(productoId);
    const prodNombre = prod ? prod.nombre : 'Postre';
    const presNombre = presentacionSeleccionada
      ? presentacionSeleccionada.nombre
      : undefined;

    const totalVenta = Math.max(0, cant * pUnit - desc);
    const costoUnit = presentacionSeleccionada
      ? presentacionSeleccionada.costoUnitarioTotal
      : 0;
    const costoTotalVendido = cant * costoUnit;
    const utilidadEstimada = totalVenta - costoTotalVendido;

    const datosCompartidos = {
      fecha,
      cliente: cliente.trim() || undefined,
      telefonoCliente: telefonoCliente.trim() || undefined,
      estadoCobro,
      formaPago: estadoCobro === 'cobrada' ? formaPago : undefined,
      fechaCobro: estadoCobro === 'cobrada' ? fecha : undefined,
      notas: notas.trim() || undefined,
    };

    if (editingVenta) {
      updateVenta(editingVenta.id, {
        ...datosCompartidos,
        productoId,
        productoNombre: prodNombre,
        presentacionId: presentacionId || undefined,
        presentacionNombre: presNombre,
        cantidad: cant,
        precioUnitario: pUnit,
        descuento: desc,
        totalVenta,
        costoTotalVendido,
        utilidadEstimada,
      });
    } else {
      const pedidoId = `pedido-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const folioPedido = `PED-${Date.now().toString().slice(-8)}`;
      console.log('Folio generado:', folioPedido);
      // Guardar el producto principal
      addVenta(
        {
          ...datosCompartidos,
          pedidoId,
          folioPedido,
          productoId,
          productoNombre: prodNombre,
          presentacionId: presentacionId || undefined,
          presentacionNombre: presNombre,
          cantidad: cant,
          precioUnitario: pUnit,
          descuento: desc,
          totalVenta,
          costoTotalVendido,
          utilidadEstimada,
        },
        descontarStock
      );

      // Guardar cada producto adicional como otra venta
      productosPedido.forEach((item) => {
        const productoItem = productoMap.get(item.productoId);
        const presentacionItem = productoItem?.presentaciones?.find(
          (p) => p.id === item.presentacionId
        );

        // Los datos ya fueron validados arriba
        if (!productoItem || !presentacionItem) return;

        const cantidadItem = parseFloat(item.cantidad);
        const precioItem = parseFloat(item.precioUnitario);
        const descuentoItem = parseFloat(item.descuento) || 0;
        const totalItem = Math.max(
          0,
          cantidadItem * precioItem - descuentoItem
        );
        const costoItem =
          cantidadItem * presentacionItem.costoUnitarioTotal;

        addVenta(
          {
            ...datosCompartidos,
            pedidoId,
            folioPedido,
            productoId: productoItem.id,
            productoNombre: productoItem.nombre,
            presentacionId: presentacionItem.id,
            presentacionNombre: presentacionItem.nombre,
            cantidad: cantidadItem,
            precioUnitario: precioItem,
            descuento: descuentoItem,
            totalVenta: totalItem,
            costoTotalVendido: costoItem,
            utilidadEstimada: totalItem - costoItem,
          },
          descontarStock
        );
      });
    }

    setProductosPedido([]);
    setIsModalOpen(false);
  };


  // Filtrado reactivo
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincide =
          v.productoNombre.toLowerCase().includes(q) ||
          (v.presentacionNombre && v.presentacionNombre.toLowerCase().includes(q)) ||
          (v.cliente && v.cliente.toLowerCase().includes(q)) ||
          (v.notas && v.notas.toLowerCase().includes(q));
        if (!coincide) return false;
      }

      if (filtroEstado !== 'todas' && v.estadoCobro !== filtroEstado) {
        return false;
      }

      if (filtroProducto !== 'todos' && v.productoId !== filtroProducto) {
        return false;
      }

      if (
        filtroFormaPago !== 'todas' &&
        v.formaPago !== filtroFormaPago
      ) {
        return false;
      }

      return true;
    });
  }, [ventas, busqueda, filtroEstado, filtroProducto, filtroFormaPago]);

  // Calcular totales de pedidos con varios productos
  const obtenerTotalPedido = (venta: Venta) => {
    if (!venta.pedidoId) {
      return venta.totalVenta;
    }

    return ventas
      .filter((v) => v.pedidoId === venta.pedidoId)
      .reduce((total, v) => total + v.totalVenta, 0);
  };

  const obtenerCantidadProductosPedido = (venta: Venta) => {
    if (!venta.pedidoId) {
      return 1;
    }

    return ventas.filter((v) => v.pedidoId === venta.pedidoId).length;
  };

  // Agrupar las ventas por pedido para mostrarlas organizadas
  const pedidosAgrupados = useMemo(() => {
    const grupos = new Map<string, Venta[]>();

    ventasFiltradas.forEach((venta) => {
      const clave = venta.pedidoId || `venta-individual-${venta.id}`;
      const grupo = grupos.get(clave) || [];

      grupo.push(venta);
      grupos.set(clave, grupo);
    });

    return Array.from(grupos.entries()).map(([pedidoId, productos]) => ({
      pedidoId,
      productos,
      total: productos.reduce((sum, producto) => sum + producto.totalVenta, 0),
      cantidadProductos: productos.length,
      fecha: productos[0].fecha,
      cliente: productos[0].cliente,
    }));
  }, [ventasFiltradas]);

  // Totales
  const totalCobrado = ventasFiltradas
    .filter((v) => v.estadoCobro === 'cobrada')
    .reduce((sum, v) => sum + v.totalVenta, 0);

  const totalPendiente = ventasFiltradas
    .filter((v) => v.estadoCobro === 'pendiente')
    .reduce((sum, v) => sum + v.totalVenta, 0);

  const totalCostoVendido = ventasFiltradas.reduce((sum, v) => sum + v.costoTotalVendido, 0);
  const totalUtilidad = ventasFiltradas.reduce((sum, v) => sum + v.utilidadEstimada, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-500" />
            Registro de Ventas por Presentación
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registra ventas por presentación exacta (rebanada, pay completo, medio litro o vasito)
          </p>
        </div>

        <button
          onClick={handleOpenNuevo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Venta</span>
        </button>
      </div>

      {/* Métricas de Ventas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Ventas (Filtradas):
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatMXN(totalCobrado + totalPendiente)}
          </p>
          <span className="text-[11px] text-slate-400">{ventasFiltradas.length} órdenes registradas</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Cobradas:
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMXN(totalCobrado)}
          </p>
          <span className="text-[11px] text-slate-400">Dinero en mano / cuenta</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pendientes de Cobro:
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatMXN(totalPendiente)}
          </p>
          <span className="text-[11px] text-slate-400">Por cobrar al entregar</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Ganancia Neta Estimada:
          </span>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {formatMXN(totalUtilidad)}
          </p>
          <span className="text-[11px] text-slate-400">
            Costo postres: {formatMXN(totalCostoVendido)}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por postre, presentación, cliente o nota..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="todas">Todos los Estados</option>
            <option value="cobrada">Solo Cobradas</option>
            <option value="pendiente">Solo Pendientes</option>
          </select>

          <select
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="todos">Todos los Productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          
          <select
            value={filtroFormaPago}
            onChange={(e) =>
              setFiltroFormaPago(e.target.value as 'todas' | FormaPago)
            }
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-full sm:w-auto"
          >
            <option value="todas">Todas las formas de pago</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia SPEI</option>
            <option value="tarjeta_debito">Tarjeta de débito</option>
            <option value="tarjeta_credito">Tarjeta de crédito</option>
          </select>

          
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Producto & Presentación</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-right">Total Venta</th>
                <th className="py-3 px-4 text-right">Costo Postre</th>
                <th className="py-3 px-4 text-right">Utilidad</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No hay ventas registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                  pedidosAgrupados.flatMap((pedido) =>
                    pedido.productos.map((v, indiceProducto) => (
                      <React.Fragment key={v.id}>
                        {indiceProducto === 0 && (
                          <tr className="bg-blue-50 dark:bg-blue-950/30 border-t-2 border-blue-200 dark:border-blue-900">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-bold text-blue-900 dark:text-blue-200">
                                    Pedido {pedido.productos[0].folioPedido || 'Sin folio'} —{' '}
                                           {pedido.cliente || 'Venta de mostrador'}
                                  </div>
                                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                    {pedido.cantidadProductos} productos · {formatFecha(pedido.fecha, true)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-blue-700 dark:text-blue-300">
                                    Total del pedido
                                  </div>
                                  <div className="text-lg font-black text-blue-900 dark:text-blue-100">
                                    {formatMXN(pedido.total)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        {formatFecha(v.fecha, true)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {v.cantidad}x {v.productoNombre}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {v.presentacionNombre && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                              {v.presentacionNombre}
                            </span>
                          )}
                          {v.esDemostracion ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                              Ejemplo Demo
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                              Dato Real
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatMXN(v.precioUnitario)} c/u
                          {v.descuento > 0 && ` (Desc: -${formatMXN(v.descuento)})`}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {v.cliente || 'Venta de mostrador'}
                        </div>
                        {v.telefonoCliente && (
                          <span className="text-[11px] text-slate-400 block">
                            Tel: {v.telefonoCliente}
                          </span>
                        )}
                        {v.notas && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                            {v.notas}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-black text-slate-900 dark:text-white text-sm">
                        {formatMXN(v.totalVenta)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-medium text-slate-500 dark:text-slate-400">
                        {formatMXN(v.costoTotalVendido)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        +{formatMXN(v.utilidadEstimada)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {v.estadoCobro === 'cobrada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            Cobrada
                          </span>
                        ) : (
                          <button
                            onClick={() => setVentaACobrar(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-emerald-100 hover:text-emerald-800 transition active:scale-95"
                            title="Haz clic para marcar como cobrada"
                          >
                            <Clock className="w-3 h-3" />
                            Pendiente (Cobrar)
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditar(v)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Editar venta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setVentaAEliminar(v)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Eliminar venta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    </React.Fragment>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar / Editar Venta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVenta ? 'Editar Venta' : 'Registrar Nueva Venta'}
        subtitle="Selecciona el producto y la presentación comercial exacta para calcular costos"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Venta *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Producto o Postre *
              </label>
              <select
                required
                value={productoId}
                onChange={(e) => {
                  const id = e.target.value;
                  setProductoId(id);
                  const prod = productoMap.get(id);
                  const primerPres = prod?.presentaciones?.[0];
                  setPresentacionId(primerPres ? primerPres.id : '');
                  setPrecioUnitario(primerPres ? String(primerPres.precioVentaReal) : '');
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">-- Selecciona el postre --</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.presentaciones?.length || 0} presentaciones)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Presentación Comercial */}
          {presentacionesDisponibles.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                Presentación Comercial a Vender *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presentacionesDisponibles.map((pres) => {
                  const isSel = pres.id === presentacionId;
                  return (
                    <button
                      key={pres.id}
                      type="button"
                      onClick={() => {
                        setPresentacionId(pres.id);
                        setPrecioUnitario(String(pres.precioVentaReal));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSel
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-slate-900 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-xs">{pres.nombre}</span>
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatMXN(pres.precioVentaReal)}
                        </span>
                        <span className="text-slate-400">Stock: {pres.stockListo || 0}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!editingVenta && (
            <button
              type="button"
              onClick={agregarProductoAlPedido}
              className="w-full py-2.5 rounded-xl border border-dashed border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold transition"
            >
              + Agregar otro producto al pedido
            </button>
          )}

          
          {productosPedido.map((item, indice) => {
            const producto = productos.find((p) => p.id === item.productoId);
            const presentacion = producto?.presentaciones?.find(
              (p) => p.id === item.presentacionId
            );
          
            return (
              <div
                key={`${indice}-${item.productoId}`}
                className="rounded-xl border border-emerald-200 dark:border-emerald-900 p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Producto adicional {indice + 1}
                  </span>
            
                  <button
                    type="button"
                    onClick={() => quitarProductoDelPedido(indice)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Quitar
                  </button>
                </div>
            
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Producto
                  </label>
                  <select
                    value={item.productoId}
                    onChange={(e) => {
                      const nuevoProducto = productos.find(
                        (p) => p.id === e.target.value
                      );
                      const nuevaPresentacion = nuevoProducto?.presentaciones?.[0];
                    
                      setProductosPedido((prev) =>
                        prev.map((fila, i) =>
                          i === indice
                            ? {
                                ...fila,
                                productoId: e.target.value,
                                presentacionId: nuevaPresentacion?.id ?? '',
                                precioUnitario: nuevaPresentacion
                                  ? String(nuevaPresentacion.precioVentaReal)
                                  : '',
                              }
                            : fila
                        )
                      );
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm"
                  >
                    {productos
                      .filter((p) => p.activo !== false)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                    
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Presentación
                  </label>
                  <select
                    value={item.presentacionId}
                    onChange={(e) => {
                      const nuevaPresentacion = producto?.presentaciones?.find(
                        (p) => p.id === e.target.value
                      );
                    
                      setProductosPedido((prev) =>
                        prev.map((fila, i) =>
                          i === indice
                            ? {
                                ...fila,
                                presentacionId: e.target.value,
                                precioUnitario: nuevaPresentacion
                                  ? String(nuevaPresentacion.precioVentaReal)
                                  : '',
                              }
                            : fila
                        )
                      );
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm"
                  >
                    {producto?.presentaciones?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                  
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        setProductosPedido((prev) =>
                          prev.map((fila, i) =>
                            i === indice
                              ? { ...fila, cantidad: e.target.value }
                              : fila
                          )
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm"
                    />
                  </div>
                    
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Precio unitario
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(e) =>
                        setProductosPedido((prev) =>
                          prev.map((fila, i) =>
                            i === indice
                              ? { ...fila, precioUnitario: e.target.value }
                              : fila
                          )
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm"
                    />
                  </div>
                    
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Descuento ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.descuento}
                      onChange={(e) =>
                        setProductosPedido((prev) =>
                          prev.map((fila, i) =>
                            i === indice
                              ? { ...fila, descuento: e.target.value }
                              : fila
                          )
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm"
                    />
                  </div>
                </div>
                    
                <div className="text-right text-sm font-bold text-gray-700 dark:text-gray-200">
                  Subtotal: $
                  {Math.max(
                    0,
                    (parseFloat(item.cantidad) || 0) *
                      (parseFloat(item.precioUnitario) || 0) -
                      (parseFloat(item.descuento) || 0)
                  ).toFixed(2)}
                </div>
              </div>
            );
          })}


          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                step="any"
                min="0.5"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Precio Unitario ($ MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descuento ($ MXN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Advertencia de Volumen de Receta */}
          {calculoEnVivo.superaVolumenReceta && calculoEnVivo.recetaBase && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Atención: El volumen solicitado excede una tanda de la receta</span>
              </div>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Para surtir <strong>{cantidad} unidades</strong> ({calculoEnVivo.volumenRequerido} {calculoEnVivo.unidadRequerida}) se requieren <strong>{calculoEnVivo.tandasNecesarias.toFixed(1)} tandas completas</strong> de la receta base <em>"{calculoEnVivo.recetaBase.nombre}"</em> (que rinde {calculoEnVivo.recetaBase.rendimientoCantidad} {calculoEnVivo.recetaBase.rendimientoUnidad} por tanda).
              </p>
            </div>
          )}

          {/* Advertencia de Ingredientes Faltantes en Almacén */}
          {calculoEnVivo.ingredientesFaltantes.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Materia prima insuficiente en almacén para producir esta cantidad:</span>
              </div>
              <ul className="text-[11px] list-disc list-inside text-rose-800 dark:text-rose-300 space-y-0.5">
                {calculoEnVivo.ingredientesFaltantes.map((f, idx) => (
                  <li key={idx}>
                    <strong>{f.nombre}:</strong> requiere {f.requerido.toFixed(0)} {f.unidad} (disponible: {f.disponible} {f.unidad})
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-rose-700/80 dark:text-rose-400 mt-1">
                Puedes registrar la venta, pero recuerda adquirir los insumos faltantes para la preparación.
              </p>
            </div>
          )}

          {/* Alerta de Stock Preparado en Mostrador si no alcanza */}
          {calculoEnVivo.stockInsuficiente && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Cuentas con <strong>{calculoEnVivo.stockDisponible} unidades</strong> listas en mostrador de esta presentación.
              </span>
            </div>
          )}

          {/* Cliente y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Cliente (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Ana Martínez, Pedido Oficina..."
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="Ej. 55 1234 5678"
                value={telefonoCliente}
                onChange={(e) => setTelefonoCliente(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Estado de Cobro y Forma de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado de Cobro *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEstadoCobro('cobrada')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    estadoCobro === 'cobrada'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cobrada
                </button>
                <button
                  type="button"
                  onClick={() => setEstadoCobro('pendiente')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    estadoCobro === 'pendiente'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Por Cobrar
                </button>
              </div>
            </div>

            {estadoCobro === 'cobrada' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Forma de Cobro *
                </label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as FormaPago)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia SPEI</option>
                  <option value="tarjeta_debito">Tarjeta de Débito</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 pt-5">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                <span>Quedará registrada en pendientes para cobrar después.</span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas del Pedido
            </label>
            <input
              type="text"
              placeholder="Ej. Entregar con cucharitas extra, mensaje dedicatoria..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* RESUMEN FINANCIERO DE LA VENTA */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total a Cobrar:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatMXN(calculoEnVivo.totalVenta)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Costo de Producción + Empaque:
              </span>
              <span className="font-medium text-slate-500">
                {formatMXN(calculoEnVivo.costoTotal)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200">Utilidad Bruta Estimada:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                +{formatMXN(calculoEnVivo.utilidad)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {editingVenta ? 'Actualizar Venta' : 'Registrar Venta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Marcar como Cobrada Rápido */}
      {ventaACobrar && (
        <Modal
          isOpen={!!ventaACobrar}
          onClose={() => setVentaACobrar(null)}
          title="Marcar Venta como Cobrada"
          subtitle={`Pedido de ${ventaACobrar.productoNombre} (${ventaACobrar.presentacionNombre || ''}) por ${formatMXN(ventaACobrar.totalVenta)}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ¿Cómo recibiste el pago?
              </label>
              <select
                value={cobroFormaPago}
                onChange={(e) => setCobroFormaPago(e.target.value as FormaPago)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia SPEI</option>
                <option value="tarjeta_debito">Tarjeta de Débito</option>
                <option value="tarjeta_credito">Tarjeta de Crédito</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setVentaACobrar(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  marcarVentaCobrada(ventaACobrar.id, cobroFormaPago);
                  setVentaACobrar(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmar Eliminar */}
      {ventaAEliminar && (
        <ConfirmDialog
          isOpen={!!ventaAEliminar}
          onClose={() => setVentaAEliminar(null)}
          onConfirm={() => {
            deleteVenta(ventaAEliminar.id);
            setVentaAEliminar(null);
          }}
          title="Eliminar Venta"
          message={`¿Deseas eliminar la venta de ${ventaAEliminar.cantidad}x "${ventaAEliminar.productoNombre} - ${ventaAEliminar.presentacionNombre || ''}" por ${formatMXN(ventaAEliminar.totalVenta)}?`}
          confirmText="Eliminar Venta"
          isDestructive={true}
        />
      )}
    </div>
  );
};
