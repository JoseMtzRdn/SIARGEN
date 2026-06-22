import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchExpedientes, 
  cerrarExpediente,
  reabrirExpediente,
  deleteExpediente 
} from '../../store/expedienteSlice';
import { fetchSeries } from '../../store/catalogoSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import { 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  Archive,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRightLeft,
  Edit2,
  Trash2,
  ChevronRight,
  Filter,
  X,
  Layers, 
  Building, 
  ChevronDown,
  CheckCircle2,
  Wrench,
  Clock
  } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpedienteForm from '../../components/tramite/ExpedienteForm';
import ExpedienteView from '../../components/tramite/ExpedienteView';
import TransferenciaForm from '../../components/tramite/TransferenciaForm';
import api from '../../api/axios';
import { alerts } from '../../utils/alerts';
import Swal from 'sweetalert2';

const ExpedientesPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.expedientes);
  const { user } = useSelector((state) => state.auth);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState('');

  const isCoordinator = user?.role?.slug === 'coord_archivos' || user?.role?.slug === 'tua';

  const fetchRecords = useCallback((force = false) => {
    const params = { per_page: -1, fase: 'tramite' };
    if (isCoordinator && selectedUnidad) {
      params.unidad_administrativa_id = selectedUnidad;
    }
    dispatch(fetchExpedientes(params));
  }, [dispatch, isCoordinator, selectedUnidad]);

  // Carga inicial de expedientes.
  useEffect(() => {
    fetchRecords();
    dispatch(fetchSeries());

    if (isCoordinator) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [dispatch, isCoordinator, fetchRecords]);

  // Actualiza expedientes al cambiar la unidad.
  useEffect(() => {
    if (isCoordinator && selectedUnidad) {
      fetchRecords();
    }
  }, [selectedUnidad, isCoordinator, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter(exp => {
      if (exp.estatus_disponibilidad === 'prestado') return false;

      // solo expedientes en fase de trámite
      if (exp.fase !== 'tramite') return false;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        exp.numero_expediente?.toLowerCase().includes(searchLower) ||
        exp.titulo?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [items, searchTerm]);

  const vencidos = useMemo(() => {
    return Array.isArray(items) ? items.filter(exp => 
      exp.vigencia_cumplida && 
      exp.estatus_disponibilidad === 'disponible' &&
      !exp.is_in_subsanacion
    ) : [];
  }, [items]);

  const handleEdit = (exp) => {
    setSelectedExpediente(exp);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar Expediente?',
      text: "Esta acción eliminará el expediente y todos sus vínculos de correspondencia de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteExpediente(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡EXPEDIENTE ELIMINADO!</span>',
          text: 'El registro ha sido borrado permanentemente del sistema.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        alerts.error(error || 'No se pudo eliminar el expediente');
      }
    }
  };

  const handleView = async (exp) => {
    if (viewLoading) return;
    setViewLoading(true);
    try {
      const response = await api.get(`/expedientes/${exp.id}`);
      setSelectedExpediente(response.data.data);
      setIsViewOpen(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alerts.error('No se pudo recuperar el detalle del expediente.');
    } finally {
      setViewLoading(false);
    }
  };

  const handleCerrarExpediente = async (id) => {
    const result = await Swal.fire({
      title: '¿Cerrar Expediente?',
      text: "Una vez cerrado, el expediente entrará en su plazo de conservación y no podrá ser editado a menos que se solicite una reapertura.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(cerrarExpediente(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡EXPEDIENTE CERRADO!</span>',
          text: 'El periodo de trámite ha concluido exitosamente.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true); // recarga forzada para sincronizar fecha_cierre y estado
      } catch (error) {
        alerts.error(error?.message || error);
      }
    }
  };

  const handleReabrirExpediente = async (id) => {
    const { value: motivo } = await Swal.fire({
      title: 'Justificación de Reapertura',
      input: 'textarea',
      inputLabel: 'Explique brevemente por qué necesita reabrir este expediente',
      inputPlaceholder: 'Escriba aquí el motivo...',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Solicitar Reapertura',
      inputValidator: (value) => {
        if (!value) return 'El motivo es obligatorio';
        if (value.length < 10) return 'Por favor, sea más descriptivo (mínimo 10 caracteres)';
      }
    });

    if (motivo) {
      try {
        await dispatch(reabrirExpediente({ id, motivo })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡EXPEDIENTE REABIERTO!</span>',
          text: 'El expediente ya puede ser editado nuevamente.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        alerts.error(error?.message || error);
      }
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header } */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Archive className="text-white" size={28} />
             </div>
             Expedientes de Trámite
          </h2>
          <p className="text-gray-500 font-bold text-lg uppercase tracking-wider">
             Control de Acervo Institucional - <span className="text-[#BC955B]">
               {isCoordinator 
                 ? (selectedUnidad ? unidades.find(u => String(u.id) === String(selectedUnidad))?.nombre : 'Todas las Unidades')
                 : user?.unidad_administrativa?.nombre
               }
             </span>
          </p>
        </div>
        
        {user?.role?.slug === 'rat' && (
          <button 
            onClick={() => {
              setSelectedExpediente(null);
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all active:scale-95 flex items-center gap-3"
          >
            <Plus size={18} />
            Aperturar Expediente
          </button>
        )}
      </div>

      {/* { alerta de vigencias cumplidas } */}
      <AnimatePresence>
        {vencidos.length > 0 && user?.role?.slug === 'rat' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
          >
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce text-white">
                   <AlertCircle size={32} />
                </div>
                <div>
                   <h4 className="text-amber-900 font-black text-xl uppercase tracking-tighter">Vigencia Documental Cumplida</h4>
                   <p className="text-amber-700 font-bold text-sm">Se han detectado <span className="underline decoration-2">{vencidos.length} expedientes</span> listos para transferencia primaria.</p>
                </div>
             </div>
             <button 
               onClick={() => setIsTransferModalOpen(true)}
               className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all flex items-center gap-3 whitespace-nowrap"
             >
                <ArrowRightLeft size={18} />
                Iniciar Transferencia Primaria
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* { buscador y filtro de unidad (solo coordinador) } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Buscar por folio o título del expediente..."
              className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {user?.role?.slug === 'coord_archivos' && (
            <div className="relative group w-full lg:w-96">
              <Building className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
              <select
                value={selectedUnidad}
                onChange={(e) => setSelectedUnidad(e.target.value)}
                className="w-full pl-16 pr-12 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase appearance-none cursor-pointer"
              >
                <option value="">Todas las Unidades</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#7A152E] transition-colors" size={20} />
            </div>
          )}
      </div>

      {/* { tabla } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
           <div className="p-32 flex flex-col items-center gap-4 text-[#7A152E]">
              <Loader2 className="animate-spin" size={48} />
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Consultando Expedientes...</span>
           </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Identificación</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Serie o Subserie Documental</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Plazo y Destino</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold">No hay registros activos en esta unidad</td>
                  </tr>
                ) : (
                  filteredRecords.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#7A152E]/5 rounded-xl flex items-center justify-center text-[#7A152E] shrink-0 border border-[#7A152E]/10">
                             <FileText size={24} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-slate-900 font-black text-sm block leading-tight uppercase tracking-tight line-clamp-2 mb-1">
                              {exp.titulo}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[#7A152E] font-bold text-[10px] bg-[#7A152E]/5 px-2 py-0.5 rounded tracking-widest border border-[#7A152E]/10">
                                {exp.numero_expediente}
                              </span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200" title="Documentos integrados">
                                 <Layers size={10} className="text-slate-400" />
                                 <span className="text-[9px] font-black text-slate-600">{exp.documentos_count || 0}</span>
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">
                                • APERTURA: {exp.año_apertura}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-slate-600 font-black text-[10px] uppercase tracking-tighter leading-tight line-clamp-2">
                           {exp.subserie ? exp.subserie.nombre : exp.serie?.nombre}
                        </span>
                        <span className="text-[8px] font-bold text-[#BC955B] uppercase block mt-1">CÓD: {exp.subserie ? exp.subserie.codigo : exp.serie?.codigo}</span>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                           <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                             Total: {exp.vigencias?.total || 0} Años
                           </span>
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                              exp.vigencias?.historico === 'HISTORICO' 
                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                : exp.vigencias?.historico === 'MUESTREO'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {exp.vigencias?.historico || 'Baja'}
                           </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border w-fit flex items-center gap-2 mx-auto ${
                            exp.estado_archivo === 'abierto' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : exp.estado_archivo === 'subsanacion'
                              ? 'bg-orange-50 text-orange-700 border-orange-100 animate-pulse'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              exp.estado_archivo === 'abierto' ? 'bg-emerald-500 animate-pulse' : 
                              exp.estado_archivo === 'subsanacion' ? 'bg-orange-500' : 'bg-slate-400'
                            }`}></div>
                            {exp.estado_archivo}
                          </span>
                          {exp.estatus_disponibilidad === 'en transferencia' ? (
                            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 animate-pulse">
                               EN TRANSFERENCIA <ArrowRightLeft size={8} />
                            </span>
                          ) : exp.vigencia_cumplida ? (
                            <span className="text-[8px] font-black text-rose-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                               VIGENCIA CUMPLIDA <CheckCircle2 size={8} />
                            </span>
                          ) : exp.estado_archivo === 'cerrado' && (
                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                               {exp.minutos_transcurridos} / {exp.vigencias?.tramite} MIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleView(exp)}
                            className={`p-2.5 rounded-xl shadow-sm border transition-all ${
                              exp.estado_archivo === 'subsanacion' && user?.role?.slug === 'rat'
                              ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 animate-pulse'
                              : exp.estado_archivo === 'subsanacion'
                              ? 'bg-orange-50 text-orange-400 border-orange-100 hover:text-orange-600'
                              : exp.is_in_subsanacion
                              ? 'bg-blue-50 text-blue-600 border-blue-200 cursor-help'
                              : 'bg-white text-slate-400 border-slate-100 hover:text-[#7A152E]'
                            }`}
                            title={
                              exp.estado_archivo === 'subsanacion' 
                                ? (user?.role?.slug === 'rat' ? "Subsanar / Corregir" : "Ver estado de Subsanación") : 
                              exp.is_in_subsanacion ? "En revisión de transferencia (Protegido)" : 
                              "Ver Detalle"
                            }
                          >
                             {exp.estado_archivo === 'subsanacion' && user?.role?.slug === 'rat' ? <Wrench size={18} /> : 
                              exp.is_in_subsanacion ? <Clock size={18} /> : 
                              <Eye size={18} />}
                          </button>
                          
                          {user?.role?.slug === 'rat' && (
                            <>
                              {exp.estado_archivo === 'abierto' && (
                                <>
                                  <button 
                                    onClick={() => handleEdit(exp)}
                                    className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-indigo-600 transition-all"
                                    title="Editar Expediente"
                                  >
                                     <Edit2 size={18} />
                                  </button>

                                  <button 
                                    onClick={() => handleDelete(exp.id)}
                                    className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-red-600 transition-all"
                                    title="Eliminar Expediente"
                                  >
                                     <Trash2 size={18} />
                                  </button>
                                </>
                              )}

                              {exp.estado_archivo === 'abierto' ? (
                                <button 
                                  onClick={() => handleCerrarExpediente(exp.id)}
                                  className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-amber-600 transition-all"
                                  title="Cerrar Expediente"
                                >
                                   <Lock size={18} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    if (exp.estado_archivo === 'subsanacion') {
                                      Swal.fire({
                                        icon: 'info',
                                        title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">MODO SUBSANACIÓN</span>',
                                        text: 'Este expediente está en revisión técnica. Utilice las herramientas de corrección en la vista de detalle en lugar de reabrirlo.',
                                        confirmButtonColor: '#7A152E',
                                        customClass: { popup: 'rounded-[2rem]' }
                                      });
                                    } else if (exp.vigencia_cumplida) {
                                      Swal.fire({
                                        icon: 'warning',
                                        title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">Reapertura No Permitida</span>',
                                        text: 'Este expediente ha cumplido su plazo de conservación en trámite y no puede ser reabierto. Debe iniciar su transferencia primaria al Archivo de Concentración.',
                                        confirmButtonColor: '#7A152E',
                                        customClass: { popup: 'rounded-[2rem]' }
                                      });
                                    } else {
                                      handleReabrirExpediente(exp.id);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl shadow-sm border transition-all ${
                                    exp.vigencia_cumplida || exp.estado_archivo === 'subsanacion'
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:text-blue-600'
                                  }`}
                                  title={
                                    exp.estado_archivo === 'subsanacion' ? "En Subsanación: Use herramientas de corrección" :
                                    exp.vigencia_cumplida ? "Plazo vencido: No se puede reabrir" : "Reabrir Expediente"
                                  }
                                >
                                   <Unlock size={18} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* { modales } */}
      <ExpedienteForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchRecords(true)}
        record={selectedExpediente}
      />

      <ExpedienteView 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        record={selectedExpediente}
      />

      <TransferenciaForm 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
            fetchRecords(true);
            Swal.fire({
              icon: 'success',
              title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA INICIADA!</span>',
              text: 'La solicitud de transferencia ha sido creada y enviada a revisión.',
              iconColor: '#7A152E',
              timer: 2500,
              showConfirmButton: false,
              background: '#ffffff',
              customClass: {
                popup: 'rounded-[3rem] shadow-2xl border-none',
                title: 'text-2xl py-10',
              }
            });
        }}
        initialExpedientes={vencidos}
      />
    </div>
  );
};

export default ExpedientesPage;
