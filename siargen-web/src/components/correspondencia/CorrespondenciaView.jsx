import React from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  User, 
  Hash, 
  Clock, 
  Briefcase,
  ArrowRight,
  Eye,
  ChevronLeft,
  FileCheck,
  Archive
} from 'lucide-react';
import { motion } from 'framer-motion';
import ModalPortal from '../ModalPortal';

const CorrespondenciaView = ({ isOpen, onClose, record }) => {
  const [showPdf, setShowPdf] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setShowPdf(false);
    }
  }, [isOpen]);

  if (!isOpen || !record) return null;

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgente': return 'bg-red-50 text-red-600 border-red-100';
      case 'alta': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'media': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white w-full rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 z-[10000] transition-all duration-300 ${showPdf ? 'max-w-5xl' : 'max-w-2xl'}`}
        >
          {/* { header compacto } */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-3">
              {showPdf && (
                <button 
                  onClick={() => setShowPdf(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-lg transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <FileText size={18} className="text-[#BC955B]" />
                  {showPdf ? 'VISOR PDF' : 'DETALLE DE DOCUMENTO'}
                </h3>
                <p className="text-white/40 text-[7px] font-bold uppercase tracking-[0.2em]">
                  Folio: {record.folio_sistema}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-0 flex flex-col md:flex-row h-[75vh]">
            {/* { panel de datos compacto } */}
            <div className={`p-6 space-y-6 bg-white overflow-y-auto custom-scrollbar ${showPdf ? 'hidden lg:block lg:w-[400px] border-r border-gray-100' : 'w-full'}`}>
              
              {/* { grid de identificación y tiempos } */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* { identificación } */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em] border-b border-gray-100 pb-1.5 flex items-center gap-2">
                    <Hash size={12} /> Datos de Control
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Núm. Oficio / Referencia</p>
                      <p className="text-[11px] font-black text-slate-800">{record.num_oficio || 'SIN NÚMERO'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Clase de Documento</p>
                      <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                        {record.clase_documento || 'OFICIO'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Serie o subserie Archivística</p>
                      {record.subserie ? (
                        <div className="mt-1">
                          <p className="text-[10px] font-black text-emerald-600 leading-tight uppercase">{record.subserie.codigo}</p>
                          <p className="text-[9px] font-bold text-slate-500 line-clamp-1 italic uppercase">{record.subserie.nombre}</p>
                        </div>
                      ) : record.serie ? (
                        <div className="mt-1">
                          <p className="text-[10px] font-black text-[#7A152E] leading-tight uppercase">{record.serie.codigo}</p>
                          <p className="text-[9px] font-bold text-slate-500 line-clamp-1 italic uppercase">{record.serie.nombre}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-gray-300 uppercase italic">No clasificada</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* { tiempos y plazos } */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em] border-b border-gray-100 pb-1.5 flex items-center gap-2">
                    <Clock size={12} /> Plazos y Vigencia
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter" title="Fecha en la que se redactó o firmó el documento físico">Fecha del Documento <span className="normal-case font-bold text-gray-300 ml-1">(Emisión)</span></p>
                      <div className="flex items-center gap-2 text-slate-700 mt-0.5">
                        <Calendar size={12} className="text-[#7A152E]" />
                        <p className="text-[11px] font-black">{record.fecha}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter" title="Fecha máxima requerida para emitir una respuesta">Fecha Límite de Respuesta <span className="normal-case font-bold text-gray-300 ml-1">(Vencimiento)</span></p>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border mt-1 ${record.fecha_limite_respuesta ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-300 border-gray-100 opacity-50'}`}>
                        <Clock size={12} />
                        <p className="text-[10px] font-black uppercase">
                          {record.fecha_limite_respuesta || 'SIN PLAZO DEFINIDO'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Integridad (Fojas)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[11px] font-black border border-indigo-100">
                           {record.num_fojas || 1} Hojas Físicas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* { flujo y responsabilidad } */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em] border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <User size={12} /> Responsabilidad y Turnado
                </h4>
                <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Procedencia</span>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-tight mt-1 break-words">
                          {record.tipo === 'entrada' 
                            ? (record.remitente || 'EXTERNO') 
                            : (record.unidad_administrativa?.nombre || 'ISEM')}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 shrink-0 mt-2">
                      <ArrowRight size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Destino / Turnado</span>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-tight mt-1 break-words">
                          {record.tipo === 'salida' 
                            ? (record.destinatario || 'DESTINATARIO') 
                            : (record.unidad_administrativa?.nombre || 'UNIDAD INTERNA')}
                        </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[8px] font-black text-gray-400 uppercase">Registrado por:</span>
                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                          {record.usuario?.nombre ? `${record.usuario.nombre} ${record.usuario.apellido_paterno || ''} ${record.usuario.apellido_materno || ''}`.trim() : 'SISTEMA'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[8px] font-black text-gray-400 uppercase">Prioridad:</span>
                       <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase border ${getPriorityColor(record.prioridad)}`}>
                          {record.prioridad}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* { asunto } */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em] border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <Briefcase size={12} /> Asunto / Extracto
                </h4>
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic uppercase text-justify whitespace-pre-wrap break-words">
                    {record.asunto}
                  </p>
                </div>
              </div>

              {/* { expediente vinculado } */}
              {record.expediente && (
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-50 pb-1.5 flex items-center gap-2">
                    <FileCheck size={12} /> Expediente de Archivo
                  </h4>
                  <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Archive size={20} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">{record.expediente.numero_expediente}</p>
                        <p className="text-[9px] font-bold text-slate-500 truncate uppercase mt-0.5">{record.expediente.titulo || 'SIN TÍTULO'}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[7px] font-black uppercase tracking-widest">
                             Fase: {record.expediente.fase || 'Trámite'}
                           </span>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* { acciones de digitalización } */}
              {record.documento_pdf_url && (
                <div className="pt-2">
                    <button 
                        onClick={() => setShowPdf(true)}
                        className="w-full flex items-center justify-center gap-2 bg-[#7A152E] text-white font-black text-[9px] uppercase py-2.5 rounded-xl hover:bg-[#8d1d37] transition-all shadow-md"
                    >
                        <Eye size={14} /> Visualizar Documento Digital
                    </button>
                </div>
              )}

              {/* { metadata footer } */}
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[7px] font-black text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <User size={10} className="text-[#7A152E]" /> {record.usuario?.nombre ? `${record.usuario.nombre} ${record.usuario.apellido_paterno || ''} ${record.usuario.apellido_materno || ''}`.trim() : 'SISTEMA'}
                </span>
                <span>REGISTRO: {record.created_at}</span>
              </div>
            </div>

            {/* { visor pdf } */}
            {showPdf && record.documento_pdf_url && (
              <div className="flex-1 bg-gray-100 relative h-full min-h-[500px]">
                <iframe 
                  src={`${record.documento_pdf_url}#toolbar=0&navpanes=0`} 
                  className="w-full h-full border-none"
                  title="Documento PDF"
                />
              </div>
            )}
          </div>

          {!showPdf && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-gray-100 transition-all active:scale-95">
                    Cerrar Ficha
                </button>
            </div>
          )}
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default CorrespondenciaView;
