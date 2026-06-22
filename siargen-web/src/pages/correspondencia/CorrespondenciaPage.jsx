import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowRightLeft, 
  Loader2, 
  FileText, 
  Filter,
  Eye,
  Building,
  ChevronDown,
  X,
  FileCheck,
  RefreshCw,
  FolderX,
  Inbox,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  LayoutGrid,
  List,
  Clock,
  Lock,
  Calendar,
  Timer,
  User,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { 
  fetchCorrespondencia, 
  deleteCorrespondencia, 
  archivarCorrespondencia,
  desarchivarCorrespondencia,
  clearValidationErrors
} from '../../store/correspondenciaSlice';
import { userService } from '../../api/userService';
import api from '../../api/axios';
import { alerts } from '../../utils/alerts';
import CorrespondenciaForm from '../../components/correspondencia/CorrespondenciaForm';
import CorrespondenciaView from '../../components/correspondencia/CorrespondenciaView';
import VincularExpedienteModal from '../../components/correspondencia/VincularExpedienteModal';

const CorrespondenciaPage = () => {
  const dispatch = useDispatch();
  const { items: allRecords, loading, lastFetch } = useSelector((state) => state.correspondencia);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('entrada'); // 'entrada' o 'salida'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [recordToArchive, setRecordToArchive] = useState(null);

  const selectedRecord = useMemo(() => {
    return allRecords.find(r => r.id === selectedRecordId) || null;
  }, [allRecords, selectedRecordId]);

  const [filters, setFilters] = useState({
    estatus: 'todos'
  });

  const filteredRecords = useMemo(() => {
    const priorityOrder = { 'URGENTE': 1, 'ALTA': 2, 'MEDIA': 3, 'BAJA': 4, 'NORMAL': 3 };

    return allRecords
      .filter(record => {
        const recordTipo = record.tipo?.toLowerCase();
        const matchesTab = recordTipo === activeTab;
        if (!matchesTab) return false;

        const matchesStatus = filters.estatus === 'todos' || record.estatus === filters.estatus;
        if (!matchesStatus) return false;
        
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
          record.folio_sistema?.toLowerCase().includes(searchLower) ||
          record.asunto?.toLowerCase().includes(searchLower) ||
          record.remitente?.toLowerCase().includes(searchLower) ||
          record.destinatario?.toLowerCase().includes(searchLower) ||
          record.num_oficio?.toLowerCase().includes(searchLower);

        return matchesSearch;
      })
      .sort((a, b) => {
        const prioA = priorityOrder[a.prioridad?.toUpperCase()] || 99;
        const prioB = priorityOrder[b.prioridad?.toUpperCase()] || 99;
        if (prioA !== prioB) return prioA - prioB;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [allRecords, activeTab, filters.estatus, searchTerm]);

  const getPriorityStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENTE': return 'bg-red-50 text-red-700 border-red-200';
      case 'ALTA': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIA': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BAJA': return 'bg-gray-50 text-gray-500 border-gray-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const fetchRecords = useCallback((force = false) => {
    const params = { per_page: -1 };
    if (searchTerm) params.search = searchTerm;
    dispatch(fetchCorrespondencia(params));
  }, [dispatch, searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (searchTerm === '') return;
    const delayDebounceFn = setTimeout(() => {
      fetchRecords(true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchRecords]);

  const handleView = (record) => {
    setSelectedRecordId(record.id);
    setIsViewOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecordId(record.id);
    dispatch(clearValidationErrors());
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await alerts.confirmWithInput(
      "Esta acción es irreversible y eliminará el documento asociado. Se requiere un motivo de eliminación.",
      "¿Eliminar Registro?",
      "Ingrese el motivo de la eliminación (mínimo 10 caracteres)...",
      "Sí, eliminar permanentemente"
    );

    if (result.isConfirmed && result.value) {
      try {
        await dispatch(deleteCorrespondencia({ id, motivo: result.value })).unwrap();
        alerts.success('El registro ha sido eliminado correctamente.', '¡ELIMINADO!');
      } catch (error) {
        alerts.error(error || 'No se pudo eliminar el registro');
      }
    }
  };

  const handleArchive = (record) => {
    setRecordToArchive(record);
    setIsArchiveModalOpen(true);
  };

  const handleUnarchive = async (record) => {
    const result = await alerts.confirmWithInput(
      `Se romperá el vínculo del folio ${record.folio_sistema} con su expediente actual. Se requiere un motivo.`,
      "Desarchivar Documento",
      "Indique el motivo del desarchivado (ej. Error en la vinculación)...",
      "Sí, desarchivar"
    );

    if (result.isConfirmed && result.value) {
      try {
        await dispatch(desarchivarCorrespondencia({ id: record.id, motivo: result.value })).unwrap();
        alerts.success(`El folio ${record.folio_sistema} ha sido desvinculado del expediente.`, '¡DESARCHIVADO!');
      } catch (error) {
        alerts.error(error || 'No se pudo desarchivar');
      }
    }
  };

  const clearFilters = () => {
    setFilters({ estatus: 'todos' });
    setSearchTerm('');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-white text-slate-700 border-slate-300 shadow-sm';
      case 'TURNADO': return 'bg-white text-blue-700 border-blue-300 shadow-sm';
      case 'ARCHIVADO': return 'bg-white text-emerald-700 border-emerald-300 shadow-sm';
      case 'CONCLUIDO': return 'bg-gray-50 text-gray-500 border-gray-200 shadow-sm';
      default: return 'bg-white text-slate-500 border-slate-200 shadow-sm';
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header } */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
               <ArrowRightLeft className="text-white" size={28} />
            </div>
            Gestión de Correspondencia
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
            Oficialía de Partes • {activeTab === 'entrada' ? 'Libro de Entradas' : 'Libro de Salidas'}
          </p>
        </div>
        <button 
          onClick={() => {
            setSelectedRecordId(null);
            dispatch(clearValidationErrors());
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
        >
          <Plus size={18} />
          Nuevo Registro
        </button>
      </div>

      {/* { tabs } */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-100/50 p-2 rounded-[2rem] w-fit border border-gray-200/50 shadow-inner">
        <button 
          onClick={() => setActiveTab('entrada')}
          className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all
            ${activeTab === 'entrada' ? 'bg-white text-[#7A152E] shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Recibidos (Entradas)
          <span className="ml-2 px-2 py-0.5 rounded-lg bg-gray-200 text-[9px] text-gray-500">
            {allRecords.filter(r => r.tipo?.toLowerCase() === 'entrada').length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('salida')}
          className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all
            ${activeTab === 'salida' ? 'bg-white text-[#7A152E] shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Enviados (Salidas)
          <span className="ml-2 px-2 py-0.5 rounded-lg bg-gray-200 text-[9px] text-gray-500">
            {allRecords.filter(r => r.tipo?.toLowerCase() === 'salida').length}
          </span>
        </button>
      </div>

      {/* { buscador } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder={`BUSCAR EN ${activeTab === 'entrada' ? 'ENTRADAS' : 'SALIDAS'}...`} 
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 focus:border-[#7A152E] outline-none transition-all font-bold text-gray-700 shadow-inner uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter size={16} className="text-[#BC955B]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado:</span>
           </div>

           <div className="relative min-w-[220px]">
              <select 
                value={filters.estatus}
                onChange={(e) => setFilters({...filters, estatus: e.target.value})}
                className="w-full pl-6 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white focus:border-[#BC955B]/30 transition-all appearance-none cursor-pointer"
              >
                <option value="todos">Todos los Estatus</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ARCHIVADO">ARCHIVADO</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
           </div>

           {(searchTerm || filters.estatus !== 'todos') && (
             <button onClick={clearFilters} className="px-6 py-4 text-red-500 font-bold text-xs bg-red-50 hover:bg-red-100 rounded-2xl transition-all">Limpiar</button>
           )}
        </div>
      </div>

      {/* { tabla } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-4 text-[#7A152E]">
            <Loader2 className="animate-spin" size={48} />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando Correspondencia...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-[15%]">Identificación</th>
                  
                  {/* { columnas dinámicas según tab } */}
                  {activeTab === 'entrada' ? (
                    <>
                      <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-[20%]">Remitente (Origen)</th>
                      <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-[20%]">Unidad Turnada (Destino)</th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-[20%]">Unidad Emisora (Origen)</th>
                      <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-[20%]">Destinatario (Destino)</th>
                    </>
                  )}

                  <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-[20%]">Asunto / Serie o Subserie</th>
                  <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center w-[10%]">Estado del Trámite</th>
                  <th className="px-5 py-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                          record.tipo === 'ENTRADA' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {record.tipo === 'ENTRADA' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <span className="text-[#7A152E] font-black text-[12px] block tracking-tighter">{record.folio_sistema}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">{record.clase_documento}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-slate-400 font-bold text-[8px] uppercase">{record.num_oficio || 'S/N'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* { datos dinámicos (origen) } */}
                    <td className="px-5 py-6">
                      {activeTab === 'entrada' ? (
                        <div className="flex items-center gap-2 max-w-[280px]">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span className="text-[11px] font-black text-slate-800 uppercase block truncate w-full" title={record.remitente}>
                            {record.remitente}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-[280px]">
                          <Building size={12} className="text-slate-300 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase truncate w-full" title={record.unidad_administrativa?.nombre}>
                            {record.unidad_administrativa?.nombre || 'UNIDAD NO DEFINIDA'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* { datos dinámicos (destino) } */}
                    <td className="px-5 py-6">
                      {activeTab === 'entrada' ? (
                        <div className="flex items-center gap-2 max-w-[280px]">
                          <Building size={12} className="text-slate-300 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase truncate w-full" title={record.unidad_administrativa?.nombre}>
                            {record.unidad_administrativa?.nombre || 'UNIDAD NO DEFINIDA'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-[280px]">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span className="text-[11px] font-black text-slate-800 uppercase block truncate w-full" title={record.destinatario}>
                            {record.destinatario}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-6">
                       <div className="space-y-2 max-w-[300px]">
                         <p className="text-[11px] font-bold text-slate-600 leading-tight uppercase line-clamp-1 italic" title={record.asunto}>"{record.asunto}"</p>
                         <div className="flex items-center gap-2">
                           <Bookmark size={10} className="text-[#BC955B]" />
                           <span 
                             className="text-[8px] font-black text-[#BC955B] uppercase tracking-tighter truncate w-full" 
                             title={
                               record.subserie 
                               ? `${record.subserie.codigo} - ${record.subserie.nombre}`
                               : record.serie 
                               ? `${record.serie.codigo} - ${record.serie.nombre}` 
                               : 'SIN CLASIFICACIÓN'
                             }
                           >
                             {record.subserie 
                               ? record.subserie.codigo 
                               : record.serie 
                               ? record.serie.codigo 
                               : 'S/C'
                             }
                           </span>
                         </div>
                       </div>
                    </td>

                    <td className="px-5 py-6 text-center">
                       <div className="flex flex-col items-center gap-1.5">
                         <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase border w-fit shadow-sm ${getStatusStyle(record.estatus)}`}>
                           {record.estatus}
                         </span>
                         <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getPriorityStyle(record.prioridad)}`}>
                           {record.prioridad}
                         </span>
                       </div>
                    </td>
                    
                    <td className="px-5 py-6 text-center">
                       <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleView(record)} className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-[#7A152E] hover:border-[#7A152E]/20 transition-all active:scale-90" title="Ver Detalle"><Eye size={18} /></button>
                          
                          {record.estatus === 'ARCHIVADO' ? (
                            <div className="flex gap-2">
                              {record.expediente?.estado_archivo === 'cerrado' ? (
                                <div className="p-2.5 bg-gray-50 text-gray-300 rounded-xl border border-gray-100 cursor-not-allowed" title="Expediente Cerrado">
                                    <Lock size={18} />
                                </div>
                              ) : (
                                <button onClick={() => handleUnarchive(record)} className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-amber-600 transition-all active:scale-90" title="Desarchivar"><RefreshCw size={18} /></button>
                              )}
                              <div className="flex flex-col justify-center px-3 bg-emerald-50 border border-emerald-100 rounded-xl min-w-[80px]">
                                <span className="text-[7px] font-black text-emerald-700 uppercase tracking-tighter leading-none text-center">Archivado</span>
                                <span className="text-[8px] font-bold text-emerald-600 uppercase mt-1 truncate text-center">{record.expediente?.numero_expediente}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(record)} className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-indigo-600 transition-all active:scale-90" title="Editar"><Edit2 size={18} /></button>
                              <button onClick={() => handleDelete(record.id)} className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-red-600 transition-all active:scale-90" title="Eliminar"><Trash2 size={18} /></button>
                              <button onClick={() => handleArchive(record)} className="p-2.5 bg-[#7A152E] text-white rounded-xl shadow-md hover:bg-[#8d1d37] transition-all flex items-center gap-2 px-4 active:scale-95">
                                <FileCheck size={16} />
                                <span className="text-[9px] font-black uppercase">Archivar</span>
                              </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CorrespondenciaForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchRecords(true)} record={selectedRecord} />
      <CorrespondenciaView isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} record={selectedRecord} />
      <VincularExpedienteModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} onSuccess={() => fetchRecords(true)} record={recordToArchive} />
    </div>
  );
};

export default CorrespondenciaPage;
