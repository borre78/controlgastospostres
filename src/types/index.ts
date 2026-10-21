export type TipoAmbito = 'negocio' | 'personal';

export type FormaPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'otro';

export type UnidadMedida = 'kg' | 'g' | 'litro' | 'ml' | 'pieza' | 'paquete';

export type TipoInsumo = 'ingrediente' | 'empaque' | 'desechable' | 'otro';

export interface Insumo {
  id: string;
  nombre: string;
  marca?: string;
  tipo: TipoInsumo;
  unidadCompra: UnidadMedida;
  cantidadCompra: number; // Ej. 1.8 kg o 50 piezas
  piezasPorPaquete?: number; // Piezas contenidas en cada paquete
  precioCompra: number; // En pesos MXN
  unidadUso: 'g' | 'ml' | 'pieza'; // Unidad para calcular recetas
  cantidadEnUnidadUso: number; // Ej. 1800 g o 50 piezas
  costoPorUnidadUso: number; // Ej. $0.1333 MXN por gramo o $2.40 MXN por domo
  stockActual: number; // En unidadUso (ej. 1500 g restantes)
  stockMinimo: number; // Alerta cuando stockActual <= stockMinimo
  proveedor?: string;
  notas?: string;
  imagenUrl?: string;
  fechaActualizacion: string;
  esDemostracion?: boolean;
  stockRequerido?: number; /** Cantidad que se desea tener disponible en cada revisión */
}

export interface IngredienteReceta {
  insumoId: string;
  cantidad: number; // en unidadUso del insumo
  costoCalculado: number; // cantidad * insumo.costoPorUnidadUso
}

export interface EmpaqueReceta {
  insumoId: string;
  cantidad: number;
  costoCalculado: number;
}

export interface CostosIndirectosReceta {
  minutosGas: number; // minutos de horno o estufa
  costoPorHoraGas: number; // MXN por hora de horno
  costoGas: number;

  minutosLuz: number; // minutos de batidora/horno eléctrico/enfriamiento
  costoPorHoraLuz: number;
  costoLuz: number;

  minutosManoObra: number; // minutos de elaboración
  costoPorHoraManoObra: number; // valor por hora de trabajo del repostero
  costoManoObra: number;

  otrosCostosFijos: number; // depreciación de moldes, papel encerado, guantes, etc.
}

export interface Receta {
  id: string;
  nombre: string;
  descripcion?: string;
  rendimientoCantidad: number; // Ej. 1 pastel o 8 rebanadas o 2000 ml
  rendimientoUnidad: string; // "pastel", "rebanadas", "ml", "litros", "porciones", "piezas"
  // Volumen o peso utilizable neto para recetas con merma (ej. arroz con leche rinde 2000 ml útiles)
  volumenOUnidadesUtilizables?: number;
  unidadMedidaBase?: 'unidades' | 'ml' | 'litros' | 'g' | 'kg';
  mermaEstimadaPct?: number; // Porcentaje de merma por evaporación o cocción (ej. 5%)
  
  tiempoElaboracionMinutos: number;
  ingredientes: IngredienteReceta[];
  empaques: EmpaqueReceta[];
  desechables?: EmpaqueReceta[];
  otrosInsumos?: EmpaqueReceta[];
  indirectos: CostosIndirectosReceta;
  
  // Totales calculados
  costoIngredientes: number;
  costoEmpaques: number;
  costoDesechables?: number;
  costoOtrosInsumos?: number;
  costoIndirectos: number;
  costoTotalReceta: number; // Suma de todos los anteriores
  costoPorUnidad: number; // costoTotalReceta / rendimientoCantidad
  
  fechaCreacion: string;
  fechaModificacion: string;
  esDemostracion?: boolean;
}

export type TipoCalculoPresentacion = 'fraccion' | 'volumen_ml' | 'peso_g' | 'porciones';

export interface EmpaquePresentacionItem {
  insumoId: string;
  cantidad: number;
  nombre?: string;
  costoUnitario?: number;
  costoTotal?: number;
}

export interface PresentacionComercial {
  id: string;
  nombre: string; // Ej. "Pay Completo", "Rebanada", "Medio Litro (500 ml)", "Vaso 6 oz (~177.4 ml)"
  descripcion?: string;
  tipoCalculo: TipoCalculoPresentacion;
  
  // Datos de proporción respecto a la receta
  // Para fracción o porciones: ej. 1 pay = 1, rebanada = 1/8 = 0.125
  // Para volumen: ej. 500 ml de una receta de 2000 ml => factor = 500 / 2000 = 0.25
  cantidadOVolumen: number; // Ej. 1 (entero), 1 (rebanada), 500 (ml), 177.4 (ml / 6 oz)
  unidadMedida: string; // "pieza", "rebanada", "ml", "litro", "g", "vaso 6 oz"
  rebanadasTotalesPorReceta?: number; // Si es rebanada, cuántas se obtienen del pay completo (ej. 8)
  factorReceta: number; // Proporción exacta [0.001 - 1.0+] de la receta consumida por esta presentación
  
  // Empaques específicos de esta presentación (caja, domo individual, vaso, tapa, cuchara, etiqueta)
  empaques: EmpaquePresentacionItem[];
  
