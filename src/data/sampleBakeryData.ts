import { Insumo, Receta, ProductoVenta, Venta, Gasto } from '../types';

const RAW_SAMPLE_INSUMOS: Insumo[] = [
  // Lácteos y Básicos
  {
    id: 'ins-queso-crema',
    nombre: 'Queso Crema Barra',
    marca: 'Philadelphia',
    tipo: 'ingrediente',
    unidadCompra: 'kg',
    cantidadCompra: 1.8,
    precioCompra: 245.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 1800,
    costoPorUnidadUso: 245.0 / 1800, // ~0.1361 MXN/g
    stockActual: 3600,
    stockMinimo: 900,
    proveedor: 'Costco / Sam\'s Club',
    notas: 'Barra grande para repostería',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-galleta-maria',
    nombre: 'Galletas para Base',
    marca: 'Gamesa Marías',
    tipo: 'ingrediente',
    unidadCompra: 'g',
    cantidadCompra: 850,
    precioCompra: 52.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 850,
    costoPorUnidadUso: 52.0 / 850, // ~0.0612 MXN/g
    stockActual: 1700,
    stockMinimo: 400,
    proveedor: 'Supermercado local',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-mantequilla',
    nombre: 'Mantequilla sin sal',
    marca: 'Gloria',
    tipo: 'ingrediente',
    unidadCompra: 'kg',
    cantidadCompra: 1.0,
    precioCompra: 195.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 1000,
    costoPorUnidadUso: 195.0 / 1000, // 0.195 MXN/g
    stockActual: 1500,
    stockMinimo: 300,
    proveedor: 'Cremería La Central',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-huevos',
    nombre: 'Huevo Blanco Fresco',
    marca: 'San Juan',
    tipo: 'ingrediente',
    unidadCompra: 'pieza',
    cantidadCompra: 30,
    precioCompra: 85.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 30,
    costoPorUnidadUso: 85.0 / 30, // ~2.833 MXN/pza
    stockActual: 60,
    stockMinimo: 15,
    proveedor: 'Central de Abastos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-lechera',
    nombre: 'Leche Condensada',
    marca: 'La Lechera',
    tipo: 'ingrediente',
    unidadCompra: 'g',
    cantidadCompra: 375,
    precioCompra: 34.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 375,
    costoPorUnidadUso: 34.0 / 375, // ~0.0907 MXN/g
    stockActual: 1500,
    stockMinimo: 375,
    proveedor: 'Supermercado',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-leche-entera',
    nombre: 'Leche Entera Pasteurizada',
    marca: 'Lala',
    tipo: 'ingrediente',
    unidadCompra: 'litro',
    cantidadCompra: 1.0,
    precioCompra: 28.0,
    unidadUso: 'ml',
    cantidadEnUnidadUso: 1000,
    costoPorUnidadUso: 28.0 / 1000, // 0.028 MXN/ml
    stockActual: 4000,
    stockMinimo: 1000,
    proveedor: 'Cremería',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-arroz',
    nombre: 'Arroz Blanco Grano Grueso',
    marca: 'SOS / Schettino',
    tipo: 'ingrediente',
    unidadCompra: 'kg',
    cantidadCompra: 1.0,
    precioCompra: 36.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 1000,
    costoPorUnidadUso: 36.0 / 1000, // 0.036 MXN/g
    stockActual: 3000,
    stockMinimo: 500,
    proveedor: 'Central de Abastos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-canela',
    nombre: 'Canela en Rama Entera',
    marca: 'Especias Selectas',
    tipo: 'ingrediente',
    unidadCompra: 'g',
    cantidadCompra: 100,
    precioCompra: 35.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 100,
    costoPorUnidadUso: 35.0 / 100, // 0.35 MXN/g
    stockActual: 200,
    stockMinimo: 30,
    proveedor: 'Central de Abastos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-pasas',
    nombre: 'Uva Pasa sin Semilla',
    marca: 'Frutos Secos',
    tipo: 'ingrediente',
    unidadCompra: 'g',
    cantidadCompra: 250,
    precioCompra: 45.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 250,
    costoPorUnidadUso: 45.0 / 250, // 0.18 MXN/g
    stockActual: 400,
    stockMinimo: 100,
    proveedor: 'Central de Abastos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-vainilla',
    nombre: 'Extracto de Vainilla',
    marca: 'Molina Natural',
    tipo: 'ingrediente',
    unidadCompra: 'ml',
    cantidadCompra: 250,
    precioCompra: 55.0,
    unidadUso: 'ml',
    cantidadEnUnidadUso: 250,
    costoPorUnidadUso: 55.0 / 250, // 0.22 MXN/ml
    stockActual: 400,
    stockMinimo: 50,
    proveedor: 'Materia Prima Repostera',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-azucar',
    nombre: 'Azúcar Estándar',
    marca: 'Zulka',
    tipo: 'ingrediente',
    unidadCompra: 'kg',
    cantidadCompra: 5.0,
    precioCompra: 145.0,
    unidadUso: 'g',
    cantidadEnUnidadUso: 5000,
    costoPorUnidadUso: 145.0 / 5000, // 0.029 MXN/g
    stockActual: 4200,
    stockMinimo: 1000,
    proveedor: 'Central de Abastos',
    fechaActualizacion: '2026-10-14',
  },

  // Insumos de Empaque y Desechables
  {
    id: 'ins-caja-pay',
    nombre: 'Caja con Ventana para Pay 26cm',
    marca: 'Cartón Kraft Empaques',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 25,
    precioCompra: 215.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 25,
    costoPorUnidadUso: 215.0 / 25, // 8.60 MXN/pza
    stockActual: 18,
    stockMinimo: 10,
    proveedor: 'Empaques de Cartón',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-base-dorada',
    nombre: 'Base de Cartón Laminada 26cm',
    marca: 'Dorado Pastelería',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 25,
    precioCompra: 110.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 25,
    costoPorUnidadUso: 110.0 / 25, // 4.40 MXN/pza
    stockActual: 22,
    stockMinimo: 10,
    proveedor: 'Empaques de Cartón',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-domo-rebanada',
    nombre: 'Domo Triangular para Rebanada',
    marca: 'Inix Desechables',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 50,
    precioCompra: 125.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 50,
    costoPorUnidadUso: 125.0 / 50, // 2.50 MXN/pza
    stockActual: 70,
    stockMinimo: 20,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-envase-500ml',
    nombre: 'Envase Térmico Medio Litro (500 ml)',
    marca: 'Reyma / Convermex',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 25,
    precioCompra: 75.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 25,
    costoPorUnidadUso: 75.0 / 25, // 3.00 MXN/pza
    stockActual: 45,
    stockMinimo: 15,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-tapa-500ml',
    nombre: 'Tapa Plástica para Envase 500 ml',
    marca: 'Reyma',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 25,
    precioCompra: 37.5,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 25,
    costoPorUnidadUso: 37.5 / 25, // 1.50 MXN/pza
    stockActual: 45,
    stockMinimo: 15,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-vaso-6oz',
    nombre: 'Vaso Plástico Transparente 6 oz (~177.4 ml)',
    marca: 'Solo / Dart',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 50,
    precioCompra: 65.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 50,
    costoPorUnidadUso: 65.0 / 50, // 1.30 MXN/pza
    stockActual: 80,
    stockMinimo: 25,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-tapa-6oz',
    nombre: 'Tapa Domo sin Orificio 6 oz',
    marca: 'Solo',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 50,
    precioCompra: 45.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 50,
    costoPorUnidadUso: 45.0 / 50, // 0.90 MXN/pza
    stockActual: 80,
    stockMinimo: 25,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-cuchara-bio',
    nombre: 'Cuchara Biodegradable Desechable',
    marca: 'BioPackaging',
    tipo: 'desechable',
    unidadCompra: 'paquete',
    cantidadCompra: 100,
    precioCompra: 65.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 100,
    costoPorUnidadUso: 65.0 / 100, // 0.65 MXN/pza
    stockActual: 150,
    stockMinimo: 30,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-tenedor-servilleta',
    nombre: 'Kit Tenedor + Servilleta Kraft',
    marca: 'BioPackaging',
    tipo: 'desechable',
    unidadCompra: 'paquete',
    cantidadCompra: 100,
    precioCompra: 85.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 100,
    costoPorUnidadUso: 85.0 / 100, // 0.85 MXN/pza
    stockActual: 150,
    stockMinimo: 30,
    proveedor: 'Distribuidora de Plásticos',
    fechaActualizacion: '2026-10-14',
  },
  {
    id: 'ins-etiqueta-logo',
    nombre: 'Etiquetas Redondas con Logo 5cm',
    marca: 'Imprenta Exprés',
    tipo: 'empaque',
    unidadCompra: 'paquete',
    cantidadCompra: 100,
    precioCompra: 75.0,
    unidadUso: 'pieza',
    cantidadEnUnidadUso: 100,
    costoPorUnidadUso: 75.0 / 100, // 0.75 MXN/pza
    stockActual: 120,
    stockMinimo: 40,
    proveedor: 'Imprenta Local',
    fechaActualizacion: '2026-10-14',
  },
];

