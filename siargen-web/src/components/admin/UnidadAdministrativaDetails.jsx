import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Shield, 
  Search,
  Users,
  UserX,
  CheckCircle2,
  Calendar,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import ModalPortal from '../ModalPortal';

const UnidadAdministrativaDetails = ({ isOpen, onClose, unidad }) => {
  const [activeSearch, setActiveSearch] = useState('');
  const [inactiveSearch, setInactiveSearch] = useState('');

  if (!isOpen || !unidad) return null;

  const personalActivo = (unidad.personal || []).filter(p => p.activo);
  const personalInactivo = (unidad.personal || []).filter(p => !p.activo);

  const filteredActivo = personalActivo.filter(p => 
    p.nombre_completo.toLowerCase().includes(activeSearch.toLowerCase()) ||
    p.role?.nombre.toLowerCase().includes(activeSearch.toLowerCase())
  );

  const filteredInactivo = personalInactivo.filter(p => 
    p.nombre_completo.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
    p.role?.nombre.toLowerCase().includes(inactiveSearch.toLowerCase())
  );

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          {/* { header } */}
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#BC955B]/5 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-md">
                <Building className="text-[#BC955B]" size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Detalles de Unidad</h3>
                  <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${unidad.activo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {unidad.activo ? 'Operativa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
                  ISEM <span className="w-1 h-1 bg-white/20 rounded-full"></span> Estructura Orgánica
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
            
            {/* { 1. */}
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* { card: identidad } */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col h-full justify-between">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#7A152E] text-white px-3 py-1 rounded-lg font-black text-[10px] tracking-[0.2em] uppercase shadow-sm">
                          {unidad.codigo}
                        </span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificador Oficial</span>
                      </div>
                      
                      <h4 className="text-2xl font-black text-slate-800 leading-[1.1] uppercase break-words pr-4">
                        {unidad.nombre}
                      </h4>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <Calendar size={12} className="text-slate-300" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registrado el: {unidad.created_at}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* { card: contacto y ubicación } */}
              <div className="space-y-4">
                 <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-5 h-full">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block">Ubicación y Contacto</label>
                    <div className="space-y-5">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100/50">
                             <MapPin size={18} className="text-[#BC955B]" />
                          </div>
                          <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic break-words overflow-hidden">
                            {unidad.direccion}
                          </p>
                       </div>
                       <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100/50">
                             <Mail size={18} className="text-[#7A152E]" />
                          </div>
                          <p className="text-[11px] font-black text-slate-700 break-all overflow-hidden">
                            {unidad.email}
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50">
                             <Phone size={18} className="text-slate-500" />
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-slate-700">{unidad.telefono}</p>
                             {unidad.extension && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ext: {unidad.extension}</p>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* { 2. */}
            <div className="px-8 pb-8 space-y-10">
              
              {/* { personal activo } */}
              <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                         <CheckCircle2 size={20} className="text-green-600" />
                      </div>
                      <div>
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em]">Personal en Funciones</h4>
                         <p className="text-[8px] font-bold text-green-600/70 uppercase tracking-widest mt-0.5">Vigente</p>
                      </div>
                    </div>
                    
                    <div className="relative group min-w-[280px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Filtrar usuarios activos..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#7A152E]/30 focus:ring-4 focus:ring-[#7A152E]/5 transition-all text-[10px] font-bold text-slate-600"
                        value={activeSearch}
                        onChange={(e) => setActiveSearch(e.target.value)}
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {filteredActivo.length > 0 ? (
                     filteredActivo.map((p) => (
                       <div key={p.id} className="group bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                             <div className="relative">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-50">
                                   <User size={18} className="text-slate-400" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                             </div>
                             <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black text-slate-800 truncate leading-tight">{p.nombre_completo}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                   <Shield size={10} className="text-[#7A152E] shrink-0" />
                                   <p className="text-[8px] font-black text-[#7A152E] uppercase tracking-widest truncate">{p.role?.nombre}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-full py-10 flex flex-col items-center justify-center bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <Users size={32} className="text-slate-200 mb-2" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">No hay personal activo registrado</p>
                     </div>
                   )}
                 </div>
              </div>

              {/* { histórico de bajas } */}
              <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                         <UserX size={20} className="text-slate-500" />
                      </div>
                      <div>
                         <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Historial de Personal Inactivo</h4>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Personal Desvinculado</p>
                      </div>
                    </div>
                    
                    <div className="relative group min-w-[280px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Buscar en historial..."
                        className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-slate-300 transition-all text-[10px] font-bold text-slate-500"
                        value={inactiveSearch}
                        onChange={(e) => setInactiveSearch(e.target.value)}
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {filteredInactivo.length > 0 ? (
                     filteredInactivo.map((p) => (
                       <div key={p.id} className="bg-slate-100/50 border border-slate-200/50 p-4 rounded-[1.5rem] opacity-60 grayscale-[0.8]">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                                <User size={18} className="text-slate-300" />
                             </div>
                             <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-500 truncate">{p.nombre_completo}</p>
                                <div className="flex items-center gap-1.5">
                                   <Shield size={10} className="text-slate-400 shrink-0" />
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{p.role?.nombre}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-full py-10 flex flex-col items-center justify-center bg-transparent rounded-[2rem] border-2 border-dashed border-slate-200">
                        <UserX size={32} className="text-slate-200 mb-2" />
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Sin registros de bajas</p>
                     </div>
                   )}
                 </div>
              </div>

            </div>
          </div>

          {/* { footer estadístico } */}
          <div className="p-6 bg-[#0f172a] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8">
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-lg font-black text-white">{personalActivo.length}</span>
                 </div>
                 <span className="text-[8px] font-black text-green-500/60 uppercase tracking-widest">Activos</span>
               </div>

               <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-lg font-black text-white/40">{personalInactivo.length}</span>
                 </div>
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Bajas</span>
               </div>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-10 py-4 bg-[#BC955B] hover:bg-[#A6844A] text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95"
            >
              Cerrar Detalles
            </button>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default UnidadAdministrativaDetails;
