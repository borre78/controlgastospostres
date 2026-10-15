/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { IngredientsView } from './components/ingredients/IngredientsView';
import { RecipesView } from './components/recipes/RecipesView';
import { ProductsView } from './components/products/ProductsView';
import { SalesView } from './components/sales/SalesView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AuthGate } from './components/auth/AuthGate';
import { MigracionFirebaseView } from './components/admin/MigracionFirebaseView';
import { AdminUsuariosView } from './components/admin/AdminUsuariosView';

function MainApp() {
  const [activeTab, setActiveTab] = useState(() => {
  return localStorage.getItem('activeTab') || 'dashboard';
});
useEffect(() => {
  localStorage.setItem('activeTab', activeTab);
}, [activeTab]);
  const { isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Cargando Control de Gastos y Costos...</p>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'expenses':
        return <ExpensesView />;
      case 'ingredients':
        return <IngredientsView />;
      case 'recipes':
        return <RecipesView />;
      case 'products':
        return <ProductsView />;
      case 'sales':
        return <SalesView />;
      case 'inventory':
        return <InventoryView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'migration':
        return <MigracionFirebaseView />;      
      case 'users':
            return <AdminUsuariosView />;
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Barra superior de navegación */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenedor Principal con Sidebar y Área de Contenido */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full min-w-0 mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Vista activa del módulo */}
        
        <main
          style={{
            width: '100%',
            flex: '1 1 auto',
            alignSelf: 'stretch',
            maxWidth: '100%',
            minWidth: 0,
          }}
          className="p-3.5 sm:p-6 lg:p-8 overflow-x-hidden pb-20 lg:pb-8">
          {renderActiveModule()}
        </main>
      </div>

      {/* Indicador de estado offline cuando no hay conexión */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthGate>
  );
}
