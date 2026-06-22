import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Building, 
  User, 
  Calendar, 
  Archive, 
  Hash,
  ShieldCheck,
  Clock,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../ModalPortal';
import ExpedienteView from './ExpedienteView';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const TransferenciaView = ({ isOpen, onClose, record }) => {
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isExpedienteViewOpen, setIsExpedienteViewOpen] = useState(false);

  if (!isOpen || !record) return null;

  const handleExpedienteClick = async (exp) => {
    try {
      const response = await api.get(`/expedientes/${exp.id}`);
      setSelectedExpediente(response.data.data);
      setIsExpedienteViewOpen(true);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Lectura',
        text: 'No se pudo cargar el detalle del expediente',
        confirmButtonColor: '#7A152E',
        customClass: { popup: 'rounded-[2rem]' }
      });
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'elaboracion': 
        return { label: 'En Elaboración', style: 'bg-gray-100 text-gray-700 border-gray-200' };
      case 'revision_tua': 
        return { label: 'Revisión TUA', style: 'bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse' };
      case 'revision_coordinador': 
        return { label: 'Validación Técnica', style: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' };
      case 'autorizada': 
        return { label: 'Autorizada', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'en_transito': 
        return { label: 'En Tránsito', style: 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' };
      case 'recibida': 
        return { label: 'Recibida', style: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' };
      case 'rechazada_tua':
      case 'rechazada_coordinador':
      case 'rechazada_rac':
        return { label: 'Rechazada', style: 'bg-red-100 text-red-700 border-red-200' };
      default: 
        return { label: status?.toUpperCase(), style: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
  };

  const statusConfig = getStatusConfig(record.estatus);

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          {/* { header compacto } */}
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center relative">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-[#BC955B] uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/10">
                   Fase: {record.tipo?.toLowerCase() === 'primaria' ? 'Trámite ➔ Concentración' : 'Concentración ➔ Histórico'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mt-3 flex items-center gap-3">
                <ShieldCheck size={24} className="text-[#BC955B]" />
                SOLICITUD {record.numero_transferencia}
              </h3>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-90">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar bg-white">
            {/* { grid de información principal compacto } */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* { unidad origen } */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-[#BC955B]">
                  <Building size={12} />
                  <h4 className="text-[8px] font-black uppercase tracking-widest">Unidad Solicitante</h4>
                </div>
                <p className="text-[11px] font-black text-slate-800 uppercase leading-tight line-clamp-2">
                  {record.unidad_origen?.nombre || 'N/A'}
                </p>
                <span className="text-[8px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded border border-slate-100 inline-block">
                     CÓD: {record.unidad_origen?.codigo || '---'}
                </span>
              </div>

              {/* { responsables } */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-[#BC955B]">
                  <User size={12} />
                  <h4 className="text-[8px] font-black uppercase tracking-widest">Responsables</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Originó:</span>
                    <span className="text-[10px] font-bold text-slate-700 uppercase truncate" title={record.usuario_envia ? `${record.usuario_envia.nombre} ${record.usuario_envia.apellido_paterno} ${record.usuario_envia.apellido_materno || ''}` : 'Sistema'}>
                        {record.usuario_envia ? `${record.usuario_envia.nombre} ${record.usuario_envia.apellido_paterno} ${record.usuario_envia.apellido_materno || ''}` : 'Sistema'}
                    </span>
                  </div>
                  {record.usuario_recibe && (
                    <div className="flex flex-col border-t border-slate-200/50 pt-1">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Recibió:</span>
                      <span className="text-[10px] font-bold text-slate-700 uppercase truncate" title={`${record.usuario_recibe.nombre} ${record.usuario_recibe.apellido_paterno} ${record.usuario_recibe.apellido_materno || ''}`}>
                        {record.usuario_recibe.nombre} {record.usuario_recibe.apellido_paterno} {record.usuario_recibe.apellido_materno || ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* { estatus actual compacto } */}
              <div className="bg-[#7A152E]/5 p-4 rounded-2xl border border-[#7A152E]/10 flex flex-col justify-center items-center text-center space-y-3">
                <h4 className="text-[8px] font-black text-[#7A152E] uppercase tracking-widest">Estatus</h4>
                <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border tracking-widest shadow-sm ${statusConfig.style}`}>
                  {statusConfig.label}
                </div>
                <p className="text-[8px] font-bold text-gray-400 uppercase">Iniciado: {record.created_at}</p>
              </div>
            </div>

            {/* { listado de expedientes compacto } */}
            <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Archive size={16} className="text-[#7A152E]" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Acervo Vinculado</h4>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-emerald-100">
                    {record.expedientes?.length || 0} Registros
                  </span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {record.expedientes?.map((exp) => (
                    <div 
                      key={exp.id} 
                      onClick={() => handleExpedienteClick(exp)}
                      className="p-3.5 bg-white rounded-2xl border border-gray-100 flex items-start gap-3 hover:shadow-lg hover:border-[#7A152E]/20 transition-all group cursor-pointer active:scale-[0.98]"
                    >
                       <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner text-slate-400 group-hover:bg-[#7A152E] group-hover:text-white transition-colors shrink-0">
                          <FileText size={18} />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tight">{exp.titulo}</p>
                          <p className="text-[9px] font-bold text-[#BC955B] mt-0.5 tracking-tighter">{exp.numero_expediente}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                             <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                                <Calendar size={10} className="text-slate-300" /> {exp.año_apertura}
                             </div>
                             <div className="flex items-center gap-1 text-[8px] font-black text-[#7A152E] uppercase tracking-tighter">
                                <Archive size={10} className="text-[#BC955B]" /> {exp.subserie ? exp.subserie.nombre : exp.serie?.nombre}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* { sección de observaciones y motivo de rechazo } */}
            {(record.observaciones || record.motivo_rechazo) && (
              <div className="space-y-3">
                {record.observaciones && (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-amber-600" />
                      <h4 className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Observaciones del RAT</h4>
                    </div>
                    <p className="text-[10px] font-medium text-amber-900 italic leading-relaxed">
                      "{record.observaciones}"
                    </p>
                  </div>
                )}

                {record.motivo_rechazo && (
                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <XCircle size={32} />
                      </div>
                      <div>
                        <h4 className="text-red-900 font-black text-xl uppercase tracking-tighter leading-none mb-1">Transferencia Rechazada</h4>
                        <p className="text-red-700 font-bold text-sm leading-tight italic">
                          "{record.motivo_rechazo}"
                        </p>
                        <p className="text-[8px] font-black text-red-400 uppercase mt-2 tracking-widest">
                          * REGRESADO A FASE DE TRÁMITE PARA CORRECCIÓN
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-white text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
            >
              Cerrar Detalle
            </button>
          </div>
        </motion.div>
      </div>

      <ExpedienteView 
        isOpen={isExpedienteViewOpen}
        onClose={() => setIsExpedienteViewOpen(false)}
        record={selectedExpediente}
      />
    </ModalPortal>
  );
};

export default TransferenciaView;