export const SAMPLE_INSUMOS: Insumo[] = RAW_SAMPLE_INSUMOS.map((i) => ({
  ...i,
  esDemostracion: true,
}));

export const SAMPLE_RECETAS: Receta[] = [
  // 1. Receta Pay de Queso
  {
    id: 'rec-pay-queso-clasico',
    nombre: 'Pay de Queso Horneado Clásico (Molde 24cm)',
    descripcion: 'Pay horneado con base crocante de mantequilla y galleta, relleno de queso suave y cremoso. Rinde 1 pay entero u 8 rebanadas generosas.',
    rendimientoCantidad: 8,
    rendimientoUnidad: 'rebanadas',
    volumenOUnidadesUtilizables: 8,
    unidadMedidaBase: 'unidades',
    mermaEstimadaPct: 0,
    tiempoElaboracionMinutos: 90,
    ingredientes: [
      { insumoId: 'ins-queso-crema', cantidad: 380, costoCalculado: 380 * (245 / 1800) }, // 51.72
      { insumoId: 'ins-galleta-maria', cantidad: 150, costoCalculado: 150 * (52 / 850) }, // 9.18
      { insumoId: 'ins-mantequilla', cantidad: 70, costoCalculado: 70 * (195 / 1000) }, // 13.65
      { insumoId: 'ins-huevos', cantidad: 2, costoCalculado: 2 * (85 / 30) }, // 5.67
      { insumoId: 'ins-lechera', cantidad: 180, costoCalculado: 180 * (34 / 375) }, // 16.32
      { insumoId: 'ins-vainilla', cantidad: 10, costoCalculado: 10 * (55 / 250) }, // 2.20
    ],
    empaques: [],
    indirectos: {
      minutosGas: 45, // 45 min de horno a $14/h
      costoPorHoraGas: 14.0,
      costoGas: (45 / 60) * 14.0, // 10.50
      minutosLuz: 15,
      costoPorHoraLuz: 7.5,
      costoLuz: (15 / 60) * 7.5, // 1.88
      minutosManoObra: 25,
      costoPorHoraManoObra: 65.0,
      costoManoObra: (25 / 60) * 65.0, // 27.08
      otrosCostosFijos: 3.8,
    },
    costoIngredientes: 98.74,
    costoEmpaques: 0,
    costoIndirectos: 43.26,
    costoTotalReceta: 142.0, // Costo total de elaborar el pay completo
    costoPorUnidad: 142.0 / 8, // 17.75 MXN por rebanada base
    fechaCreacion: '2026-10-14',
    fechaModificacion: '2026-10-14',
    esDemostracion: true,
  },

  // 2. Receta Arroz con Leche
  {
    id: 'rec-arroz-con-leche',
    nombre: 'Arroz con Leche Cremoso Tradicional',
    descripcion: 'Receta tradicional mexicana aromatizada con canela en rama y vainilla. Rinde 2 Litros (2,000 ml) de producto utilizable después de cocción.',
    rendimientoCantidad: 2000,
    rendimientoUnidad: 'ml',
    volumenOUnidadesUtilizables: 2000,
    unidadMedidaBase: 'ml',
    mermaEstimadaPct: 8, // 8% merma por evaporación en fuego lento
    tiempoElaboracionMinutos: 50,
    ingredientes: [
      { insumoId: 'ins-arroz', cantidad: 250, costoCalculado: 250 * (36 / 1000) }, // 9.00
      { insumoId: 'ins-leche-entera', cantidad: 1600, costoCalculado: 1600 * (28 / 1000) }, // 44.80
      { insumoId: 'ins-lechera', cantidad: 250, costoCalculado: 250 * (34 / 375) }, // 22.67
      { insumoId: 'ins-azucar', cantidad: 80, costoCalculado: 80 * (145 / 5000) }, // 2.32
      { insumoId: 'ins-canela', cantidad: 15, costoCalculado: 15 * (35 / 100) }, // 5.25
      { insumoId: 'ins-vainilla', cantidad: 10, costoCalculado: 10 * (55 / 250) }, // 2.20
      { insumoId: 'ins-pasas', cantidad: 40, costoCalculado: 40 * (45 / 250) }, // 7.20
    ],
    empaques: [],
    indirectos: {
      minutosGas: 40,
      costoPorHoraGas: 14.0,
      costoGas: (40 / 60) * 14.0, // 9.33
      minutosLuz: 10,
      costoPorHoraLuz: 7.5,
      costoLuz: (10 / 60) * 7.5, // 1.25
      minutosManoObra: 25,
      costoPorHoraManoObra: 65.0,
      costoManoObra: (25 / 60) * 65.0, // 27.08
      otrosCostosFijos: 2.9,
    },
    costoIngredientes: 93.44,
    costoEmpaques: 0,
    costoIndirectos: 40.56,
    costoTotalReceta: 134.0, // Costo total tanda 2000 ml
    costoPorUnidad: 134.0 / 2000, // 0.067 MXN por ml
    fechaCreacion: '2026-10-14',
    fechaModificacion: '2026-10-14',
    esDemostracion: true,
  },
];

