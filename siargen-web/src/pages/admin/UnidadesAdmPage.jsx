import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Save, 
  X, 
  Search, 
  Building,
  Mail,
  Phone,
  User,
  MapPin,
  AlertCircle,
  Hash,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  ChevronDown
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchUnidades, 
  toggleUnidadStatus, 
  deleteUnidad,
  invalidateUnidadesCache
} from '../../store/unidadSlice';
import { alerts } from '../../utils/alerts';
import ModalPortal from '../../components/ModalPortal';
import UnidadAdministrativaForm from '../../components/admin/UnidadAdministrativaForm';
import UnidadAdministrativaDetails from '../../components/admin/UnidadAdministrativaDetails';

const UnidadesAdmPage = () => {
  const dispatch = useDispatch();
  const { items: unidades, loading, pagination, lastFetch } = useSelector((state) => state.unidades);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState(null);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // estados para filtros
  const [filters, setFilters] = useState({
    activo: '',
  });

  const fetchData = useCallback(async (search, activo) => {
    dispatch(fetchUnidades({
      search,
      activo,
      per_page: -1
    }));
  }, [dispatch]);

  useEffect(() => {
    if (!lastFetch) {
      fetchData('', '');
    }
  }, [fetchData, lastFetch]);

  // debounce para búsqueda y filtros
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(searchTerm, filters.activo);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters.activo, fetchData]);

  const handleEdit = (unidad) => {
    setEditingUnidad(unidad);
    setIsModalOpen(true);
  };

  const handleShowDetails = async (id) => {
    try {
      const response = await api.get(`/unidades-administrativas/${id}`);
      setSelectedUnidad(response.data.data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Error loading unit details:', error);
      alerts.error('No se pudo obtener la estructura orgánica de la unidad');
    }
  };

  const clearFilters = () => {
    dispatch(invalidateUnidadesCache());
    setFilters({ activo: '' });
    setSearchTerm('');
  };

  const handleToggleStatus = async (unidad) => {
    const isActivating = !unidad.activo;
    const result = await Swal.fire({
      title: isActivating ? '¿Reactivar Unidad?' : '¿Desactivar Unidad?',
      text: isActivating 
        ? "La unidad volverá a estar disponible para asignaciones." 
        : "La unidad quedará marcada como inactiva, pero sus registros históricos se mantendrán.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isActivating ? '#BC955B' : '#7A152E',
      confirmButtonText: isActivating ? 'Sí, reactivar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(toggleUnidadStatus(unidad.id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: `<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡${isActivating ? 'Reactivada' : 'Desactivada'}!</span>`,
          text: isActivating ? 'La unidad está nuevamente activa.' : 'La unidad ha sido marcada como inactiva.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
      } catch (error) {
        alerts.error(error || 'Error al procesar el cambio de estado');
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar Área?',
      text: "Se aplicará un borrado lógico a la unidad administrativa. El personal vinculado permanecerá en el sistema pero perderá su adscripción activa.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Sí, eliminar',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteUnidad(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Eliminado!</span>',
          text: 'El área ha sido removida del sistema correctamente.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
      } catch (error) {
        alerts.error(error || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <Building className="text-[#7A152E]" size={40} />
            Unidades Administrativas
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">Gestión de áreas productoras del ISEM</p>
        </div>
        <button
          onClick={() => { 
            setEditingUnidad(null); 
            setIsModalOpen(true); 
          }}
          className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] hover:shadow-2xl text-white px-10 py-5 rounded-[1.5rem] flex items-center gap-3 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-lg"
        >
          <Plus size={20} /> Nueva Unidad
        </button>
      </div>

      {/* { barra de búsqueda y filtros } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
        {/* { fila de búsqueda } */}
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre, email o dirección..."
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[#7A152E]/20 focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-bold text-gray-700 text-lg shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* { fila de filtros } */}
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter size={16} className="text-[#BC955B]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por:</span>
           </div>

           <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <RefreshCcw className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                className="w-full pl-10 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white focus:border-[#BC955B]/30 transition-all appearance-none cursor-pointer"
                value={filters.activo}
                onChange={(e) => setFilters({...filters, activo: e.target.value})}
              >
                <option value="">Todos los Estatus</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
           </div>

           {(searchTerm || filters.activo) && (
             <button 
               onClick={clearFilters}
               className="flex items-center gap-2 px-6 py-4 text-red-500 font-bold text-xs bg-red-50 hover:bg-red-100 rounded-2xl transition-all active:scale-95 group"
               title="Limpiar Filtros"
             >
               <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
               Limpiar
             </button>
           )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* { overlay de carga para búsquedas/filtros rápidos } */}
        <AnimatePresence>
          {loading && unidades.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-[#7A152E]" size={40} />
                <span className="font-black uppercase tracking-[0.2em] text-[10px] text-[#7A152E]">Actualizando registros...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && unidades.length === 0 ? (
          <div className="p-40 flex flex-col items-center gap-6 text-[#7A152E]">
            <Loader2 className="animate-spin" size={64} />
            <span className="font-black uppercase tracking-[0.3em] text-sm">Sincronizando Áreas...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[12%]">Código</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[32%]">Área / Unidad</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[19%]">Titular de Área</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[22%]">Contacto</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-[15%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {unidades.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <Building size={48} className="opacity-20" />
                          <p className="font-black uppercase tracking-widest text-xs">No se encontraron registros con estos filtros</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    unidades.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-2">
                            <span className={`px-4 py-2.5 rounded-2xl font-black text-xs border tracking-widest whitespace-nowrap w-fit ${u.activo ? 'bg-[#7A152E]/5 text-[#7A152E] border-[#7A152E]/10' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                              {u.codigo}
                            </span>
                            {!u.activo && (
                              <span className="bg-red-50 text-red-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-red-100 tracking-widest w-fit uppercase">
                                Inactiva
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-8 max-w-0">
                          <div className="min-w-0 flex-1">
                            <p className={`text-base font-black tracking-tight leading-[1.1] line-clamp-2 mb-1.5 ${u.activo ? 'text-slate-800' : 'text-gray-400'}`} title={u.nombre}>
                              {u.nombre}
                            </p>
                            <p 
                              className="text-[10px] text-slate-400 font-bold flex items-center gap-2 tracking-widest truncate" 
                              title={u.direccion}
                            >
                              <MapPin size={10} className={`shrink-0 ${u.activo ? 'text-[#BC955B]' : 'text-gray-300'}`} /> 
                              {u.direccion}
                            </p>
                          </div>
                        </td>
                        <td className="px-10 py-8 max-w-0">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="relative group/avatar shrink-0">
                               <div className={`absolute -inset-1 bg-gradient-to-tr from-[#7A152E] to-[#BC955B] rounded-full blur opacity-10 transition duration-500 ${u.activo ? 'group-hover/avatar:opacity-20' : 'opacity-0'}`}></div>
                               <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-sm border overflow-hidden ${u.activo ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'}`}>
                                 <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
                                 <User size={18} className={`relative z-10 ${u.activo ? 'text-[#7A152E]/70' : 'text-gray-300'}`} />
                               </div>
                             </div>
                             <p className={`text-[11px] font-black tracking-wider truncate ${u.activo ? 'text-slate-700' : 'text-gray-400'}`} title={u.titular_nombre}>
                               {u.titular_nombre}
                             </p>
                          </div>
                        </td>
                        <td className="px-10 py-8 max-w-0">
                          <div className="flex flex-col gap-4 min-w-0">
                            {/* { fila email } */}
                            <div className="flex items-start gap-3 group/contact min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover/contact:border-[#7A152E]/20 transition-all shadow-sm">
                                <Mail size={14} className="text-slate-400 group-hover/contact:text-[#7A152E] transition-colors" />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0 mt-0.5">
                                <span className="text-[11px] font-black text-slate-700 tracking-tight break-all" title={u.email}>
                                  {u.email}
                                </span>
                              </div>
                            </div>
                            
                            {/* { fila teléfono } */}
                            <div className="flex items-start gap-3 group/contact min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover/contact:border-[#7A152E]/20 transition-all shadow-sm">
                                <Phone size={14} className="text-slate-400 group-hover/contact:text-[#7A152E] transition-colors" />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0 mt-0.5">
                                <span className="text-[11px] font-black text-slate-700 tracking-tight">{u.telefono}</span>
                                {u.extension && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-[#BC955B] text-[8px] font-black rounded-lg border border-amber-100/50 uppercase tracking-[0.15em]">
                                      <Hash size={8} /> EXT: {u.extension}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            <button 
                              onClick={() => handleShowDetails(u.id)} 
                              className="p-4 bg-white text-blue-500 hover:bg-blue-500 hover:text-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90"
                              title="Ver Estructura Orgánica"
                            >
                              <Eye size={20} />
                            </button>

                            <button 
                              onClick={() => handleEdit(u)} 
                              className={`p-4 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all ${!u.activo ? 'opacity-20 cursor-not-allowed grayscale' : 'text-[#BC955B] hover:bg-[#BC955B] hover:text-white active:scale-90'}`}
                              title={!u.activo ? 'Reactivar unidad para editar' : 'Editar Área'}
                              disabled={!u.activo}
                            >
                              <Edit2 size={20} />
                            </button>
                            
                            <button 
                              onClick={() => handleToggleStatus(u)} 
                              className={`p-4 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90 ${u.activo ? 'text-red-400 hover:bg-red-500 hover:text-white' : 'text-green-500 hover:bg-green-600 hover:text-white'}`}
                              title={u.activo ? 'Desactivar Unidad' : 'Reactivar Unidad'}
                            >
                              {u.activo ? <Trash2 size={20} /> : <RefreshCcw size={20} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* { footer con total } */}
            <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Total de unidades: <span className="text-[#7A152E] font-black">{unidades.length}</span>
              </p>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <UnidadAdministrativaForm
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => fetchData(searchTerm, filters)}
            unidad={editingUnidad}
          />
        )}

        {isDetailsOpen && (
          <UnidadAdministrativaDetails
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedUnidad(null);
            }}
            unidad={selectedUnidad}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnidadesAdmPage;
