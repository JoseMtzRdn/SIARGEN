import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  FileText, 
  Archive,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ArrowRightLeft,
  LayoutGrid,
  Filter,
  X,
  ShieldCheck,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTransferencias, validarTransferencia, rechazarCoordinador } from '../../store/transferenciaSlice';
import TransferenciaView from '../../components/tramite/TransferenciaView';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const RevisionTransferenciasPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.transferencias);
  const { user } = useSelector((state) => state.auth);
  const allTransferencias = Array.isArray(items) ? items : [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Consulta transferencias autorizadas por el TUA para validación del Coordinador.
  const [filters, setFilters] = useState({
    tipo: 'todos',
    estatus: 'revision_coordinador'
  });

  const fetchRecords = useCallback((force = false) => {
    if (lastFetch && !force) return;
    dispatch(fetchTransferencias({ per_page: -1 }));
  }, [dispatch, lastFetch]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    return allTransferencias.filter(t => {
      const matchesStatus = filters.estatus === 'todos' || t.estatus === filters.estatus;
      const matchesTipo = filters.tipo === 'todos' || t.tipo === filters.tipo;
      
      const searchLower = searchTerm.toLowerCase();
      return (matchesStatus && matchesTipo) && (!searchTerm || 
        t.numero_transferencia?.toLowerCase().includes(searchLower) ||
        t.unidad_origen?.nombre?.toLowerCase().includes(searchLower));
    });
  }, [allTransferencias, filters, searchTerm]);

  const handleView = async (id) => {
    try {
        const response = await api.get(`/transferencias/${id}/detail`);
        setSelectedRecord(response.data.data);
        setIsViewOpen(true);
    } catch (error) {
        Swal.fire('Error', 'No se pudo recuperar el detalle de la transferencia', 'error');
    }
  };

  const handleValidar = async (id) => {
    const result = await Swal.fire({
      title: '¿Validar Transferencia?',
      text: "Confirmas que la transferencia cumple con la normatividad técnica y el CADIDO institucional.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Sí, validar técnicamente',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(validarTransferencia(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡VALIDACIÓN EXITOSA!</span>',
          text: 'La transferencia ha sido autorizada para su ejecución física.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        Swal.fire('Error', error || 'No se pudo completar la validación', 'error');
      }
    }
  };

  const handleRechazar = async (id) => {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Validación Técnica',
      input: 'textarea',
      inputLabel: 'Indique las inconsistencias normativas detectadas',
      inputPlaceholder: 'Escriba aquí...',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Confirmar Rechazo',
      inputValidator: (value) => !value && 'El motivo es obligatorio'
    });

    if (motivo) {
      try {
        await dispatch(rechazarCoordinador({ id, motivo })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA RECHAZADA!</span>',
          text: 'La solicitud ha sido devuelta a la unidad de origen para corrección.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        Swal.fire('Error', error || 'No se pudo procesar el rechazo', 'error');
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'revision_coordinador': return 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse';
      case 'autorizada': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rechazada_coordinador': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'revision_coordinador': return 'Revisión Coord.';
      case 'autorizada': return 'Autorizada';
      case 'rechazada_coordinador': return 'Rechazada Coord.';
      default: return status.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header } */}
      <div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
             <ShieldCheck className="text-white" size={28} />
          </div>
          Validación del Coordinador
        </h2>
        <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
          Revisión Normativa de Transferencias Institucionales
        </p>
      </div>

      {/* { buscador y filtros } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="BUSCAR POR FOLIO O UNIDAD..." 
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-4">
              <select 
                value={filters.estatus}
                onChange={(e) => setFilters({...filters, estatus: e.target.value})}
                className="pl-6 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="revision_coordinador">Pendientes de Validar</option>
                <option value="todos">Todos los Estatus</option>
                <option value="autorizada">Autorizadas</option>
              </select>
           </div>
        </div>
      </div>

      {/* { tabla } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-4 text-[#7A152E]">
            <Loader2 className="animate-spin" size={48} />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Cargando Solicitudes...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Unidad de Origen</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Folio Solicitud</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado Actual</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Validación Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center text-gray-300 font-black uppercase text-xs tracking-widest">
                      <Archive className="mx-auto mb-4 opacity-10" size={64} />
                      No hay solicitudes pendientes de validación
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Building size={16} className="text-slate-400" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-slate-700 font-black text-xs uppercase truncate max-w-[250px]" title={t.unidad_origen?.nombre}>
                               {t.unidad_origen?.nombre}
                             </span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 italic">
                               RAT: {t.usuario_envia ? `${t.usuario_envia.nombre} ${t.usuario_envia.apellido_paterno} ${t.usuario_envia.apellido_materno || ''}` : '---'}
                             </span>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className="text-[#7A152E] font-black text-sm">{t.numero_transferencia}</span>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Autorizado TUA: {new Date(t.updated_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-7">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${t.tipo === 'primaria' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                           {t.tipo}
                        </span>
                      </td>
                      <td className="px-8 py-7">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border whitespace-nowrap ${getStatusStyle(t.estatus)}`}>
                            {getStatusLabel(t.estatus)}
                        </span>
                      </td>
                      <td className="px-8 py-7 text-center">
                         <div className="flex justify-center gap-2">
                            {t.estatus === 'revision_coordinador' && (user?.role?.slug === 'coord_archivos' || user?.role?.slug === 'admin_ti') && (
                              <>
                                <button 
                                  onClick={() => handleValidar(t.id)}
                                  className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                >
                                  Validar
                                </button>
                                <button 
                                  onClick={() => handleRechazar(t.id)}
                                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md active:scale-95"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleView(t.id)}
                              className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-[#7A152E] transition-all"
                            >
                               <Eye size={18} />
                            </button>
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

      <TransferenciaView 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        record={selectedRecord}
      />
    </div>
  );
};

export default RevisionTransferenciasPage;