const RAW_SAMPLE_PRODUCTOS: ProductoVenta[] = [
  // 1. PRODUCTO: PAY DE QUESO CON MÚLTIPLES PRESENTACIONES
  {
    id: 'prod-pay-queso',
    nombre: 'Pay de Queso Clásico',
    descripcion: 'Pay horneado tradicional. Disponible en pay entero o por rebanada individual.',
    categoria: 'Pays y Tartas',
    recetaId: 'rec-pay-queso-clasico',
    activo: true,
    esDemostracion: true,
    presentaciones: [
      {
        id: 'pres-pay-completo',
        nombre: 'Pay Completo (Molde 24cm)',
        descripcion: 'Elaborado completo, entregado con base dorada, caja con ventana y etiqueta artesanal.',
        tipoCalculo: 'fraccion',
        cantidadOVolumen: 1,
        unidadMedida: 'pieza',
        factorReceta: 1.0, // 100% de la receta
        empaques: [
          { insumoId: 'ins-caja-pay', cantidad: 1, nombre: 'Caja con Ventana 26cm', costoUnitario: 8.60, costoTotal: 8.60 },
          { insumoId: 'ins-base-dorada', cantidad: 1, nombre: 'Base Dorada 26cm', costoUnitario: 4.40, costoTotal: 4.40 },
          { insumoId: 'ins-etiqueta-logo', cantidad: 1, nombre: 'Etiqueta con Logo', costoUnitario: 0.75, costoTotal: 0.75 },
        ],
        costoBaseReceta: 142.0, // 100% de $142.00
        costoEmpaqueTotal: 13.75, // Únicamente sus propios empaques: 8.60 + 4.40 + 0.75
        costoUnitarioTotal: 155.75, // 142.00 + 13.75
        margenDeseadoPct: 40,
        precioSugerido: 155.75 / (1 - 0.40), // 155.75 / 0.60 = 259.58
        precioVentaReal: 180.0, // PRECIO REQUERIDO: $180 MXN
        // Métricas antes de empaque (si el costo total considerado fuera los $142 de elaboración):
        gananciaAntesEmpaque: 180.0 - 142.0, // $38.00 MXN
        margenAntesEmpaquePct: ((180.0 - 142.0) / 180.0) * 100, // 21.1111% -> 21.11%
        // Métricas finales con empaques propios incluidos ($155.75):
        gananciaPorUnidad: 180.0 - 155.75, // $24.25 MXN
        margenRealPct: ((180.0 - 155.75) / 180.0) * 100, // 13.4722% -> 13.47%
        recargoSobreCostoPct: ((180.0 - 155.75) / 155.75) * 100, // 15.57% (Markup)
        stockListo: 2,
        activo: true,
      },
      {
        id: 'pres-pay-rebanada',
        nombre: 'Rebanada Individual',
        descripcion: '1 de 8 rebanadas, servida en domo individual con tenedor, servilleta y sticker.',
        tipoCalculo: 'porciones',
        cantidadOVolumen: 1,
        unidadMedida: 'rebanada',
        rebanadasTotalesPorReceta: 8, // Se obtienen 8 rebanadas de 1 pay ($142 / 8 = $17.75)
        factorReceta: 1 / 8, // 0.125 de la receta
        empaques: [
          { insumoId: 'ins-domo-rebanada', cantidad: 1, nombre: 'Domo Triangular', costoUnitario: 2.50, costoTotal: 2.50 },
          { insumoId: 'ins-tenedor-servilleta', cantidad: 1, nombre: 'Kit Tenedor + Servilleta', costoUnitario: 0.85, costoTotal: 0.85 },
          { insumoId: 'ins-etiqueta-logo', cantidad: 1, nombre: 'Etiqueta con Logo', costoUnitario: 0.75, costoTotal: 0.75 },
        ],
        costoBaseReceta: 142.0 / 8, // $17.75 MXN por rebanada antes de empaques
        costoEmpaqueTotal: 4.10, // Únicamente sus propios empaques: 2.50 + 0.85 + 0.75
        costoUnitarioTotal: 21.85, // 17.75 + 4.10
        margenDeseadoPct: 45,
        precioSugerido: 21.85 / (1 - 0.45), // 21.85 / 0.55 = 39.73
        precioVentaReal: 40.0, // PRECIO REQUERIDO: $40 MXN
        // Métricas antes de empaque ($17.75 base y $40 venta):
        gananciaAntesEmpaque: 40.0 - 17.75, // $22.25 MXN
        margenAntesEmpaquePct: ((40.0 - 17.75) / 40.0) * 100, // Exactamente 55.625%
        // Métricas finales con empaques propios incluidos ($21.85):
        gananciaPorUnidad: 40.0 - 21.85, // $18.15 MXN
        margenRealPct: ((40.0 - 21.85) / 40.0) * 100, // 45.375% -> 45.38%
        recargoSobreCostoPct: ((40.0 - 21.85) / 21.85) * 100, // 83.07% (Markup)
        stockListo: 8,
        activo: true,
      },
    ],
  },

  // 2. PRODUCTO: ARROZ CON LECHE CON MÚLTIPLES PRESENTACIONES POR VOLUMEN
  {
    id: 'prod-arroz-con-leche',
    nombre: 'Arroz con Leche Casero',
    descripcion: 'Arroz con leche tradicional en presentaciones por volumen de medio litro y vaso individual de 6 oz.',
    categoria: 'Postres Tradicionales',
    recetaId: 'rec-arroz-con-leche',
    activo: true,
    esDemostracion: true,
    presentaciones: [
      {
        id: 'pres-arroz-medio-litro',
        nombre: 'Medio Litro (500 ml)',
        descripcion: 'Envase térmico de 500 ml ideal para compartir en casa.',
        tipoCalculo: 'volumen_ml',
        cantidadOVolumen: 500, // 500 ml
        unidadMedida: 'ml',
        factorReceta: 500 / 2000, // 0.25 (500 ml / 2000 ml utilizables = 25%)
        empaques: [
          { insumoId: 'ins-envase-500ml', cantidad: 1, nombre: 'Envase Térmico 500ml', costoUnitario: 3.00, costoTotal: 3.00 },
          { insumoId: 'ins-tapa-500ml', cantidad: 1, nombre: 'Tapa Plástica 500ml', costoUnitario: 1.50, costoTotal: 1.50 },
          { insumoId: 'ins-cuchara-bio', cantidad: 2, nombre: '2 Cucharas Biodegradables', costoUnitario: 0.65, costoTotal: 1.30 },
          { insumoId: 'ins-etiqueta-logo', cantidad: 1, nombre: 'Etiqueta con Logo', costoUnitario: 0.75, costoTotal: 0.75 },
        ],
        costoBaseReceta: 134.0 * (500 / 2000), // 134.0 * 0.25 = $33.50 MXN (a $0.067/ml)
        costoEmpaqueTotal: 6.55, // Únicamente sus empaques: 3.00 + 1.50 + 1.30 + 0.75
        costoUnitarioTotal: 40.05, // 33.50 + 6.55
        margenDeseadoPct: 50,
        precioSugerido: 40.05 / (1 - 0.50), // 40.05 / 0.50 = $80.10 MXN
        precioVentaReal: 75.0, // $75.00 MXN
        gananciaAntesEmpaque: 75.0 - 33.50, // $41.50 MXN
        margenAntesEmpaquePct: ((75.0 - 33.50) / 75.0) * 100, // 55.33%
        gananciaPorUnidad: 75.0 - 40.05, // $34.95 MXN
        margenRealPct: ((75.0 - 40.05) / 75.0) * 100, // 46.60%
        recargoSobreCostoPct: ((75.0 - 40.05) / 40.05) * 100, // 87.27% (Markup)
        stockListo: 4,
        activo: true,
      },
      {
        id: 'pres-arroz-vaso-6oz',
        nombre: 'Vaso de 6 oz (~177.4 ml)',
        descripcion: 'Porción individual en vaso transparente de 6 onzas líquidas con tapa domo y cuchara.',
        tipoCalculo: 'volumen_ml',
        cantidadOVolumen: 177.4, // 6 fl oz = 177.4 ml
        unidadMedida: 'vaso 6 oz',
        factorReceta: 177.4 / 2000, // 0.0887 (177.4 ml / 2000 ml utilizables)
        empaques: [
          { insumoId: 'ins-vaso-6oz', cantidad: 1, nombre: 'Vaso 6 oz', costoUnitario: 1.30, costoTotal: 1.30 },
          { insumoId: 'ins-tapa-6oz', cantidad: 1, nombre: 'Tapa Domo 6 oz', costoUnitario: 0.90, costoTotal: 0.90 },
          { insumoId: 'ins-cuchara-bio', cantidad: 1, nombre: 'Cuchara Biodegradable', costoUnitario: 0.65, costoTotal: 0.65 },
          { insumoId: 'ins-etiqueta-logo', cantidad: 1, nombre: 'Etiqueta con Logo', costoUnitario: 0.75, costoTotal: 0.75 },
        ],
        costoBaseReceta: 134.0 * (177.4 / 2000), // 134.0 * 0.0887 = $11.8858 MXN (~$11.89 MXN)
        costoEmpaqueTotal: 3.60, // Únicamente sus empaques: 1.30 + 0.90 + 0.65 + 0.75
        costoUnitarioTotal: 15.4858, // 11.8858 + 3.60 = 15.4858 MXN (~$15.49 MXN)
        margenDeseadoPct: 50,
        precioSugerido: 15.4858 / (1 - 0.50), // 15.4858 / 0.50 = $30.97 ~ $31.00 MXN
        precioVentaReal: 30.0, // $30.00 MXN
        gananciaAntesEmpaque: 30.0 - 11.8858, // $18.1142 MXN (~$18.11 MXN)
        margenAntesEmpaquePct: ((30.0 - 11.8858) / 30.0) * 100, // 60.38%
        gananciaPorUnidad: 30.0 - 15.4858, // $14.5142 MXN (~$14.51 MXN)
        margenRealPct: ((30.0 - 15.4858) / 30.0) * 100, // 48.38%
        recargoSobreCostoPct: ((30.0 - 15.4858) / 15.4858) * 100, // 93.72% (Markup)
        stockListo: 6,
        activo: true,
      },
    ],
  },
];