  // Costos calculados
  costoBaseReceta: number; // factorReceta * receta.costoTotalReceta
  costoEmpaqueTotal: number; // Suma de los empaques específicos de esta presentación
  costoUnitarioTotal: number; // costoBaseReceta + costoEmpaqueTotal
  
  // Precios y Márgenes
  margenDeseadoPct: number; // Margen objetivo (ej. 50%)
  precioSugerido: number; // costoUnitarioTotal / (1 - margenDeseadoPct / 100)
  precioVentaReal: number; // Precio fijado por el usuario en MXN (ej. $180 para pay completo, $40 para rebanada)
  
  gananciaPorUnidad: number; // precioVentaReal - costoUnitarioTotal
  margenRealPct: number; // ((precioVentaReal - costoUnitarioTotal) / precioVentaReal) * 100
  
  // Desglose financiero adicional (antes de empaque y recargo markup)
  gananciaAntesEmpaque?: number; // precioVentaReal - costoBaseReceta
  margenAntesEmpaquePct?: number; // ((precioVentaReal - costoBaseReceta) / precioVentaReal) * 100
  recargoSobreCostoPct?: number; // ((precioVentaReal - costoUnitarioTotal) / costoUnitarioTotal) * 100

  stockListo?: number; // Unidades preparadas listas para entrega
  activo: boolean;
  esDemostracion?: boolean;
}

export interface ProductoVenta {
  id: string;
  nombre: string; // Ej. "Pay de Queso", "Arroz con Leche", "Brownies Artesanales"
  descripcion?: string;
  categoria?: string;
  recetaId: string; // Receta base de la que se derivan las presentaciones
  
  // Colección de presentaciones comerciales (cada una con su porción, empaque, precio y margen)
  presentaciones: PresentacionComercial[];
  
  activo: boolean;
  esDemostracion?: boolean;
}

export interface Venta {
  id: string;
  pedidoId?: string; // Identificador compartido por los productos del mismo pedido
  folioPedido?: string;
  fecha: string; // YYYY-MM-DD o ISO
  cliente?: string;
  telefonoCliente?: string; 
  productoId: string;
  productoNombre: string;
  presentacionId?: string; // ID de la presentación vendida
  presentacionNombre?: string; // Ej. "Pay Completo", "Rebanada", "Medio Litro"
  
  cantidad: number; // Cantidad de unidades de esta presentación vendidas
  precioUnitario: number; // MXN de la presentación
  descuento: number; // MXN
  totalVenta: number; // (cantidad * precioUnitario) - descuento
  costoTotalVendido: number; // cantidad * presentacion.costoUnitarioTotal
  utilidadEstimada: number; // totalVenta - costoTotalVendido
  
  estadoCobro: 'cobrada' | 'pendiente';
  formaPago?: FormaPago;
  fechaCobro?: string;
  notas?: string;
  esDemostracion?: boolean;
  descontoStock?: boolean;
  // Registro histórico de empaques descontados al realizar la venta
  empaquesDescontados?: {
    insumoId: string;
    cantidadTotal: number;
  }[];
}

export interface Gasto {
  id: string;
  fecha: string; // YYYY-MM-DD
  descripcion: string;
  categoriaId: string;
  categoriaNombre: string;
  importe: number; // MXN
  formaPago: FormaPago;
  ambito: TipoAmbito; // 'negocio' | 'personal'
  tipoGastoNegocio?: 'inventario_materia_prima' | 'operativo_fijo' | 'activo_equipo';
  insumoIdRelacionado?: string;
  notas?: string;
  comprobanteUrl?: string;
  esDemostracion?: boolean;
}

export interface CategoriaGasto {
  id: string;
  nombre: string;
  ambito: TipoAmbito;
  color: string;
  icono?: string;
  esFija?: boolean;
}

export interface RegistroProduccion {
  id: string;
  fecha: string;
  recetaId: string;
  recetaNombre: string;
  tandas: number; // número de veces que se preparó la receta
  unidadesProducidas: number;
  costoTotalTanda: number;
  descontoInventario: boolean;
  notas?: string;
}

export interface ConfiguracionApp {
  moneda: string; // 'MXN'
  simboloMoneda: string; // '$'
  nombreNegocio: string;
  propietario: string;
  margenGananciaDefaultPct: number; // 50%
  costoHoraGasDefault: number; // MXN por hora de horno (ej. 14)
  costoHoraLuzDefault: number; // MXN por hora eléctrica (ej. 7.5)
  costoHoraManoObraDefault: number; // MXN por hora de repostero (ej. 65)
  tema: 'light' | 'dark' | 'system';
  modoPersistencia: 'local' | 'cloud_ready';
  // Revisión de inventario
  frecuenciaRevisionStock?: 'semanal' | 'quincenal' | 'mensual' | 'personalizada';
  diasRevisionStock?: number;
  fechaUltimaRevisionStock?: string;
}

export type PeriodoFiltro = 'hoy' | 'semana' | 'quincena' | 'mes' | 'anio' | 'todo' | 'personalizado';

export interface FiltroRangoFechas {
  tipo: PeriodoFiltro;
  fechaInicio: string;
  fechaFin: string;
}
