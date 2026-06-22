import React from 'react';
import { 
  X, 
  Bookmark, 
  ShieldAlert, 
  Clock, 
  ShieldCheck, 
  FileText,
  Layers,
  MapPin,
  Hash,
  Building,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../ModalPortal';

const SerieView = ({ isOpen, onClose, serie }) => {
  if (!serie) return null;

  const vigenciaTotal = (parseInt(serie.vigencia_tramite) || 0) + (parseInt(serie.vigencia_concentracion) || 0);

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="overlay-blur-full flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
            >
              {/* { header institucional compacto } */}
              <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC955B]/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-[#BC955B] border border-white/10 shadow-inner">
                    <Bookmark size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight leading-none uppercase">Detalle de Serie</h3>
                    <p className="text-[#BC955B] text-[8px] font-black uppercase tracking-[0.4em] mt-1.5">Clasificación Archivística ISEM</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-xl transition-all shadow-xl active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* { identificación principal } */}
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <span className="bg-[#7A152E]/5 text-[#7A152E] px-3 py-1.5 rounded-lg font-black text-[10px] border border-[#7A152E]/10 tracking-widest">
                        {serie.codigo}
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Serie Documental
                      </span>
                   </div>
                   <h4 className="text-xl font-black text-slate-800 leading-tight uppercase">{serie.nombre}</h4>
                   <p className="text-[10px] font-black text-[#BC955B] uppercase tracking-widest flex items-center gap-2">
                     <Layers size={12} /> Sección: {serie.seccion?.nombre || 'N/A'}
                   </p>
                </div>

                {/* { información física y de volumen } */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <div className="bg-[#BC955B]/5 p-4 rounded-[1.5rem] border border-[#BC955B]/10 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[#BC955B]">
                         <Hash size={14} />
                         <p className="text-[7px] font-black uppercase tracking-widest">Metros Lineales</p>
                      </div>
                      <p className="text-base font-black text-slate-700">{serie.metros_lineales || 0} m</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[#7A152E]">
                         <Building size={14} />
                         <p className="text-[7px] font-black uppercase tracking-widest">Sede / Edificio</p>
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 truncate">{serie.edificio_sede || 'N/A'}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[#7A152E]">
                         <MapPin size={14} />
                         <p className="text-[7px] font-black uppercase tracking-widest">Área Resguardo</p>
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 truncate">{serie.area_resguardo || 'N/A'}</p>
                   </div>
                </div>

                {/* { descripción } */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                   <h5 className="text-[9px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2">
                     <FileText size={12} /> Alcance y Descripción
                   </h5>
                   <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                     {serie.descripcion ? `"${serie.descripcion}"` : 'Sin descripción detallada.'}
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* { valores documentales } */}
                  <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2 ml-2">
                      <ShieldAlert size={12} /> Valores
                    </h5>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { label: 'Administrativo', active: serie.valor_administrativo },
                        { label: 'Legal', active: serie.valor_legal },
                        { label: 'Fiscal / Contable', active: serie.valor_fiscal_contable }
                      ].map(v => (
                        <div key={v.label} className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all ${v.active ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-transparent opacity-40'}`}>
                           <span className={`text-[9px] font-black uppercase tracking-tight ${v.active ? 'text-indigo-700' : 'text-gray-400'}`}>{v.label}</span>
                           {v.active ? <ShieldCheck size={14} className="text-indigo-600" /> : <X size={12} className="text-gray-300" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* { vigencias } */}
                  <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2 ml-2">
                      <Clock size={12} /> Plazos de Conservación
                    </h5>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="flex border-b border-slate-50 font-black">
                           <div className="flex-1 p-3 text-center border-r border-slate-50">
                              <p className="text-[7px] text-blue-500 uppercase">Trámite</p>
                              <p className="text-sm text-slate-700">{serie.vigencia_tramite} a</p>
                           </div>
                           <div className="flex-1 p-3 text-center">
                              <p className="text-[7px] text-amber-500 uppercase">Conc.</p>
                              <p className="text-sm text-slate-700">{serie.vigencia_concentracion} a</p>
                           </div>
                        </div>
                        <div className="bg-[#7A152E] p-2 text-center">
                           <p className="text-base font-black text-[#BC955B]">{vigenciaTotal} Años Totales</p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* { disposición final } */}
                <div className="space-y-3">
                  <h5 className="text-[9px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2 ml-2">
                    <Archive size={12} /> Disposición Final
                  </h5>
                  <div className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 ${
                      serie.disposicion_final === 'Historico' 
                        ? 'bg-purple-50 border-purple-100 text-purple-700' 
                        : serie.disposicion_final === 'Muestreo'
                        ? 'bg-blue-50 border-blue-100 text-blue-700'
                        : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                     <div className="flex items-center gap-3">
                        <Archive size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {serie.disposicion_final === 'Historico' ? 'Transferencia Secundaria (Histórico)' : serie.disposicion_final}
                        </span>
                     </div>
                     <p className="text-[8px] font-bold uppercase opacity-70">
                       {serie.disposicion_final === 'Historico' ? 'Conservación Permanente' : 'Destino Final Normativo'}
                     </p>
                  </div>
                </div>

              </div>

              {/* { footer compacto } */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
                <button 
                  onClick={onClose}
                  className="bg-white px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border border-slate-200 hover:text-[#7A152E] hover:border-[#7A152E] transition-all active:scale-95 shadow-sm"
                >
                  Cerrar Vista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

export default SerieView;