export const SAMPLE_PRODUCTOS: ProductoVenta[] = RAW_SAMPLE_PRODUCTOS.map((p) => ({
  ...p,
  esDemostracion: true,
  presentaciones: (p.presentaciones || []).map((pr) => ({
    ...pr,
    esDemostracion: true,
  })),
}));

export const SAMPLE_GASTOS: Gasto[] = [
  {
    id: 'gst-01',
    fecha: '2026-10-12',
    descripcion: 'Recarga tanque de Gas LP 20kg para taller',
    categoriaId: 'cat-gas',
    categoriaNombre: 'Gas LP y Horno',
    importe: 395.0,
    formaPago: 'efectivo',
    ambito: 'negocio',
    tipoGastoNegocio: 'operativo_fijo',
    notas: 'Para producción del mes',
    esDemostracion: true,
  },
  {
    id: 'gst-02',
    fecha: '2026-10-13',
    descripcion: 'Pauta en Instagram para venta de pays y vasitos',
    categoriaId: 'cat-publicidad',
    categoriaNombre: 'Publicidad y Redes Sociales',
    importe: 180.0,
    formaPago: 'tarjeta_debito',
    ambito: 'negocio',
    tipoGastoNegocio: 'operativo_fijo',
    notas: 'Promoción fin de semana',
    esDemostracion: true,
  },
  {
    id: 'gst-03',
    fecha: '2026-10-14',
    descripcion: 'Despensa familiar semanal',
    categoriaId: 'cat-despensa-personal',
    categoriaNombre: 'Despensa y Alimentos del Hogar',
    importe: 680.0,
    formaPago: 'tarjeta_debito',
    ambito: 'personal',
    notas: 'Gasto del hogar',
    esDemostracion: true,
  },
];

