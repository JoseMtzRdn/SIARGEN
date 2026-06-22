import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Loader2, 
  UserCheck, 
  Eye, 
  CheckCircle, 
  XCircle,
  FileText,
  Building,
  Clock,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTransferencias, autorizarTua, rechazarTua } from '../../store/transferenciaSlice';
import TransferenciaView from '../../components/tramite/TransferenciaView';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const AutorizacionTuaPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.transferencias);
  const transferencias = Array.isArray(items) ? items : [];
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = useCallback((force = false) => {
    if (lastFetch && !force) return;
    dispatch(fetchTransferencias({ per_page: -1 }));
  }, [dispatch, lastFetch]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    return transferencias.filter(t => {
      // Carga las transferencias pendientes de autorización por el TUA.
      const matchesStatus = t.estatus === 'revision_tua';
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        t.numero_transferencia?.toLowerCase().includes(searchLower) ||
        t.usuario_envia?.nombre?.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [transferencias, searchTerm]);

  const handleView = async (id) => {
    try {
        const response = await api.get(`/transferencias/${id}/detail`);
        setSelectedRecord(response.data.data);
        setIsViewOpen(true);
    } catch (error) {
        const msg = error.response?.data?.message || 'No se pudo recuperar el detalle';
        Swal.fire('Error', msg, 'error');
    }
  };

  const handleAutorizar = async (id) => {
    const result = await Swal.fire({
      title: '¿Autorizar Transferencia?',
      text: "Al autorizar, la solicitud pasará a validación técnica del Coordinador de Archivos institucional.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Sí, autorizar firma',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(autorizarTua(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA AUTORIZADA!</span>',
          text: 'La solicitud ha sido enviada al Coordinador para su validación técnica.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        Swal.fire('Error', error || 'No se pudo autorizar', 'error');
      }
    }
  };

  const handleRechazar = async (id) => {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Solicitud',
      input: 'textarea',
      inputLabel: 'Indique el motivo del rechazo para conocimiento del área solicitante',
      inputPlaceholder: 'Escriba aquí...',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Confirmar Rechazo',
      inputValidator: (value) => !value && 'El motivo es obligatorio'
    });

    if (motivo) {
      try {
        await dispatch(rechazarTua({ id, motivo })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA RECHAZADA!</span>',
          text: 'La solicitud ha sido devuelta al responsable del área.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        Swal.fire('Error', error || 'No se pudo procesar', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header } */}
      <div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
             <UserCheck className="text-white" size={28} />
          </div>
          Autorizaciones de Transferencia
        </h2>
        <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
          Firma y Visto Bueno del Titular • {user?.unidad_administrativa?.nombre}
        </p>
      </div>

      {/* { buscador } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por folio o responsable de área..."
            className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* { tabla } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-40 flex flex-col items-center gap-6 text-[#7A152E]">
            <Loader2 className="animate-spin" size={64} />
            <span className="font-black uppercase tracking-[0.2em] text-sm">Cargando Solicitudes...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Área Solicitante (Responsable)</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Folio / Tipo</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Contenido</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones de Firma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold">No hay firmas pendientes para tu unidad administrativa</td>
                    </tr>
                ) : (
                    filteredRecords.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-10 py-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black shrink-0">
                                        {t.usuario_envia?.nombre?.charAt(0)}
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <span className="text-slate-700 font-black text-xs uppercase block truncate">
                                            {t.usuario_envia?.nombre} {t.usuario_envia?.apellido_paterno} {t.usuario_envia?.apellido_materno}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                            {t.tipo?.toLowerCase() === 'primaria' ? 'Responsable de Archivo de Trámite' : 'Responsable de Archivo de Concentración'}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <span className="text-[#7A152E] font-black text-sm">{t.numero_transferencia}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.tipo === 'primaria' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                                        {t.tipo}
                                    </span>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase">
                                        {t.expedientes?.length || 0} Expedientes
                                    </span>
                                </div>
                            </td>
                            <td className="px-10 py-8 text-center">
                                <div className="flex justify-center gap-3">
                                    <button 
                                        onClick={() => handleAutorizar(t.id)}
                                        className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={14} /> Autorizar
                                    </button>
                                    <button 
                                        onClick={() => handleRechazar(t.id)}
                                        className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md flex items-center gap-2"
                                    >
                                        <XCircle size={14} /> Rechazar
                                    </button>
                                    <button 
                                        onClick={() => handleView(t.id)}
                                        className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-[#7A152E]"
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

export default AutorizacionTuaPage;
