import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Building,
  User,
  ArrowUpDown,
  Tag,
  DollarSign,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Gasto, FormaPago, TipoAmbito } from '../../types';
import { formatMXN, formatFecha, getFechaHoy } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ExpensesView: React.FC = () => {
  const { gastos, categorias, addGasto, updateGasto, deleteGasto } = useApp();

  // Estados de filtrado y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroAmbito, setFiltroAmbito] = useState<TipoAmbito | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroFormaPago, setFiltroFormaPago] = useState<string>('todas');
  

  const [filtroPeriodo, setFiltroPeriodo] = useState<
    'todos' | 'hoy' | 'semana' | 'quincena' | 'mes' | 'anio' | 'personalizado'
  >('todos');

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  // Form State
  const [formFecha, setFormFecha] = useState(getFechaHoy);
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formImporte, setFormImporte] = useState('');
  const [formFormaPago, setFormFormaPago] = useState<FormaPago>('efectivo');
  const [formAmbito, setFormAmbito] = useState<TipoAmbito>('negocio');
  const [formTipoNegocio, setFormTipoNegocio] = useState<Gasto['tipoGastoNegocio']>('operativo_fijo');
  const [formNotas, setFormNotas] = useState('');

  // Diálogo de eliminación
  const [gastoAEliminar, setGastoAEliminar] = useState<Gasto | null>(null);

  // Categorías según ámbito del formulario
  const categoriasDisponibles = useMemo(() => {
    return categorias.filter((c) => c.ambito === formAmbito);
  }, [categorias, formAmbito]);

  // Al abrir para nuevo
  const handleOpenNuevo = () => {
    setEditingGasto(null);
    setFormFecha(getFechaHoy());
    setFormDescripcion('');
    setFormAmbito('negocio');
    setFormTipoNegocio('operativo_fijo');
    const firstCat = categorias.find((c) => c.ambito === 'negocio');
    setFormCategoriaId(firstCat ? firstCat.id : '');
    setFormImporte('');
    setFormFormaPago('efectivo');
    setFormNotas('');
    setIsModalOpen(true);
  };

  // Al abrir para editar
  const handleOpenEditar = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setFormFecha(gasto.fecha);
    setFormDescripcion(gasto.descripcion);
    setFormAmbito(gasto.ambito);
    setFormTipoNegocio(gasto.tipoGastoNegocio || 'operativo_fijo');
    setFormCategoriaId(gasto.categoriaId);
    setFormImporte(String(gasto.importe));
    setFormFormaPago(gasto.formaPago);
    setFormNotas(gasto.notas || '');
    setIsModalOpen(true);
  };

  // Guardar formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const importeNum = parseFloat(formImporte);
    if (!formDescripcion.trim() || isNaN(importeNum) || importeNum <= 0) {
      alert('Por favor introduce una descripción válida y un importe mayor a cero.');
      return;
    }

    const catObj = categorias.find((c) => c.id === formCategoriaId);
    const categoriaNombre = catObj ? catObj.nombre : 'General';

    if (editingGasto) {
      updateGasto(editingGasto.id, {
        fecha: formFecha,
        descripcion: formDescripcion.trim(),
        categoriaId: formCategoriaId,
        categoriaNombre,
        importe: importeNum,
        formaPago: formFormaPago,
        ambito: formAmbito,
        tipoGastoNegocio: formAmbito === 'negocio' ? formTipoNegocio : undefined,
        notas: formNotas.trim() || undefined,
      });
    } else {
      addGasto({
        fecha: formFecha,
        descripcion: formDescripcion.trim(),
        categoriaId: formCategoriaId,
        categoriaNombre,
        importe: importeNum,
        formaPago: formFormaPago,
        ambito: formAmbito,
        tipoGastoNegocio: formAmbito === 'negocio' ? formTipoNegocio : undefined,
        notas: formNotas.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

   // Filtrado reactivo de gastos
  const gastosFiltrados = useMemo(() => {
    const hoy = getFechaHoy();
    const fechaHoy = new Date(`${hoy}T12:00:00`);

    const inicioSemana = new Date(fechaHoy);
    const diaSemana = (inicioSemana.getDay() + 6) % 7;
    inicioSemana.setDate(inicioSemana.getDate() - diaSemana);

    const fechaInicioSemana = [
      inicioSemana.getFullYear(),
      String(inicioSemana.getMonth() + 1).padStart(2, '0'),
      String(inicioSemana.getDate()).padStart(2, '0'),
    ].join('-');

    const diaActual = fechaHoy.getDate();

    const diaInicioQuincena = diaActual <= 15 ? 1 : 16;

    const diaFinQuincena =
      diaActual <= 15
        ? 15
        : new Date(
            fechaHoy.getFullYear(),
            fechaHoy.getMonth() + 1,
            0
          ).getDate();
        
    const fechaInicioQuincena = [
      fechaHoy.getFullYear(),
      String(fechaHoy.getMonth() + 1).padStart(2, '0'),
      String(diaInicioQuincena).padStart(2, '0'),
    ].join('-');

    const fechaFinQuincena = [
      fechaHoy.getFullYear(),
      String(fechaHoy.getMonth() + 1).padStart(2, '0'),
      String(diaFinQuincena).padStart(2, '0'),
    ].join('-');

    const inicioMes = `${hoy.slice(0, 7)}-01`;
    const inicioAnio = `${hoy.slice(0, 4)}-01-01`;

    return gastos.filter((g) => {
      // Búsqueda
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincide =
          g.descripcion.toLowerCase().includes(query) ||
          g.categoriaNombre.toLowerCase().includes(query) ||
          (g.notas && g.notas.toLowerCase().includes(query));

        if (!coincide) return false;
      }

      // Ámbito
      if (filtroAmbito !== 'todos' && g.ambito !== filtroAmbito) {
        return false;
      }

      // Categoría
      if (filtroCategoria !== 'todas' && g.categoriaId !== filtroCategoria) {
        return false;
      }

      // Forma de pago
      if (filtroFormaPago !== 'todas' && g.formaPago !== filtroFormaPago) {
        return false;
      }

      // Periodo de fechas
      switch (filtroPeriodo) {
        case 'hoy':
          if (g.fecha !== hoy) return false;
          break;

        case 'semana':
          if (g.fecha < fechaInicioSemana || g.fecha > hoy) return false;
          break;

        case 'quincena':
          if (
            g.fecha < fechaInicioQuincena ||
            g.fecha > fechaFinQuincena
          ) return false;
          break;

        case 'mes':
          if (g.fecha < inicioMes || g.fecha > hoy) return false;
          break;

        case 'anio':
          if (g.fecha < inicioAnio || g.fecha > hoy) return false;
          break;

        case 'personalizado':
          if (fechaInicio && g.fecha < fechaInicio) return false;
          if (fechaFin && g.fecha > fechaFin) return false;
          break;
      }

      return true;
    });
  }, [
    gastos,
    busqueda,
    filtroAmbito,
    filtroCategoria,
    filtroFormaPago,
    filtroPeriodo,
    fechaInicio,
    fechaFin,
  ]);

  // Totales de la lista filtrada
  const totalFiltrado = gastosFiltrados.reduce((sum, g) => sum + g.importe, 0);
  const totalNegocio = gastosFiltrados
    .filter((g) => g.ambito === 'negocio')
    .reduce((sum, g) => sum + g.importe, 0);
  const totalPersonal = gastosFiltrados
    .filter((g) => g.ambito === 'personal')
    .reduce((sum, g) => sum + g.importe, 0);

  const getFormaPagoLabel = (fp: FormaPago) => {
    switch (fp) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta_debito':
        return 'T. Débito';
      case 'tarjeta_credito':
        return 'T. Crédito';
      case 'transferencia':
        return 'Transferencia';
      default:
        return 'Otro';
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado y Botón Nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-500" />
            Control de Gastos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registra y categoriza cada desembolso de tu repostería o personal
          </p>
        </div>

        <button
          onClick={handleOpenNuevo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Resumen de totales filtrados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Gastos Filtrados:
          </span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatMXN(totalFiltrado)}
          </p>
          <span className="text-[11px] text-slate-400">{gastosFiltrados.length} registros</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Building className="w-3.5 h-3.5" />
            <span>Negocio de Postres:</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatMXN(totalNegocio)}
          </p>
          <span className="text-[11px] text-slate-400">Insumos y operación de taller</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <User className="w-3.5 h-3.5" />
            <span>Gastos Personales:</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatMXN(totalPersonal)}
          </p>
          <span className="text-[11px] text-slate-400">Despensa, casa y personales</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Búsqueda */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descripción, nota o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Filtro Ámbito */}
          <div>
            <select
              value={filtroAmbito}
              onChange={(e) => setFiltroAmbito(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="todos">Todos los ámbitos</option>
              <option value="negocio">Solo Negocio</option>
              <option value="personal">Solo Personal</option>
            </select>
          </div>

          {/* Filtro Categoría */}
          <div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.ambito === 'negocio' ? 'Negocio' : 'Personal'})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Forma Pago */}
          <div>
            <select
              value={filtroFormaPago}
              onChange={(e) => setFiltroFormaPago(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="todas">Forma de Pago (Todas)</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta_debito">Tarjeta Débito</option>
              <option value="tarjeta_credito">Tarjeta Crédito</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Periodo de gastos
            </label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value as typeof filtroPeriodo)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="todos">Todos los periodos</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="quincena">Esta Quincena</option>
              <option value="mes">Este mes</option>
              <option value="anio">Este año</option>
              <option value="personalizado">Periodo personalizado</option>
            </select>
          </div>
                  
          {filtroPeriodo === 'personalizado' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  max={fechaFin || undefined}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
          
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </>
          )}
        </div>

      </div>

      {/* Tabla de Registros de Gastos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ámbito</th>
                <th className="py-3 px-4">Forma de Pago</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron gastos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto) => (
                  <tr
                    key={gasto.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {formatFecha(gasto.fecha, true)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {gasto.descripcion}
                        </span>
                        {gasto.esDemostracion ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
                            Ejemplo Demo
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                            Dato Real
                          </span>
                        )}
                      </div>
                      {gasto.notas && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {gasto.notas}
                        </p>
                      )}
                      {gasto.tipoGastoNegocio === 'inventario_materia_prima' && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                          Inventario de Insumos
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {gasto.categoriaNombre}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          gasto.ambito === 'negocio'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {gasto.ambito === 'negocio' ? 'Negocio' : 'Personal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {getFormaPagoLabel(gasto.formaPago)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-black text-rose-600 dark:text-rose-400">
                      {formatMXN(gasto.importe)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditar(gasto)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Editar gasto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setGastoAEliminar(gasto)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Gasto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
        subtitle="Completa los datos del desembolso en moneda mexicana MXN"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ámbito Selector (Negocio vs Personal) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ¿A qué corresponde este gasto? *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormAmbito('negocio');
                  const firstCat = categorias.find((c) => c.ambito === 'negocio');
                  if (firstCat) setFormCategoriaId(firstCat.id);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  formAmbito === 'negocio'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Negocio de Postres</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormAmbito('personal');
                  const firstCat = categorias.find((c) => c.ambito === 'personal');
                  if (firstCat) setFormCategoriaId(firstCat.id);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  formAmbito === 'personal'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Gasto Personal</span>
              </button>
            </div>
          </div>

          {/* Si es Negocio: Clasificación de tipo */}
          {formAmbito === 'negocio' && (
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                Tipo contable de gasto del negocio:
              </label>
              <select
                value={formTipoNegocio}
                onChange={(e) => setFormTipoNegocio(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
              >
                <option value="operativo_fijo">
                  Gasto Operativo Fijo (Gas, Luz, Renta, Gasolina, Publicidad)
                </option>
                <option value="inventario_materia_prima">
                  Compra de Ingredientes / Empaques (Pasa a Inventario)
                </option>
                <option value="activo_equipo">
                  Equipo / Utensilios de Larga Duración (Batidora, Horno)
                </option>
              </select>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                {formTipoNegocio === 'inventario_materia_prima'
                  ? 'Nota: Las compras de ingredientes se reflejan en el flujo de caja, y se costean en recetas cuando vendes.'
                  : 'Este gasto se restará como costo fijo mensual de tu taller.'}
              </p>
            </div>
          )}

          {/* Fecha e Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del Gasto *
              </label>
              <input
                type="date"
                required
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Importe ($ MXN) *
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
                  value={formImporte}
                  onChange={(e) => setFormImporte(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción del Gasto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Recarga gas LP 20kg, o Compra 5kg azúcar Zulka"
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Categoría y Forma de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formCategoriaId}
                onChange={(e) => setFormCategoriaId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {categoriasDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pago *
              </label>
              <select
                value={formFormaPago}
                onChange={(e) => setFormFormaPago(e.target.value as FormaPago)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_debito">Tarjeta de Débito</option>
                <option value="tarjeta_credito">Tarjeta de Crédito</option>
                <option value="transferencia">Transferencia SPEI</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Proveedor, factura, comprobante o detalles..."
              value={formNotas}
              onChange={(e) => setFormNotas(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Botones de acción */}
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
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition active:scale-95"
            >
              {editingGasto ? 'Guardar Cambios' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmación para Eliminar */}
      {gastoAEliminar && (
        <ConfirmDialog
          isOpen={!!gastoAEliminar}
          onClose={() => setGastoAEliminar(null)}
          onConfirm={() => {
            deleteGasto(gastoAEliminar.id);
            setGastoAEliminar(null);
          }}
          title="Eliminar Gasto"
          message={`¿Estás seguro de que deseas eliminar el registro "${gastoAEliminar.descripcion}" por ${formatMXN(gastoAEliminar.importe)}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar Gasto"
          isDestructive={true}
        />
      )}
    </div>
  );
};
