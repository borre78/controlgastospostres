import { Pedido, Venta } from '../types';

type Grupo = { key: string; fecha: string; ventas: Venta[]; pedidos: Pedido[] };

const hashId = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
};

export const obtenerSiguienteFolioPedido = (ventas: Venta[], pedidos: Pedido[]) => {
  const maximo = [...ventas.map((v) => v.folioPedido), ...pedidos.map((p) => p.folio)]
    .reduce((max, folio) => Math.max(max, Number(folio?.match(/^PED-(\d+)$/i)?.[1] || 0)), 0);
  return `PED-${String(maximo + 1).padStart(4, '0')}`;
};

/** Reasigna folios consecutivos por pedido lógico, conservando juntos sus renglones de venta. */
export const normalizarFoliosPedidos = (ventas: Venta[], pedidos: Pedido[]) => {
  const grupos: Grupo[] = [];
  const porIdVenta = new Map<string, Grupo>();
  const porFolio = new Map<string, Grupo>();

  for (const venta of ventas) {
    const clave = venta.pedidoId ? `id:${venta.pedidoId}`
      : venta.folioPedido ? `folio:${venta.folioPedido}` : `venta:${venta.id}`;
    let grupo = grupos.find((g) => g.key === clave);
    if (!grupo) {
      grupo = { key: clave, fecha: venta.fecha || '', ventas: [], pedidos: [] };
      grupos.push(grupo);
    }
    grupo.ventas.push(venta);
    if (venta.fecha && (!grupo.fecha || venta.fecha < grupo.fecha)) grupo.fecha = venta.fecha;
    porIdVenta.set(venta.pedidoId || '', grupo);
    if (venta.folioPedido) porFolio.set(venta.folioPedido, grupo);
  }

  for (const pedido of pedidos) {
    const grupo = porIdVenta.get(pedido.id) || porFolio.get(pedido.folio) ||
      grupos.find((g) => g.key === `id:${pedido.id}` || g.key === `folio:${pedido.folio}`);
    if (grupo) {
      grupo.pedidos.push(pedido);
      if (pedido.fecha && (!grupo.fecha || pedido.fecha < grupo.fecha)) grupo.fecha = pedido.fecha;
    } else {
      grupos.push({ key: `pedido:${pedido.id}`, fecha: pedido.fecha || '', ventas: [], pedidos: [pedido] });
    }
  }

  grupos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.key.localeCompare(b.key));
  const folioPorGrupo = new Map<Grupo, string>();
  grupos.forEach((grupo, index) => folioPorGrupo.set(grupo, `PED-${String(index + 1).padStart(4, '0')}`));

  const ventasActualizadas = ventas.map((venta) => {
    const clave = venta.pedidoId ? `id:${venta.pedidoId}`
      : venta.folioPedido ? `folio:${venta.folioPedido}` : `venta:${venta.id}`;
    const grupo = grupos.find((g) => g.key === clave);
    const pedidoRelacionado = grupo?.pedidos[0];
    const pedidoId = venta.pedidoId || pedidoRelacionado?.id || `pedido-hist-${hashId(clave)}`;
    return { ...venta, pedidoId, folioPedido: grupo ? folioPorGrupo.get(grupo) : venta.folioPedido };
  });
  const pedidosActualizados = pedidos.map((pedido) => {
    const grupo = grupos.find((g) => g.pedidos.some((p) => p.id === pedido.id));
    return grupo ? { ...pedido, folio: folioPorGrupo.get(grupo)! } : pedido;
  });
  return { ventas: ventasActualizadas, pedidos: pedidosActualizados };
};
