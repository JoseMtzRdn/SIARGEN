import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Archive, 
  Search, 
  Loader2, 
  FileText, 
  Eye,
  History,
  Building,
  Filter,
  Calendar,
  LayoutGrid,
  ChevronDown,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchExpedientes } from '../../store/expedienteSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import api from '../../api/axios';
import ExpedienteView from '../../components/tramite/ExpedienteView';
import Swal from 'sweetalert2';

const AcervoPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.expedientes);
  const { user } = useSelector((state) => state.auth);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  
  // garantizar que siempre sea un array para evitar errores de .length o .filter
  const allExpedientes = useMemo(() => Array.isArray(items) ? items : [], [items]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState('');

  const isCoordinator = user?.role?.slug === 'coord_archivos';

  const fetchRecords = useCallback((force = false) => {
    // Evitamos peticiones redundantes si los datos ya están en caché.
    if (!force && lastFetch) return;

    const params = { per_page: -1, fase: 'historico' };
    if (isCoordinator && selectedUnidad) {
      params.unidad_administrativa_id = selectedUnidad;
    }

    dispatch(fetchExpedientes(params));
  }, [dispatch, isCoordinator, selectedUnidad, lastFetch]);

  // Carga de catálogos y acervo histórico.
  useEffect(() => {
    if (isCoordinator) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [isCoordinator, dispatch]);

  // Carga registros al iniciar el componente o actualizar la unidad.
  useEffect(() => {
    const params = { per_page: -1, fase: 'historico' };
    if (isCoordinator && selectedUnidad) {
      params.unidad_administrativa_id = selectedUnidad;
    }
    dispatch(fetchExpedientes(params));
  }, [dispatch, selectedUnidad, isCoordinator]);

  const filteredRecords = useMemo(() => {
    return allExpedientes.filter(exp => {
      // Filtra expedientes recibidos oficialmente.
      if (exp.fase !== 'historico' || exp.estatus_disponibilidad !== 'disponible') return false;
      
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm || 
        exp.numero_expediente?.toLowerCase().includes(searchLower) ||
        exp.titulo?.toLowerCase().includes(searchLower) ||
        exp.unidad_administrativa?.nombre?.toLowerCase().includes(searchLower);
    });
  }, [allExpedientes, searchTerm]);

  const handleView = async (exp) => {
    try {
      const response = await api.get(`/expedientes/${exp.id}`);
      setSelectedExpediente(response.data.data);
      setIsViewOpen(true);
    } catch (error) {
      Swal.fire('Error', 'No se pudo recuperar el detalle del expediente', 'error');
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header histórico } */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
               <History className="text-white" size={28} />
            </div>
            Archivo Histórico
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
            Patrimonio Documental e Histórico del ISEM - <span>
               {isCoordinator 
                 ? (selectedUnidad ? unidades.find(u => String(u.id) === String(selectedUnidad))?.nombre : 'Archivo General')
                 : 'Fase Histórica'
               }
            </span>
          </p>
        </div>
      </div>

      {/* { buscador y filtros (solo coordinador ve unidad) } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="BUSCAR EN EL ACERVO HISTÓRICO..." 
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 focus:border-[#7A152E] outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 uppercase shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           {isCoordinator && (
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
      </div>

      {/* { tabla del acervo } */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-4 text-[#7A152E]">
            <Loader2 className="animate-spin" size={48} />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Consultando Memoria Institucional...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Folio Histórico</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Título / Serie</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Plazo / Destino</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Unidad de Origen</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Apertura/Cierre</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-24 text-center text-gray-300 font-black uppercase text-xs tracking-widest">
                      <Archive className="mx-auto mb-4 opacity-10" size={64} />
                      No hay expedientes en el archivo histórico
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#7A152E]/5 transition-colors group">
                      <td className="px-8 py-7">
                        <span className="text-[#7A152E] font-black text-sm">{exp.numero_expediente}</span>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-black text-xs uppercase">{exp.titulo}</span>
                          <span className="text-[9px] font-bold text-[#BC955B] mt-1 italic uppercase tracking-tighter">{exp.serie?.nombre}</span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center">
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                             Total: {exp.serie?.vigencia_total || 0} Años
                           </span>
                           <span className={`px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                              exp.serie?.disposicion_final === 'Historico' 
                                ? 'bg-[#7A152E]/5 text-[#7A152E] border-[#7A152E]/10' 
                                : exp.serie?.disposicion_final === 'Muestreo'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {exp.serie?.disposicion_final || 'Baja'}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                         <span className="text-[10px] font-black text-slate-600 uppercase">{exp.unidad_administrativa?.nombre}</span>
                      </td>
                      <td className="px-8 py-7">
                         <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#BC955B]" />
                            <span className="text-[10px] font-bold text-slate-500">{exp.año_apertura} - {exp.año_cierre || 'N/A'}</span>
                         </div>
                      </td>
                      <td className="px-8 py-7 text-center">
                         <button 
                           onClick={() => handleView(exp)}
                           className={`p-3 rounded-xl shadow-sm border transition-all active:scale-90 ${
                             exp.estado_archivo === 'subsanacion'
                             ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 animate-pulse'
                             : 'bg-white text-[#7A152E] border-[#7A152E]/10 hover:bg-[#7A152E] hover:text-white'
                           }`}
                         >
                           {exp.estado_archivo === 'subsanacion' ? <Wrench size={18} /> : <Eye size={18} />}
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpedienteView 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        record={selectedExpediente}
      />
    </div>
  );
};

export default AcervoPage;
