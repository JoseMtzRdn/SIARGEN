import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Bookmark, Loader2, ChevronLeft, ChevronRight, Filter, X, RefreshCcw, ShieldCheck, Eye, Layers } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSeriesArchivistica, deleteSerie, fetchSecciones } from '../../store/archivisticaSlice';
import Swal from 'sweetalert2';
import SerieForm from '../../components/admin/SerieForm';
import SerieView from '../../components/admin/SerieView';

const SeriesPage = () => {
  const dispatch = useDispatch();
  const { series, secciones } = useSelector((state) => state.archivistica);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState(null);
  
  // estados para filtros
  const [filters, setFilters] = useState({
    seccion_id: '',
  });

  const fetchData = useCallback(async (search = searchTerm, activeFilters = filters) => {
    dispatch(fetchSeriesArchivistica({ 
      search,
      seccion_id: activeFilters.seccion_id
    }));
  }, [dispatch, searchTerm, filters]);

  useEffect(() => {
    if (!series.lastFetch) {
      fetchData();
    }
    if (secciones.items.length === 0) {
      dispatch(fetchSecciones());
    }
  }, [fetchData, series.lastFetch, dispatch, secciones.items.length]);

  // debounce para búsqueda
  useEffect(() => {
    if (!series.lastFetch) return;
    const delayDebounceFn = setTimeout(() => {
      fetchData(searchTerm, filters);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters, fetchData]);

  const handleEdit = (serie) => {
    setSelectedSerie(serie);
    setIsModalOpen(true);
  };

  const handleView = (serie) => {
    setSelectedSerie(serie);
    setIsViewOpen(true);
  };

  const handleDelete = async (serie) => {
    const result = await Swal.fire({
      title: '¿Eliminar Serie Documental?',
      text: `Esta acción eliminará la serie ${serie.codigo} permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteSerie(serie.id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Eliminada!</span>',
          text: 'La serie documental ha sido eliminada correctamente.',
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
        const errorMessage = typeof error === 'string' ? error : (error?.message || 'No se pudo eliminar la serie');
        Swal.fire({
          icon: 'error',
          title: 'Acción Bloqueada',
          text: errorMessage,
          confirmButtonColor: '#7A152E'
        });
      }
    }
  };

  const clearFilters = () => {
    setFilters({ seccion_id: '' });
    setSearchTerm('');
  };

  return (
    <div className="space-y-8 font-inter pb-20">
      {/* { header } */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <ShieldCheck className="text-[#7A152E]" size={40} />
            Gestión de Series
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">Nivel 3 • Serie Documental</p>
        </div>
        <button
          onClick={() => { setSelectedSerie(null); setIsModalOpen(true); }}
          className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] hover:shadow-2xl text-white px-10 py-5 rounded-[1.5rem] flex items-center gap-3 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-lg"
        >
          <Plus size={20} /> Nueva Serie
        </button>
      </div>

      {/* { barra de búsqueda y filtros } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..."
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[#7A152E]/20 focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-bold text-gray-700 text-lg shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter size={16} className="text-[#BC955B]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por:</span>
           </div>

           <select 
             className="pl-6 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white focus:border-[#BC955B]/30 transition-all appearance-none cursor-pointer min-w-[240px]"
             value={filters.seccion_id}
             onChange={(e) => setFilters({...filters, seccion_id: e.target.value})}
           >
             <option value="">Todas las Secciones</option>
             {secciones.items.map(s => (
               <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
             ))}
           </select>

           {(searchTerm || filters.seccion_id) && (
             <button 
               onClick={clearFilters}
               className="flex items-center gap-2 px-6 py-4 text-red-500 font-bold text-xs bg-red-50 hover:bg-red-100 rounded-2xl transition-all active:scale-95"
             >
               <X size={18} />
               Limpiar Filtros
             </button>
           )}
        </div>
      </div>

      {/* { content table } */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {series.loading && series.items.length === 0 ? (
          <div className="p-40 flex flex-col items-center gap-6 text-[#7A152E]">
            <Loader2 className="animate-spin" size={64} />
            <span className="font-black uppercase tracking-[0.3em] text-sm">Sincronizando Catálogo...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-32">Código</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Serie / Sección Padre</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-32">Subseries</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-32">Expedientes</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-40">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {series.items.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-10 py-8">
                        <span className="bg-[#7A152E]/5 text-[#7A152E] px-4 py-2.5 rounded-2xl font-black text-xs border border-[#7A152E]/10 tracking-widest whitespace-nowrap">
                          {s.codigo}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                           <p className="text-base font-black text-slate-800 tracking-tight leading-tight">{s.nombre}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                             <Layers size={10} className="text-[#BC955B]" /> {s.seccion?.nombre}
                           </p>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-sm border border-indigo-100 shadow-inner">
                          {s.subseries_count || 0}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-black text-sm border border-purple-100 shadow-inner">
                          {s.expedientes_count || 0}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => handleView(s)} className="p-4 bg-white text-[#7A152E] hover:bg-[#7A152E] hover:text-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90">
                            <Eye size={20} />
                          </button>
                          <button onClick={() => handleEdit(s)} className="p-4 bg-white text-[#BC955B] hover:bg-[#BC955B] hover:text-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90">
                            <Edit2 size={20} />
                          </button>
                          <button onClick={() => handleDelete(s)} className="p-4 bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {series.items.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-8 py-40 text-center">
                        <div className="bg-gray-50 inline-flex p-10 rounded-full mb-6 text-gray-200">
                          <ShieldCheck size={64} />
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-sm italic">
                          No se encontraron series documentales registradas
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* { footer con total } */}
            <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Total de registros: <span className="text-[#7A152E] font-black">{series.items.length}</span>
              </p>
            </div>
          </>
        )}
      </div>

      <SerieForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchData()}
        serie={selectedSerie}
      />

      <SerieView
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        serie={selectedSerie}
      />
    </div>
  );
};

export default SeriesPage;
