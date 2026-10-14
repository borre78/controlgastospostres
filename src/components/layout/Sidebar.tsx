import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Apple,
  UtensilsCrossed,
  Tag,
  ShoppingBag,
  Boxes,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { insumos, ventas } = useApp();

  // Insumos con bajo stock para alertar al usuario
  const insumosBajoStock = insumos.filter((i) => i.stockActual <= i.stockMinimo).length;
  // Ventas pendientes de cobro
  const ventasPendientes = ventas.filter((v) => v.estadoCobro === 'pendiente').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Panel Principal',
      shortLabel: 'Panel',
      icon: LayoutDashboard,
    },
    {
      id: 'expenses',
      label: 'Control de Gastos',
      shortLabel: 'Gastos',
      icon: Receipt,
    },
    {
      id: 'ingredients',
      label: 'Catálogo de Insumos',
      shortLabel: 'Insumos',
      icon: Apple,
      badge: insumosBajoStock > 0 ? insumosBajoStock : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'recipes',
      label: 'Recetas y Costeo',
      shortLabel: 'Recetas',
      icon: UtensilsCrossed,
    },
    {
      id: 'products',
      label: 'Productos y Precios',
      shortLabel: 'Productos',
      icon: Tag,
    },
    {
      id: 'sales',
      label: 'Registro de Ventas',
      shortLabel: 'Ventas',
      icon: ShoppingBag,
      badge: ventasPendientes > 0 ? ventasPendientes : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'inventory',
      label: 'Inventario y Hornear',
      shortLabel: 'Inventario',
      icon: Boxes,
    },
    {
      id: 'reports',
      label: 'Reportes y Finanzas',
      shortLabel: 'Reportes',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Configuración',
      shortLabel: 'Ajustes',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-1 select-none">
        <div className="pb-2">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Módulos del Sistema
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                      isActive ? 'bg-amber-700/80' : item.badgeColor || 'bg-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tip Informativo en Sidebar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Regla Financiera</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              Las compras de ingredientes son desembolsos. El costo del postre solo se descuenta de tu utilidad cuando realmente lo vendes.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Pills (Horizontal Scroll for iPhone/Android) */}
      <div className="lg:hidden sticky top-16 z-20 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 shadow-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.shortLabel}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full text-white ${
                    isActive ? 'bg-amber-700' : item.badgeColor || 'bg-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