export const SAMPLE_VENTAS: Venta[] = [
  {
    id: 'vta-01',
    fecha: '2026-10-13',
    cliente: 'Ana Martínez (Oficina)',
    productoId: 'prod-pay-queso',
    productoNombre: 'Pay de Queso Clásico',
    presentacionId: 'pres-pay-rebanada',
    presentacionNombre: 'Rebanada Individual',
    cantidad: 6,
    precioUnitario: 40.0,
    descuento: 0,
    totalVenta: 240.0, // 6 x $40
    costoTotalVendido: 6 * 21.85, // 131.10
    utilidadEstimada: 240.0 - 131.10, // 108.90
    estadoCobro: 'cobrada',
    formaPago: 'transferencia',
    fechaCobro: '2026-10-13',
    notas: '6 rebanadas para café en oficina',
    esDemostracion: true,
  },
  {
    id: 'vta-02',
    fecha: '2026-10-14',
    cliente: 'Carlos Mendoza',
    productoId: 'prod-pay-queso',
    productoNombre: 'Pay de Queso Clásico',
    presentacionId: 'pres-pay-completo',
    presentacionNombre: 'Pay Completo (Molde 24cm)',
    cantidad: 1,
    precioUnitario: 180.0,
    descuento: 0,
    totalVenta: 180.0,
    costoTotalVendido: 155.75,
    utilidadEstimada: 180.0 - 155.75, // 24.25
    estadoCobro: 'cobrada',
    formaPago: 'efectivo',
    fechaCobro: '2026-10-14',
    notas: 'Cumpleaños familiar',
    esDemostracion: true,
  },
  {
    id: 'vta-03',
    fecha: '2026-10-14',
    cliente: 'Mariana Gómez',
    productoId: 'prod-arroz-con-leche',
    productoNombre: 'Arroz con Leche Casero',
    presentacionId: 'pres-arroz-vaso-6oz',
    presentacionNombre: 'Vaso de 6 oz (~177.4 ml)',
    cantidad: 4,
    precioUnitario: 30.0,
    descuento: 0,
    totalVenta: 120.0, // 4 x $30
    costoTotalVendido: 4 * 15.49, // 61.96
    utilidadEstimada: 120.0 - 61.96, // 58.04
    estadoCobro: 'cobrada',
    formaPago: 'efectivo',
    fechaCobro: '2026-10-14',
    notas: 'Venta de mostrador',
    esDemostracion: true,
  },
  {
    id: 'vta-04',
    fecha: '2026-10-14',
    cliente: 'Familia Ramírez',
    productoId: 'prod-arroz-con-leche',
    productoNombre: 'Arroz con Leche Casero',
    presentacionId: 'pres-arroz-medio-litro',
    presentacionNombre: 'Medio Litro (500 ml)',
    cantidad: 2,
    precioUnitario: 75.0,
    descuento: 0,
    totalVenta: 150.0,
    costoTotalVendido: 2 * 40.05, // 80.10
    utilidadEstimada: 150.0 - 80.10, // 69.90
    estadoCobro: 'pendiente',
    notas: 'Entrega hoy por la tarde',
    esDemostracion: true,
  },
];
