import { CategoriaGasto, ConfiguracionApp } from '../types';

export const CATEGORIAS_DEFAULT: CategoriaGasto[] = [
  // Categorías de Negocio (Postres y Repostería)
  {
    id: 'cat-ingredientes',
    nombre: 'Ingredientes y Materia Prima',
    ambito: 'negocio',
    color: '#f97316', // Orange
    esFija: true,
  },
  {
    id: 'cat-empaques',
    nombre: 'Empaques, Cajas y Desechables',
    ambito: 'negocio',
    color: '#06b6d4', // Cyan
    esFija: true,
  },
  {
    id: 'cat-gas',
    nombre: 'Gas LP y Horno',
    ambito: 'negocio',
    color: '#ef4444', // Red
    esFija: true,
  },
  {
    id: 'cat-luz',
    nombre: 'Electricidad y Refrigeración',
    ambito: 'negocio',
    color: '#eab308', // Yellow
    esFija: true,
  },
  {
    id: 'cat-transporte-negocio',
    nombre: 'Transporte y Envíos',
    ambito: 'negocio',
    color: '#3b82f6', // Blue
    esFija: true,
  },
  {
    id: 'cat-publicidad',
    nombre: 'Publicidad y Redes Sociales',
    ambito: 'negocio',
    color: '#ec4899', // Pink
    esFija: true,
  },
  {
    id: 'cat-utensilios',
    nombre: 'Utensilios, Moldes y Mantenimiento',
    ambito: 'negocio',
    color: '#8b5cf6', // Purple
    esFija: true,
  },
  {
    id: 'cat-otros-negocio',
    nombre: 'Otros Gastos de Negocio',
    ambito: 'negocio',
    color: '#64748b', // Slate
    esFija: true,
  },

  // Categorías Personales
  {
    id: 'cat-despensa-personal',
    nombre: 'Despensa y Alimentos del Hogar',
    ambito: 'personal',
    color: '#10b981', // Emerald
    esFija: true,
  },
  {
    id: 'cat-vivienda',
    nombre: 'Vivienda y Renta Personal',
    ambito: 'personal',
    color: '#6366f1', // Indigo
    esFija: true,
  },
  {
    id: 'cat-servicios-hogar',
    nombre: 'Servicios del Hogar (Agua, Internet)',
    ambito: 'personal',
    color: '#14b8a6', // Teal
    esFija: true,
  },
  {
    id: 'cat-transporte-personal',
    nombre: 'Transporte Personal y Gasolina',
    ambito: 'personal',
    color: '#0284c7', // Sky
    esFija: true,
  },
  {
    id: 'cat-salud',
    nombre: 'Salud y Farmacia',
    ambito: 'personal',
    color: '#f43f5e', // Rose
    esFija: true,
  },
  {
    id: 'cat-entretenimiento',
    nombre: 'Entretenimiento y Recreación',
    ambito: 'personal',
    color: '#a855f7', // Purple
    esFija: true,
  },
  {
    id: 'cat-otros-personal',
    nombre: 'Otros Gastos Personales',
    ambito: 'personal',
    color: '#94a3b8', // Gray
    esFija: true,
  },
];

export const CONFIGURACION_DEFAULT: ConfiguracionApp = {
  moneda: 'MXN',
  simboloMoneda: '$',
  nombreNegocio: 'Mi Taller de Postres',
  propietario: 'Repostero(a)',
  margenGananciaDefaultPct: 50,
  costoHoraGasDefault: 14.0, // $14 MXN por hora promedio de horno en México
  costoHoraLuzDefault: 7.5,  // $7.50 MXN por hora de consumo eléctrico promedio
  costoHoraManoObraDefault: 65.0, // $65 MXN por hora de mano de obra
  tema: 'light',
  modoPersistencia: 'local',
};
