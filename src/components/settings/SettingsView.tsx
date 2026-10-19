import React, { useState, useRef } from 'react';
import {
  Settings,
  Database,
  Moon,
  Sun,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
  Cloud,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoriaGasto, TipoAmbito } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const {
    configuracion,
    updateConfiguracion,
    categorias,
    addCategoria,
    deleteCategoria,
    cargarDatosEjemplo,
    limpiarSoloEjemplosDemostracion,
    reiniciarDatos,
    exportarRespaldoJSON,
    importarRespaldoJSON,
    insumos,
    recetas,
    ventas,
    gastos,
  } = useApp();

  // Estados de Configuración
  const [nombreNegocio, setNombreNegocio] = useState(configuracion.nombreNegocio);
  const [propietario, setPropietario] = useState(configuracion.propietario);
  const [margenDefault, setMargenDefault] = useState(String(configuracion.margenGananciaDefaultPct));
  const [costoGas, setCostoGas] = useState(String(configuracion.costoHoraGasDefault));
  const [costoLuz, setCostoLuz] = useState(String(configuracion.costoHoraLuzDefault));
  const [costoMano, setCostoMano] = useState(String(configuracion.costoHoraManoObraDefault));
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [frecuenciaRevisionStock, setFrecuenciaRevisionStock] = useState<'semanal' | 'quincenal' | 'mensual' | 'personalizada'>
    (configuracion.frecuenciaRevisionStock ?? 'quincenal');  
  const [diasRevisionStock, setDiasRevisionStock] = useState(String(configuracion.diasRevisionStock ?? 15));

  // Modal Nueva Categoría
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catNombre, setCatNombre] = useState('');
  const [catAmbito, setCatAmbito] = useState<TipoAmbito>('negocio');
  const [catColor, setCatColor] = useState('#f97316');

  // Diálogos de Confirmación
  const [confirmCargarEjemplo, setConfirmCargarEjemplo] = useState(false);
  const [confirmLimpiarEjemplos, setConfirmLimpiarEjemplos] = useState(false);
  const [confirmReiniciar, setConfirmReiniciar] = useState(false);
  const [catAEliminar, setCatAEliminar] = useState<CategoriaGasto | null>(null);

  // File Input Ref para Restaurar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleGuardarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfiguracion({
      nombreNegocio: nombreNegocio.trim() || 'Mi Taller de Postres',
      propietario: propietario.trim() || 'Repostero(a)',
      margenGananciaDefaultPct: parseFloat(margenDefault) || 50,
      costoHoraGasDefault: parseFloat(costoGas) || 14,
      costoHoraLuzDefault: parseFloat(costoLuz) || 7.5,
      costoHoraManoObraDefault: parseFloat(costoMano) || 65,
      frecuenciaRevisionStock,
      diasRevisionStock: Math.max(
        1,
        parseInt(diasRevisionStock, 10) || 15
      ),
    });
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2000);
  };

  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNombre.trim()) return;
    addCategoria({
      nombre: catNombre.trim(),
      ambito: catAmbito,
      color: catColor,
    });
    setCatNombre('');
    setIsCatModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importarRespaldoJSON(content);
        setImportStatus(res.mensaje);
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Configuración del Sistema
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Parámetros de costos, moneda mexicana MXN, tema y almacenamiento seguro
        </p>
      </div>

      {/* 1. INFORMACIÓN SOBRE ALMACENAMIENTO Y PRIVACIDAD DE DATOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              Almacenamiento Local Seguro (Offline-First)
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                Activo
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>¿Dónde se guardan tus datos?</strong> Tus gastos, recetas, insumos y ventas se almacenan de manera local y privada en la memoria de este navegador web (LocalStorage / IndexedDB). No se envían a servidores externos y la app funciona 100% sin conexión a internet.
            </p>
          </div>
        </div>

        {/* Limitación y preparación para Base de Datos en la Nube */}
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Preparación para Base de Datos en la Nube (Cloud Ready):</span>
          </div>
          <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            <strong>Limitación actual:</strong> Al estar guardados en este dispositivo, si borras el caché del navegador o cambias de celular sin exportar un respaldo, los datos podrían perderse. La estructura de datos ya está tipada y normalizada para conectarse a una base de datos segura en la nube (como Firebase Firestore o Cloud SQL PostgreSQL) cuando desees sincronización en tiempo real entre múltiples dispositivos.
          </p>
        </div>

        {/* Respaldo y Restauración */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportarRespaldoJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Descargar Copia de Seguridad (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Restaurar Copia de Seguridad</span>
          </button>

          {importStatus && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {importStatus}
            </span>
          )}
        </div>
      </div>

      {/* 2. PARÁMETROS GENERALES DEL NEGOCIO */}
      <form onSubmit={handleGuardarConfig} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
          Parámetros Financieros y de Costeo
        </h3>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Revisión de inventario
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Define cada cuánto revisarás los insumos y sus existencias.
            </p>
          </div>
                
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Frecuencia de revisión
              </label>
                
              <select
                value={frecuenciaRevisionStock}
                onChange={(e) =>
                  setFrecuenciaRevisionStock(
                    e.target.value as
                      | 'semanal'
                      | 'quincenal'
                      | 'mensual'
                      | 'personalizada'
                  )
                }
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="semanal">Cada semana (7 días)</option>
                <option value="quincenal">Cada 15 días</option>
                <option value="mensual">Cada mes (30 días)</option>
                <option value="personalizada">Personalizada</option>
              </select>
            </div>
              
            {frecuenciaRevisionStock === 'personalizada' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de días
                </label>
            
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={diasRevisionStock}
                  onChange={(e) => setDiasRevisionStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de tu Negocio / Taller
            </label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Propietario(a) / Repostero(a)
            </label>
            <input
              type="text"
              value={propietario}
              onChange={(e) => setPropietario(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Moneda Oficial
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Pesos Mexicanos (MXN)
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Margen Deseado Predeterminado (%)
            </label>
            <input
              type="number"
              min="5"
              max="95"
              value={margenDefault}
              onChange={(e) => setMargenDefault(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gas LP Horno ($ MXN / hora)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={costoGas}
              onChange={(e) => setCostoGas(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mano de Obra ($ MXN / hora)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={costoMano}
              onChange={(e) => setCostoMano(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {guardadoExitoso ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Parámetros guardados
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition active:scale-95"
          >
            Guardar Configuración
          </button>
        </div>
      </form>

      {/* 3. TEMA DE APARIENCIA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
          Tema y Apariencia
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza el aspecto de la aplicación para el día o la noche
        </p>

        <div className="grid grid-cols-3 gap-2.5 max-w-sm pt-1">
          <button
            type="button"
            onClick={() => updateConfiguracion({ tema: 'light' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
              configuracion.tema === 'light'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Claro</span>
          </button>

          <button
            type="button"
            onClick={() => updateConfiguracion({ tema: 'dark' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
              configuracion.tema === 'dark'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Oscuro</span>
          </button>

          <button
            type="button"
            onClick={() => updateConfiguracion({ tema: 'system' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
              configuracion.tema === 'system'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Sistema</span>
          </button>
        </div>
      </div>

      {/* 4. GESTIÓN DE CATEGORÍAS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Categorías de Gastos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personaliza o agrega nuevas categorías para clasificar tus desembolsos
            </p>
          </div>
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800"
          >
            + Nueva Categoría
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.nombre}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {cat.ambito === 'negocio' ? 'Negocio' : 'Personal'}
                  </span>
                </div>
              </div>

              {!cat.esFija && (
                <button
                  onClick={() => setCatAEliminar(cat)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. GESTIÓN DE DATOS: EJEMPLO DIDÁCTICO Y REINICIO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
          Gestión de Datos Iniciales
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Requisito importante: La aplicación arranca con datos limpios y auténticos. Si deseas explorar las fórmulas con un ejemplo real de repostería mexicana (Pay de queso clásico horneado y brownies de chocolate), puedes cargarlo aquí con un clic.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setConfirmCargarEjemplo(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Cargar Ejemplo Didáctico de Repostería</span>
          </button>

          <button
            onClick={() => setConfirmReiniciar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reiniciar / Borrar Todos los Datos</span>
          </button>
        </div>
      </div>

      {/* Modal Nueva Categoría */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Crear Nueva Categoría de Gasto"
        maxWidth="sm"
      >
        <form onSubmit={handleCrearCategoria} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Capacitación y Cursos, Empaque Premium..."
              value={catNombre}
              onChange={(e) => setCatNombre(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ámbito *
            </label>
            <select
              value={catAmbito}
              onChange={(e) => setCatAmbito(e.target.value as TipoAmbito)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="negocio">Negocio de Postres</option>
              <option value="personal">Gasto Personal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color Distintivo
            </label>
            <input
              type="color"
              value={catColor}
              onChange={(e) => setCatColor(e.target.value)}
              className="w-full h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Crear Categoría
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogo Confirmar Cargar Ejemplo */}
      <ConfirmDialog
        isOpen={confirmCargarEjemplo}
        onClose={() => setConfirmCargarEjemplo(false)}
        onConfirm={() => {
          cargarDatosEjemplo();
          setConfirmCargarEjemplo(false);
        }}
        title="Cargar Ejemplo Didáctico de Repostería"
        message="Se cargarán insumos auténticos con precios mexicanos (queso crema, harina, mantequilla, empaques), 2 recetas completas costeadas (Pay de queso clásico y brownies), productos de venta y registros de ejemplo para probar los reportes. ¿Deseas continuar?"
        confirmText="Cargar Ejemplo"
        isDestructive={false}
      />

      {/* Diálogo Confirmar Reiniciar */}
      <ConfirmDialog
        isOpen={confirmReiniciar}
        onClose={() => setConfirmReiniciar(false)}
        onConfirm={() => {
          reiniciarDatos();
          setConfirmReiniciar(false);
        }}
        title="Reiniciar Todos los Datos"
        message="¿Estás seguro de que deseas vaciar todos los registros? Se borrarán todos los insumos, recetas, productos, gastos y ventas almacenados localmente."
        confirmText="Borrar Todo"
        isDestructive={true}
      />

      {/* Diálogo Eliminar Categoría */}
      {catAEliminar && (
        <ConfirmDialog
          isOpen={!!catAEliminar}
          onClose={() => setCatAEliminar(null)}
          onConfirm={() => {
            const ok = deleteCategoria(catAEliminar.id);
            if (!ok) {
              alert('No se puede eliminar esta categoría porque ya tiene gastos registrados.');
            }
            setCatAEliminar(null);
          }}
          title="Eliminar Categoría"
          message={`¿Deseas eliminar la categoría "${catAEliminar.nombre}"?`}
          confirmText="Eliminar"
          isDestructive={true}
        />
      )}
    </div>
  );
};
