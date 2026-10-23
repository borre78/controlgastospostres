import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, ShoppingBag, Pencil, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Pedido, PedidoItem } from '../../types';
import { formatMXN, getFechaHoy } from '../../utils/formatters';

export const OrdersView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { pedidos, clientes, productos, ventas, addCliente, updateCliente, deleteCliente, addPedido, updatePedido, deletePedido } = useApp();
  const [clienteId, setClienteId] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [productoId, setProductoId] = useState('');
  const [presentacionId, setPresentacionId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [precio, setPrecio] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [editingCliente, setEditingCliente] = useState<string | null>(null);
  const [clienteEditNombre, setClienteEditNombre] = useState('');
  const [clienteEditTelefono, setClienteEditTelefono] = useState('');
  const [clienteEditCorreo, setClienteEditCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const producto = productos.find((p) => p.id === productoId);
  const presentacion = producto?.presentaciones.find((p) => p.id === presentacionId);
  const activos = useMemo(() => pedidos.filter((p) => p.estado === 'pendiente'), [pedidos]);
  const pedidosFiltrados = useMemo(() => pedidos
    .filter((p) => `${p.clienteNombre} ${p.folio}`.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()), [pedidos, busqueda]);
  const totalPaginasPedidos = Math.max(1, Math.ceil(pedidosFiltrados.length / 5));
  const pedidosPagina = pedidosFiltrados.slice((paginaPedidos - 1) * 5, paginaPedidos * 5);
  const clientesOrdenados = useMemo(() => [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [clientes]);
  const totalPaginasClientes = Math.max(1, Math.ceil(clientesOrdenados.length / 5));
  const clientesPagina = clientesOrdenados.slice((paginaClientes - 1) * 5, paginaClientes * 5);
  const resumenProduccion = useMemo(() => {
    const cantidades = new Map<string, { productoId: string; presentacionId: string; productoNombre: string; presentacionNombre: string; solicitadas: number }>();
    for (const pedido of pedidos) {
      if (pedido.estado !== 'pendiente') continue;
      for (const item of pedido.items || []) {
        const key = `${item.productoId}::${item.presentacionId}`;
        const previo = cantidades.get(key);
        cantidades.set(key, {
          productoId: item.productoId,
          presentacionId: item.presentacionId,
          productoNombre: item.productoNombre,
          presentacionNombre: item.presentacionNombre,
          solicitadas: (previo?.solicitadas || 0) + item.cantidad,
        });
      }
    }
    return [...cantidades.values()].map((item) => {
      const presentacionActual = productos.find((p) => p.id === item.productoId)
        ?.presentaciones.find((p) => p.id === item.presentacionId);
      const stockListo = presentacionActual?.stockListo || 0;
      return { ...item, stockListo, porPreparar: Math.max(0, item.solicitadas - stockListo) };
    }).sort((a, b) => a.productoNombre.localeCompare(b.productoNombre, 'es') || a.presentacionNombre.localeCompare(b.presentacionNombre, 'es'));
  }, [pedidos, productos]);
  useEffect(() => setPaginaPedidos((pagina) => Math.min(pagina, totalPaginasPedidos)), [totalPaginasPedidos]);
  useEffect(() => setPaginaClientes((pagina) => Math.min(pagina, totalPaginasClientes)), [totalPaginasClientes]);
  const totalItems = (arr: PedidoItem[]) => arr.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
  const crearIdItem = () => globalThis.crypto?.randomUUID?.()
    ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const totalActualPedido = totalItems(items) + (producto && presentacion && Number(cantidad) > 0 && Number(precio) > 0
    ? Number(cantidad) * Number(precio)
    : 0);

  const crearItemSeleccionado = (): PedidoItem | null => {
    if (!producto || !presentacion || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0 || !Number.isFinite(Number(precio)) || Number(precio) <= 0) return null;
    return { id: crearIdItem(), productoId: producto.id, productoNombre: producto.nombre, presentacionId: presentacion.id, presentacionNombre: presentacion.nombre, cantidad: Number(cantidad), precioUnitario: Number(precio) };
  };

  const agregarItem = () => {
    if (!producto) { setMensaje('Selecciona un producto.'); return; }
    if (!presentacion) { setMensaje('Selecciona una presentación del producto.'); return; }
    if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) { setMensaje('Indica una cantidad mayor que cero.'); return; }
    if (!Number.isFinite(Number(precio)) || Number(precio) <= 0) { setMensaje('Indica un precio unitario mayor que cero.'); return; }
    const nuevoItem = crearItemSeleccionado();
    if (!nuevoItem) { setMensaje('Revisa la cantidad y el precio del producto.'); return; }
    setItems((old) => [...old, nuevoItem]);
    setProductoId(''); setPresentacionId(''); setPrecio('');
    setMensaje('Producto agregado al pedido.');
  };
  const guardar = () => {
    const clienteExistente = clientes.find((c) => c.id === clienteId);
    const clienteNombre = clienteExistente?.nombre || nombre.trim();
    if (!clienteNombre) { setMensaje('Escribe o selecciona el nombre del cliente.'); return; }
    const itemActual = crearItemSeleccionado();
    const itemsParaGuardar = itemActual ? [...items, itemActual] : items;
    if (itemsParaGuardar.length === 0) { setMensaje('Selecciona un producto y su presentación, indica cantidad y precio, y vuelve a guardar.'); return; }
    const cliente = clienteExistente || addCliente({ nombre: clienteNombre, telefono: telefono.trim() || undefined, correo: correo.trim() || undefined });
    const datosPedido = { fecha: editingPedido?.fecha || getFechaHoy(), fechaEntrega: fechaEntrega || undefined, clienteId: cliente.id, clienteNombre: cliente.nombre, telefonoCliente: cliente.telefono, correoCliente: cliente.correo, items: itemsParaGuardar, estado: 'pendiente' as const, notas: notas.trim() || undefined };
    if (editingPedido) { updatePedido(editingPedido.id, datosPedido); setMensaje(`Pedido ${editingPedido.folio} actualizado.`); }
    else { addPedido(datosPedido); setMensaje('Pedido guardado. No se descontó inventario.'); }
    setEditingPedido(null); setItems([]); setNotas(''); setNombre(''); setTelefono(''); setCorreo(''); setFechaEntrega(''); setClienteId(''); setProductoId(''); setPresentacionId(''); setPrecio('');
  };
  const elegirCliente = (id: string) => { setClienteId(id); const c = clientes.find((x) => x.id === id); setNombre(c?.nombre || ''); setTelefono(c?.telefono || ''); setCorreo(c?.correo || ''); };
  const guardarClienteEnCatalogo = () => {
    if (!nombre.trim()) { setMensaje('Escribe el nombre para agregar el cliente al catálogo.'); return; }
    const cliente = addCliente({ nombre: nombre.trim(), telefono: telefono.trim() || undefined, correo: correo.trim() || undefined });
    setClienteId(cliente.id);
    setMensaje(`Cliente ${cliente.nombre} guardado en el catálogo.`);
  };
  const editarPedido = (pedido: Pedido) => { setEditingPedido(pedido); elegirCliente(pedido.clienteId || ''); setNombre(pedido.clienteNombre); setTelefono(pedido.telefonoCliente || ''); setCorreo(pedido.correoCliente || ''); setFechaEntrega(pedido.fechaEntrega || ''); setNotas(pedido.notas || ''); setItems(pedido.items.map((item) => ({ ...item }))); setProductoId(''); setPresentacionId(''); setPrecio(''); setMensaje(`Editando ${pedido.folio}.`); };
  const cancelarEdicionPedido = () => { setEditingPedido(null); setItems([]); setNombre(''); setTelefono(''); setCorreo(''); setFechaEntrega(''); setNotas(''); setClienteId(''); setProductoId(''); setPresentacionId(''); setPrecio(''); setMensaje('Edición cancelada.'); };

  return <div className="space-y-5">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 text-2xl font-black"><ClipboardList className="text-amber-500"/>Pedidos y clientes</h2>
      <p className="mt-1 text-sm text-slate-500">Captura lo solicitado con anticipación. El pedido no descuenta existencias; se descuentan al registrarlo como venta.</p>
    </header>
    <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-bold text-amber-950 dark:text-amber-200">Producción necesaria por pedidos</h3><p className="text-xs text-amber-900/70 dark:text-amber-300/70">Suma pedidos pendientes y resta el stock listo de cada presentación.</p></div><span className="text-xs font-semibold text-amber-800 dark:text-amber-300">{activos.length} pedidos pendientes</span></div>
      {resumenProduccion.length === 0 ? <p className="rounded-xl border border-dashed border-amber-300 p-4 text-sm text-amber-900/70 dark:border-amber-800 dark:text-amber-300/70">No hay pedidos pendientes que requieran producción.</p> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {resumenProduccion.map((item) => <article key={`${item.productoId}-${item.presentacionId}`} className="rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-900/50 dark:bg-slate-900"><p className="text-sm font-bold">{item.productoNombre}</p><p className="text-xs text-slate-500 dark:text-slate-400">{item.presentacionNombre}</p><div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><span className="block text-slate-500">Pedidos</span><b>{item.solicitadas}</b></div><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><span className="block text-slate-500">Stock listo</span><b>{item.stockListo}</b></div><div className="rounded-lg bg-rose-50 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"><span className="block">Por hacer</span><b>{item.porPreparar}</b></div></div></article>)}
      </div>}
    </section>
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between"><h3 className="font-bold">{editingPedido ? `Editar pedido ${editingPedido.folio}` : 'Nuevo pedido'}</h3>{editingPedido && <button onClick={cancelarEdicionPedido} className="inline-flex items-center gap-1 text-xs text-slate-500"><X size={14}/>Cancelar edición</button>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Cliente guardado<select className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800" value={clienteId} onChange={(e) => elegirCliente(e.target.value)}><option value="">Nuevo cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
          <label className="text-xs font-semibold">Nombre *<input className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800" value={nombre} onChange={(e) => { setNombre(e.target.value); setClienteId(''); }}/></label>
          <label className="text-xs font-semibold">Teléfono (opcional)<input className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800" value={telefono} onChange={(e) => setTelefono(e.target.value)}/></label>
          <label className="text-xs font-semibold">Correo (opcional)<input type="email" className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800" value={correo} onChange={(e) => setCorreo(e.target.value)}/></label>
          <label className="text-xs font-semibold">Fecha de entrega<input type="date" className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)}/></label>
        </div>
        {!clienteId && <button type="button" onClick={guardarClienteEnCatalogo} className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:text-violet-300">Guardar cliente en catálogo</button>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Producto o postre *
            <select className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" value={productoId} onChange={(e) => { setProductoId(e.target.value); setPresentacionId(''); setPrecio(''); }}>
              <option value="">Selecciona un producto</option>
              {productos.filter((p) => p.activo !== false).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
          <div>
            <span className="text-xs font-semibold">Presentación comercial *</span>
            {!producto ? <p className="mt-1 rounded-xl border border-dashed p-3 text-xs text-slate-400">Primero selecciona un producto.</p> : producto.presentaciones.filter((p) => p.activo !== false).length === 0 ? <p className="mt-1 rounded-xl border border-dashed p-3 text-xs text-slate-400">Este producto no tiene presentaciones activas.</p> : <div className="mt-1 flex flex-wrap gap-2">{producto.presentaciones.filter((p) => p.activo !== false).map((p) => {
              const seleccionada = presentacionId === p.id;
              const agotada = (p.stockListo || 0) <= 0;
              return <button key={p.id} type="button" onClick={() => { setPresentacionId(p.id); setPrecio(String(p.precioVentaReal)); }} className={`min-w-[150px] rounded-xl border px-3 py-2 text-left transition ${seleccionada ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400 dark:bg-amber-950/40' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
                <span className="block text-xs font-bold">{p.nombre}{agotada ? ' — AGOTADA' : ''}</span>
                <span className="mt-1 flex justify-between gap-3 text-[11px]"><b className="text-emerald-600">{formatMXN(p.precioVentaReal)}</b><span className={agotada ? 'text-rose-500' : 'text-slate-500'}>Stock: {p.stockListo || 0}</span></span>
              </button>;
            })}</div>}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input aria-label="Cantidad" type="number" min="0.01" step="0.01" className="rounded-xl border bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800" value={cantidad} onChange={(e) => setCantidad(e.target.value)}/>
          <input aria-label="Precio unitario" type="number" min="0.01" step="0.01" className="rounded-xl border bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio"/>
          <button onClick={agregarItem} className="rounded-xl bg-amber-500 px-3 text-white"><Plus size={17}/></button>
        </div>
        {items.map((i) => <div key={i.id} className="flex justify-between rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800"><span>{i.cantidad} × {i.productoNombre} — {i.presentacionNombre}</span><span>{formatMXN(i.cantidad * i.precioUnitario)} <button onClick={() => setItems((a) => a.filter((x) => x.id !== i.id))} className="ml-2 text-rose-500">Quitar</button></span></div>)}
        <label className="block text-xs font-semibold">Notas<input className="mt-1 w-full rounded-xl border bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Mensaje, decoración, entrega…"/></label>
        {mensaje && <p aria-live="polite" className="rounded-lg bg-blue-50 p-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">{mensaje}</p>}
        <div className="flex items-center justify-between border-t pt-3"><b>Total: {formatMXN(totalActualPedido)}</b><button onClick={guardar} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">{editingPedido ? 'Guardar cambios' : 'Guardar pedido'}</button></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold">Historial de pedidos ({activos.length} pendientes)</h3><input className="w-40 rounded-xl border bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900" placeholder="Buscar cliente" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaPedidos(1); }}/></div>
        {pedidosPagina.map((p) => {
          const ventaLigada = ventas.find((v) => v.pedidoId === p.id || v.folioPedido === p.folio);
          const yaVendido = Boolean(ventaLigada) || p.estado === 'completado';
          return <article key={p.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between"><b>{p.folio} · {p.clienteNombre}</b><span className={`text-xs ${yaVendido ? 'text-emerald-600' : p.estado === 'cancelado' ? 'text-slate-500' : 'text-amber-600'}`}>{yaVendido ? 'Venta registrada' : p.estado === 'cancelado' ? 'Cancelado' : 'Pendiente'}</span></div>
            <div className="text-xs text-slate-500">{p.items.map((i) => `${i.cantidad} × ${i.productoNombre} (${i.presentacionNombre})`).join(' · ')}</div>
            <div className="flex items-center justify-between gap-2 text-sm"><span>{p.fechaEntrega ? `Entrega: ${p.fechaEntrega}` : p.fecha} · {formatMXN(totalItems(p.items))}</span>
              <div className="flex flex-wrap gap-2">
                {!yaVendido && p.estado === 'pendiente' && <><button onClick={() => { localStorage.setItem('pedidoParaVenta', p.id); onNavigate('sales'); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"><ShoppingBag size={13}/>Registrar venta</button><button onClick={() => editarPedido(p)} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"><Pencil size={12}/>Editar</button><button onClick={() => { if (window.confirm(`¿Cancelar el pedido ${p.folio}? Se conservará en el historial.`)) { updatePedido(p.id, { estado: 'cancelado' }); setMensaje(`Pedido ${p.folio} cancelado y conservado en el historial.`); } }} className="rounded-lg border px-2 py-1 text-xs">Cancelar</button></>}
                {p.estado === 'cancelado' && !ventaLigada && <button onClick={() => { if (window.confirm(`¿Eliminar definitivamente el pedido cancelado ${p.folio}?`)) { deletePedido(p.id); setMensaje(`Pedido ${p.folio} eliminado.`); } }} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"><Trash2 size={12}/>Eliminar</button>}
                {yaVendido && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{ventaLigada ? `Folio de venta ${ventaLigada.folioPedido || ''}` : 'Importado del historial de ventas'}</span>}
              </div>
            </div>
            {p.telefonoCliente && <div className="text-xs text-slate-500">{p.telefonoCliente}{p.correoCliente ? ` · ${p.correoCliente}` : ''}</div>}{p.notas && <p className="text-xs text-slate-500">{p.notas}</p>}
          </article>;
        })}
        {pedidosFiltrados.length > 0 && <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-slate-800"><span>Mostrando {(paginaPedidos - 1) * 5 + 1}–{Math.min(paginaPedidos * 5, pedidosFiltrados.length)} de {pedidosFiltrados.length}</span><div className="flex gap-2"><button disabled={paginaPedidos <= 1} onClick={() => setPaginaPedidos((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><span className="px-2 py-1.5">Página {paginaPedidos} de {totalPaginasPedidos}</span><button disabled={paginaPedidos >= totalPaginasPedidos} onClick={() => setPaginaPedidos((p) => Math.min(totalPaginasPedidos, p + 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>}
      </div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 font-bold">Catálogo de clientes ({clientes.length})</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {clientesPagina.map((c) => <article key={c.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
          {editingCliente === c.id ? <div className="space-y-2">
            <input aria-label="Nombre del cliente" className="w-full rounded-lg border bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={clienteEditNombre} onChange={(e) => setClienteEditNombre(e.target.value)} placeholder="Nombre *"/>
            <input aria-label="Teléfono del cliente" className="w-full rounded-lg border bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={clienteEditTelefono} onChange={(e) => setClienteEditTelefono(e.target.value)} placeholder="Teléfono opcional"/>
            <input aria-label="Correo del cliente" type="email" className="w-full rounded-lg border bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={clienteEditCorreo} onChange={(e) => setClienteEditCorreo(e.target.value)} placeholder="Correo opcional"/>
            <div className="flex gap-2"><button onClick={() => { if (!clienteEditNombre.trim()) { setMensaje('El nombre del cliente es obligatorio.'); return; } updateCliente(c.id, { nombre: clienteEditNombre.trim(), telefono: clienteEditTelefono.trim() || undefined, correo: clienteEditCorreo.trim() || undefined }); setEditingCliente(null); setMensaje('Cliente actualizado.'); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Guardar</button><button onClick={() => setEditingCliente(null)} className="rounded-lg border px-3 py-1.5 text-xs">Cancelar</button></div>
          </div> : <div className="flex items-start justify-between gap-2"><div><b className="text-sm">{c.nombre}</b><p className="text-xs text-slate-500">{[c.telefono, c.correo].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p></div><div className="flex gap-1"><button title="Editar cliente" onClick={() => { setEditingCliente(c.id); setClienteEditNombre(c.nombre); setClienteEditTelefono(c.telefono || ''); setClienteEditCorreo(c.correo || ''); }} className="rounded-lg border p-2"><Pencil size={13}/></button><button title="Eliminar cliente" onClick={() => { if (!window.confirm(`¿Eliminar al cliente ${c.nombre}? Se conservarán su nombre y datos en el historial de pedidos.`)) return; deleteCliente(c.id); setMensaje('Cliente eliminado; sus datos históricos en pedidos se conservaron.'); }} className="rounded-lg border border-rose-200 p-2 text-rose-600"><Trash2 size={13}/></button></div></div>}
        </article>)}
      </div>
      {clientes.length > 0 && <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-slate-800"><span>Mostrando {(paginaClientes - 1) * 5 + 1}–{Math.min(paginaClientes * 5, clientes.length)} de {clientes.length}</span><div className="flex gap-2"><button disabled={paginaClientes <= 1} onClick={() => setPaginaClientes((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><span className="px-2 py-1.5">Página {paginaClientes} de {totalPaginasClientes}</span><button disabled={paginaClientes >= totalPaginasClientes} onClick={() => setPaginaClientes((p) => Math.min(totalPaginasClientes, p + 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>}
    </section>
  </div>;
};
