import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Loader2, 
  Archive, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowRight, 
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  Plus,
  Printer,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTransferencias, recibirTransferencia, rechazarRac } from '../../store/transferenciaSlice';
import TransferenciaView from '../../components/tramite/TransferenciaView';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const InventarioPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.transferencias);
  const allTransferencias = Array.isArray(items) ? items : [];
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes' o 'completadas'
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchRecords = useCallback((force = false) => {
    if (lastFetch && !force && allTransferencias.length > 0) return;
    dispatch(fetchTransferencias({ per_page: -1 }));
  }, [dispatch, lastFetch, allTransferencias.length]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    return allTransferencias.filter(t => {
      // Filtra transferencias con destino al archivo de concentración.
      const isPending = t.estatus === 'en_transito' || t.estatus === 'autorizada';
      const isCompleted = t.estatus === 'recibida';
      
      const matchesTab = activeTab === 'pendientes' ? isPending : isCompleted;
      if (!matchesTab) return false;

      const searchLower = searchTerm.toLowerCase();
      return !searchTerm || 
        t.numero_transferencia?.toLowerCase().includes(searchLower) ||
        t.unidad_origen?.nombre?.toLowerCase().includes(searchLower);
    });
  }, [allTransferencias, activeTab, searchTerm]);

  const handlePrint = async (id, folio) => {
    try {
        Swal.fire({
            title: 'Generando Documento...',
            html: 'Por favor espere mientras se crea el PDF oficial.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: { 
              container: 'z-[99999]',
              popup: 'rounded-[3rem] shadow-2xl border-none'
            }
        });

        const response = await api.get(`/transferencias/${id}/imprimir`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Inventario_${folio}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        Swal.fire({
            icon: 'success',
            title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡PDF Generado!</span>',
            text: 'El inventario de transferencia se ha descargado correctamente.',
            timer: 2000,
            showConfirmButton: false,
            iconColor: '#7A152E',
            customClass: { 
              popup: 'rounded-[3rem] shadow-2xl border-none',
              title: 'text-2xl py-10'
            }
        });
    } catch (error) {
        console.error('Print Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Impresión',
            text: 'No se pudo generar el documento PDF.',
            confirmButtonColor: '#7A152E',
            customClass: { 
              popup: 'rounded-[2rem]'
            }
        });
    }
  };

  const handleView = async (id) => {
    try {
        const response = await api.get(`/transferencias/${id}/detail`);
        setSelectedRecord(response.data.data);
        setIsViewOpen(true);
    } catch (error) {
        console.error('Detalle Error:', error);
        const msg = error.response?.data?.message || error.message || 'Error desconocido';
        Swal.fire({
            icon: 'error',
            title: 'Error de Lectura',
            text: String(msg),
            confirmButtonColor: '#7A152E',
            customClass: { popup: 'rounded-[2rem]' }
        });
    }
  };

  const handleRecibir = async (id) => {
    const result = await Swal.fire({
      title: '<span class="font-black text-[#7A152E] uppercase tracking-tighter">¿Confirmar Recepción?</span>',
      text: "Al recibir, los expedientes se integrarán oficialmente al Archivo de Concentración.",
      icon: 'question',
      iconColor: '#BC955B',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'SÍ, RECIBIR ACERVO',
      cancelButtonText: 'CANCELAR',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-[3rem] shadow-2xl border-none',
        title: 'text-2xl pt-10',
        confirmButton: 'rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest',
        cancelButton: 'rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest'
      }
    });

    if (result.isConfirmed) {
      try {
        await dispatch(recibirTransferencia(id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA RECIBIDA!</span>',
          text: 'El acervo ha sido integrado oficialmente al Archivo de Concentración.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error en Recepción',
            text: String(error || 'No se pudo recibir el acervo'),
            confirmButtonColor: '#7A152E',
            customClass: { popup: 'rounded-[2rem]' }
        });
      }
    }
  };

  const handleRechazarFisico = async (id) => {
    const { value: motivo } = await Swal.fire({
      title: '<span class="font-black text-[#7A152E] uppercase tracking-tighter">Rechazar Recepción</span>',
      input: 'textarea',
      inputLabel: 'Indique el motivo del rechazo (ej: cajas dañadas, faltantes)',
      inputPlaceholder: 'Escriba aquí el motivo...',
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'CONFIRMAR RECHAZO',
      cancelButtonText: 'CANCELAR',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-[3rem] shadow-2xl border-none',
        title: 'text-2xl pt-10',
        input: 'rounded-2xl font-bold text-sm shadow-inner',
        confirmButton: 'rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest',
        cancelButton: 'rounded-xl px-6 py-3 font-black text-[10px] uppercase tracking-widest'
      },
      inputValidator: (value) => !value && 'El motivo es obligatorio'
    });

    if (motivo) {
      try {
        await dispatch(rechazarRac({ id, motivo })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA RECHAZADA!</span>',
          text: 'La transferencia física ha sido devuelta a la unidad de origen.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        fetchRecords(true);
      } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al Procesar',
            text: String(error || 'No se pudo procesar el rechazo'),
            confirmButtonColor: '#7A152E',
            customClass: { popup: 'rounded-[2rem]' }
        });
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'autorizada': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'en_transito': return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
      case 'recibida': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rechazada_rac': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'autorizada': return 'Autorizada';
      case 'en_transito': return 'En Tránsito';
      case 'recibida': return 'Recibida';
      case 'rechazada_rac': return 'Rechazada RAC';
      default: return status.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header } */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
               <Truck className="text-white" size={28} />
            </div>
            Recepciones en Concentración
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
            Ingreso de Acervo al Archivo de Concentración
          </p>
        </div>
      </div>

      {/* { tabs } */}
      <div className="flex gap-4 p-2 bg-gray-100/50 rounded-[2rem] w-fit border border-gray-200/50">
        <button 
          onClick={() => setActiveTab('pendientes')}
          className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'pendientes' ? 'bg-white text-[#7A152E] shadow-xl' : 'text-gray-400'}`}
        >
          En Tránsito
        </button>
        <button 
          onClick={() => setActiveTab('completadas')}
          className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'completadas' ? 'bg-white text-[#7A152E] shadow-xl' : 'text-gray-400'}`}
        >
          Historial Recibidos
        </button>
      </div>

      {/* { buscador } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por folio o unidad de origen..."
            className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 uppercase shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* { tabla } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-4 text-[#7A152E]">
            <Loader2 className="animate-spin" size={48} />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Cargando Inventarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Procedencia</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Folio / Envío</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cajas/Expedientes</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                  <th className="px-8 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center text-gray-300 font-black uppercase text-xs tracking-widest">
                      No hay registros en esta sección
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                           <span className="text-slate-700 font-black text-xs uppercase truncate max-w-[300px]" title={t.unidad_origen?.nombre}>
                             {t.unidad_origen?.nombre}
                           </span>
                           <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 italic">
                             RAT: {t.usuario_envia ? `${t.usuario_envia.nombre} ${t.usuario_envia.apellido_paterno} ${t.usuario_envia.apellido_materno || ''}` : '---'}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className="text-[#7A152E] font-black text-sm">{t.numero_transferencia}</span>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                          {t.fecha_envio ? `Envío: ${new Date(t.fecha_envio).toLocaleDateString()}` : `Autorizada: ${new Date(t.fecha_validacion || t.updated_at).toLocaleDateString()}`}
                        </p>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-2">
                           <Archive size={14} className="text-[#BC955B]" />
                           <span className="text-[10px] font-black text-slate-600 uppercase">{t.expedientes?.length || 0} Expedientes</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border w-fit whitespace-nowrap ${getStatusStyle(t.estatus)}`}>
                            {getStatusLabel(t.estatus)}
                        </span>
                      </td>
                      <td className="px-8 py-7 text-center">
                         <div className="flex justify-center gap-2">
                            {t.estatus === 'en_transito' && (
                               <>
                                 <button 
                                   onClick={() => handleRecibir(t.id)}
                                   className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                 >
                                   <CheckCircle2 size={14} /> Recibir
                                 </button>
                                 <button 
                                   onClick={() => handleRechazarFisico(t.id)}
                                   className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                 >
                                   <XCircle size={14} /> Rechazar
                                 </button>
                               </>
                            )}

                            {activeTab === 'completadas' && (
                                <button 
                                  onClick={() => handlePrint(t.id, t.numero_transferencia)}
                                  disabled={isPrinting}
                                  className={`p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-[#7A152E] transition-all ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="Imprimir Inventario"
                                >
                                   {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                </button>
                            )}

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

export default InventarioPage;
