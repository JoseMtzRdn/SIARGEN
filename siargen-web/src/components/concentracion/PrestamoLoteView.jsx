import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  RotateCcw, 
  Calendar, 
  Search, 
  MapPin, 
  User, 
  Building2, 
  Eye, 
  ShieldCheck, 
  Archive, 
  Layers, 
  Info,
  Clock,
  MessageSquare,
  ArrowRightCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../ModalPortal';
import ExpedienteView from '../tramite/ExpedienteView';

const PrestamoLoteView = ({ isOpen, onClose, prestamo, onDevolucion, isCoordinator = false }) => {
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  if (!isOpen || !prestamo) return null;

  const handleViewExpediente = (exp) => {
    setSelectedExpediente(exp);
    setIsViewOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'bueno': return 'text-green-600 bg-green-50 border-green-100';
      case 'completo': return 'text-green-600 bg-green-50 border-green-100';
      case 'regular': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'incompleto': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'malo': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000] flex flex-col h-[85vh]"
        >
          {/* { header compacto } */}
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md">
                    <FileText size={28} className="text-[#BC955B]" />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-white tracking-tighter leading-none uppercase">Detalle del Vale</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${prestamo.estatus === 'prestado' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30'}`}>
                            {prestamo.estatus === 'prestado' ? 'Activo' : 'Completado'}
                        </span>
                    </div>
                    <p className="text-[#BC955B] text-[10px] font-black uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                        {prestamo.folio_prestamo}
                        <span className="w-1 h-1 bg-[#BC955B] rounded-full opacity-50" />
                        <span className="opacity-80 tracking-widest">{prestamo.fase === 1 || prestamo.fase === 'tramite' ? 'Trámite' : 'Concentración'}</span>
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-xl transition-all shadow-lg active:scale-90">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
            <div className="p-6 space-y-6">
              
              {/* { grid de información del solicitante } */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* { unidad que presta } */}
                  <div className="lg:col-span-3 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                      <div>
                          <p className="text-[9px] font-black text-[#7A152E] uppercase tracking-widest mb-0.5">Unidad Administrativa Responsable</p>
                          <p className="text-sm font-black text-gray-800 uppercase leading-tight">{prestamo.unidad_administrativa?.nombre || 'UNIDAD NO IDENTIFICADA'}</p>
                      </div>
                  </div>

                  {/* { datos del solicitante } */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                          <User size={16} className="text-[#7A152E]" />
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información del Solicitante</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Nombre Completo</p>
                              <p className="text-sm font-black text-gray-800 uppercase leading-tight">{prestamo.nombre_completo}</p>
                              <p className="text-[10px] font-bold text-[#7A152E] uppercase tracking-tight mt-1">{prestamo.cargo_solicitante}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Unidad Solicitante</p>
                              <p className="text-sm font-black text-gray-800 uppercase leading-tight">{prestamo.unidad_solicitante || 'EXTERNA'}</p>
                              <div className="flex items-center gap-2 text-gray-400 mt-1.5">
                                  <Clock size={10} />
                                  <span className="text-[9px] font-bold uppercase tracking-tighter">Tel: {prestamo.telefono} {prestamo.extension ? `(${prestamo.extension})` : ''}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* { tiempos del vale - diseño simplificado } */}
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-[#7A152E]" />
                          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fechas del Vale</h4>
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-500 uppercase tracking-tight">Emisión:</span>
                              <span className="font-black text-gray-700">{prestamo.fecha_prestamo}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-500 uppercase tracking-tight">Vence:</span>
                              <span className={`font-black ${prestamo.vencido && prestamo.estatus === 'prestado' ? 'text-red-600' : 'text-gray-700'}`}>{prestamo.fecha_vencimiento}</span>
                          </div>
                          {prestamo.estatus === 'devuelto' && (
                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-gray-100">
                                <span className="font-bold text-green-600 uppercase tracking-tight">Cierre:</span>
                                <span className="font-black text-green-700">{prestamo.fecha_devolucion || '---'}</span>
                            </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* { lista de expedientes - compacta } */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-[#7A152E] text-white rounded-lg flex items-center justify-center shadow-md">
                              <Layers size={14} />
                          </div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Expedientes en Resguardo ({prestamo.detalles?.length})</h4>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                      {prestamo.detalles?.map((d) => (
                          <div key={d.id} className="group bg-white rounded-[1.5rem] border border-gray-100 hover:border-[#7A152E]/10 hover:shadow-xl transition-all overflow-hidden flex flex-col shadow-sm">
                              <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex gap-4 items-start flex-1 overflow-hidden">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border ${d.estatus === 'prestado' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
                                          <FileText size={24} />
                                      </div>
                                      <div className="overflow-hidden space-y-1">
                                          <div className="flex items-center gap-2">
                                              <span className="px-2 py-0.5 bg-gray-50 text-[#7A152E] rounded-md text-[9px] font-black uppercase tracking-tighter border border-gray-100">
                                                {d.expediente?.numero_expediente}
                                              </span>
                                              <button onClick={() => handleViewExpediente(d.expediente)} className="p-1 text-gray-300 hover:text-[#7A152E] transition-all">
                                                  <Eye size={14} />
                                              </button>
                                              {d.estatus === 'devuelto' ? (
                                                <span className="text-[8px] font-black text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Recibido</span>
                                              ) : (
                                                <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Pendiente</span>
                                              )}
                                          </div>
                                          <h5 className="text-sm font-black text-gray-800 uppercase leading-none tracking-tight truncate max-w-[400px] group-hover:text-[#7A152E] transition-colors">{d.expediente?.titulo}</h5>
                                          
                                          <div className="flex flex-wrap items-center gap-x-4 pt-0.5">
                                              <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                  <Archive size={10} className="text-[#BC955B]" /> 
                                                  <span className="truncate max-w-[150px]">{d.expediente?.subserie?.nombre || d.expediente?.serie?.nombre}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                  <MapPin size={10} className="text-slate-400" />
                                                  S:{d.expediente?.ubicacion_seccion || '-'} · B:{d.expediente?.ubicacion_bateria || '-'}
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                                      {d.estatus === 'prestado' ? (
                                          !isCoordinator && (
                                              <button 
                                                  onClick={() => onDevolucion(d.id, d.estado_salida)}
                                                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all shadow-md"
                                              >
                                                  <RotateCcw size={14} />
                                                  Registrar Devolución
                                              </button>
                                          )
                                      ) : (
                                          <div className="w-full md:w-auto flex flex-col items-end gap-1">
                                              <div className="flex items-center gap-1 text-green-600">
                                                  <ShieldCheck size={12} />
                                                  <span className="text-[9px] font-black uppercase tracking-widest">Liberado</span>
                                              </div>
                                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Entrada: {d.fecha_devolucion}</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                              
                              <div className="bg-gray-50/30 border-t border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-4">
                                      <div className="space-y-1">
                                          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Salida</p>
                                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(d.estado_salida)}`}>
                                              {d.estado_salida || 'BUENO'}
                                          </div>
                                      </div>
                                      {d.estatus === 'devuelto' && (
                                          <>
                                            <ArrowRightCircle className="text-gray-300" size={16} />
                                            <div className="space-y-1">
                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Retorno</p>
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(d.estado_devolucion)}`}>
                                                    {d.estado_devolucion || '---'}
                                                </div>
                                            </div>
                                          </>
                                      )}
                                  </div>
                                  
                                  {d.observaciones_devolucion && (
                                      <div className="flex gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                          <MessageSquare size={12} className="text-[#7A152E] shrink-0 mt-0.5" />
                                          <p className="text-[10px] font-bold text-gray-600 leading-tight italic truncate" title={d.observaciones_devolucion}>"{d.observaciones_devolucion}"</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* { observaciones generales - compactas } */}
              {prestamo.observaciones && (
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                          <Info size={16} className="text-[#7A152E]" />
                          <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Observaciones Generales</h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{prestamo.observaciones}</p>
                      </div>
                  </div>
              )}
            </div>
          </div>

          {/* { footer compacto } */}
          <div className="bg-white p-5 flex justify-between items-center border-t border-gray-100 shrink-0 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                    <Calendar size={16} />
                </div>
                <div>
                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Registro</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{prestamo.created_at}</p>
                </div>
             </div>
             
             <div className="flex flex-col items-end">
                {/* { branding removido } */}
             </div>
          </div>
        </motion.div>
      </div>

      {/* { detalle individual del expediente } */}
      <AnimatePresence>
        {isViewOpen && (
            <ExpedienteView
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                record={selectedExpediente}
            />
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

export default PrestamoLoteView;
