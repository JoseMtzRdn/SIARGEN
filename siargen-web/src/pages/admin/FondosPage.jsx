import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Database, Loader2, ChevronLeft, ChevronRight, Filter, X, RefreshCcw } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFondos, deleteFondo } from '../../store/archivisticaSlice';
import Swal from 'sweetalert2';
import FondoForm from '../../components/admin/FondoForm';

const FondosPage = () => {
  const dispatch = useDispatch();
  const { items: fondos, loading, lastFetch } = useSelector((state) => state.archivistica.fondos);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFondo, setSelectedFondo] = useState(null);

  const fetchData = useCallback(async (search = searchTerm) => {
    dispatch(fetchFondos({ search }));
  }, [dispatch, searchTerm]);

  useEffect(() => {
    if (!lastFetch) {
      fetchData();
    }
  }, [fetchData, lastFetch]);

  // debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchData]);

  const handleEdit = (fondo) => {
    setSelectedFondo(fondo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar Fondo?',
      text: "Esta acción eliminará el fondo y todas sus secciones asociadas.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteFondo(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Eliminado!</span>',
          text: 'El fondo ha sido eliminado correctamente.',
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
        const errorMessage = typeof error === 'string' ? error : (error?.message || 'No se pudo eliminar el fondo');
        Swal.fire({
          icon: 'error',
          title: 'Acción Bloqueada',
          text: errorMessage,
          confirmButtonColor: '#7A152E'
        });
      }
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20">
      {/* { header } */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <Database className="text-[#7A152E]" size={40} />
            Gestión de Fondos
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">Nivel 1 • Fondo Institucional</p>
        </div>
        <button
          onClick={() => { setSelectedFondo(null); setIsModalOpen(true); }}
          className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] hover:shadow-2xl text-white px-10 py-5 rounded-[1.5rem] flex items-center gap-3 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-lg"
        >
          <Plus size={20} /> Nuevo Fondo
        </button>
      </div>

      {/* { barra de búsqueda } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar fondo por nombre o código..."
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[#7A152E]/20 focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-bold text-gray-700 text-lg shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Limpiar Búsqueda"
            >
              <X size={20} className="hover:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>

      {/* { content table } */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-40 flex flex-col items-center gap-6 text-[#7A152E]">
            <Loader2 className="animate-spin" size={64} />
            <span className="font-black uppercase tracking-[0.3em] text-sm">Sincronizando Catálogo...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-32">Código</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Nombre del Fondo</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-32">Secciones</th>
                    <th className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-40">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fondos.map((fondo) => (
                    <tr key={fondo.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-10 py-8">
                        <span className="bg-[#7A152E]/5 text-[#7A152E] px-4 py-2.5 rounded-2xl font-black text-xs border border-[#7A152E]/10 tracking-widest whitespace-nowrap">
                          {fondo.codigo}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                           <p className="text-base font-black text-slate-800 tracking-tight leading-tight">{fondo.nombre}</p>
                           <p className="text-[10px] font-black text-[#BC955B] uppercase tracking-widest mt-1">Fondo Archivístico</p>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-black text-sm border border-amber-100 shadow-inner">
                          {fondo.secciones_count || 0}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => handleEdit(fondo)} className="p-4 bg-white text-[#BC955B] hover:bg-[#BC955B] hover:text-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90">
                            <Edit2 size={20} />
                          </button>
                          <button onClick={() => handleDelete(fondo.id)} className="p-4 bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-2xl shadow-lg border border-gray-100 transition-all active:scale-90">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fondos.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-8 py-40 text-center">
                        <div className="bg-gray-50 inline-flex p-10 rounded-full mb-6 text-gray-200">
                          <Database size={64} />
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-sm italic">
                          No se encontraron fondos registrados
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
                Total de registros: <span className="text-[#7A152E] font-black">{fondos.length}</span>
              </p>
            </div>
          </>
        )}
      </div>

      <FondoForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchData()}
        fondo={selectedFondo}
      />
    </div>
  );
};

export default FondosPage;
