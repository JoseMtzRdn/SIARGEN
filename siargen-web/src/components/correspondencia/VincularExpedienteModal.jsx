import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Archive, Search, Bookmark, Folder, CheckCircle2, Loader2, FileText, FolderX } from 'lucide-react';
import { motion } from 'framer-motion';
import ModalPortal from '../ModalPortal';
import { archivarCorrespondencia } from '../../store/correspondenciaSlice';
import { alerts } from '../../utils/alerts';
import api from '../../api/axios';

const VincularExpedienteModal = ({ isOpen, onClose, onSuccess, record }) => {
  const dispatch = useDispatch();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState(null);
  const [usedFilter, setUsedFilter] = useState('');

  useEffect(() => {
    if (isOpen && record) {
      loadExpedientes();
      setSelectedExpedienteId(null);
      setSearchTerm('');
    }
  }, [isOpen, record]);

  const loadExpedientes = async () => {
    setLoading(true);
    try {
      let params = { 
        per_page: -1,
        fase: 'tramite',
        estatus_disponibilidad: 'disponible',
        // Permitimos vincular expedientes abiertos o en estado de subsanación.
        'estado_archivo[]': ['abierto', 'subsanacion'], 
        unidad_administrativa_id: record.unidad_administrativa_id 
      };

      const hasSubserie = !!record.subserie_id;
      const hasSerie = !!record.serie_id;

      // caso 1: tiene subserie (filtro más estricto)
      if (hasSubserie) {
          params.subserie_id = record.subserie_id;
          setUsedFilter('SUBSERIE ESPECÍFICA');
      } 
      // caso 2: tiene solo serie
      else if (hasSerie) {
          params.serie_id = record.serie_id;
          setUsedFilter('SERIE ESPECÍFICA');
      } 
      else {
          setUsedFilter('GENERAL (DOCUMENTO SIN CLASIFICAR)');
      }

      let res = await api.get('/expedientes', { params });
      let data = res.data.data?.data || res.data.data || [];
      
      setExpedientes(data);
    } catch (error) {
      alerts.error('Error al cargar los expedientes disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedExpedienteId) return;
    setSubmitting(true);
    try {
      await dispatch(archivarCorrespondencia({ id: record.id, expedienteId: selectedExpedienteId })).unwrap();
      alerts.success(`El folio ${record.folio_sistema} ha sido vinculado correctamente al expediente.`, '¡DOCUMENTO ARCHIVADO!');
      onSuccess();
      onClose();
    } catch (error) {
      alerts.error(error || 'Error al archivar');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpedientes = expedientes.filter(exp => 
    exp.numero_expediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !record) return null;

  const clasificacionTexto = record.subserie 
    ? `${record.subserie.codigo} - ${record.subserie.nombre}` 
    : (record.serie ? `${record.serie.codigo} - ${record.serie.nombre}` : 'SIN CLASIFICACIÓN DEFINIDA');

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4 z-[20000]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* { header } */}
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 sm:p-8 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                <Archive size={32} className="text-[#BC955B]" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Vincular a Expediente</h3>
                <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mt-1">Integración Documental • Oficialía de Partes</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 rounded-xl hover:bg-white hover:text-[#7A152E] transition-all duration-300"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col md:flex-row">
            
            {/* { panel izquierdo compacto: info del documento } */}
            <div className="w-full md:w-1/3 p-4 sm:p-6 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                
                <div className="bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-[#7A152E] border-b border-slate-200 pb-2">
                        <FileText size={16} />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Info del Documento</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Folio Sistema</p>
                                <p className="text-base font-black text-slate-800 tracking-tighter leading-none">{record.folio_sistema}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tipo</p>
                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${record.tipo?.toUpperCase() === 'ENTRADA' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                    {record.tipo}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Asunto / Extracto</p>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner max-h-[80px] overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] font-bold text-slate-600 italic leading-snug uppercase">"{record.asunto}"</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#BC955B]/5 p-4 rounded-2xl border border-[#BC955B]/10">
                    <div className="flex items-center gap-2 mb-2 border-b border-[#BC955B]/20 pb-2 text-[#BC955B]">
                        <Bookmark size={16} />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Clasificación</h4>
                    </div>
                    <p className="text-[11px] font-black text-slate-800 uppercase leading-snug">
                        {clasificacionTexto}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="bg-white px-2 py-1 rounded-md border border-[#BC955B]/30 shadow-sm text-[8px] font-black text-[#BC955B] uppercase tracking-widest">
                            {usedFilter}
                        </span>
                    </div>
                </div>

            </div>

            {/* { panel derecho: selección de expediente } */}
            <div className="w-full md:w-2/3 p-4 sm:p-6 flex flex-col h-full bg-slate-50/50">
                <div className="mb-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Buscar Expediente de Destino</label>
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por folio o título del expediente..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#7A152E] outline-none transition-all font-bold text-slate-700 shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-inner overflow-hidden flex flex-col min-h-[200px]">
                    <div className="bg-slate-100/80 p-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <Folder size={12} className="text-slate-400" /> Expedientes Disponibles
                        </h4>
                        <span className="text-[8px] font-black text-white bg-slate-400 px-2 py-0.5 rounded-full">{filteredExpedientes.length} encontrados</span>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar p-3 space-y-2 max-h-[220px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 py-10">
                                <Loader2 className="animate-spin" size={40} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cargando expedientes...</span>
                            </div>
                        ) : filteredExpedientes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 py-10">
                                <FolderX size={56} className="text-slate-200" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-center px-6">No se encontraron expedientes abiertos para esta serie o subserie</span>
                            </div>
                        ) : (
                            filteredExpedientes.map(exp => (
                                <div 
                                    key={exp.id}
                                    onClick={() => setSelectedExpedienteId(exp.id)}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group
                                        ${selectedExpedienteId === exp.id 
                                            ? 'border-[#7A152E] bg-[#7A152E]/5 shadow-md' 
                                            : 'border-slate-100 hover:border-[#7A152E]/30 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm
                                            ${selectedExpedienteId === exp.id ? 'bg-[#7A152E] text-white' : 'bg-white text-slate-400 group-hover:text-[#7A152E] border border-slate-200'}`}>
                                            <Folder size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className={`text-sm font-black uppercase transition-colors ${selectedExpedienteId === exp.id ? 'text-[#7A152E]' : 'text-slate-800'}`}>
                                                {exp.numero_expediente}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase line-clamp-1 max-w-[350px]">
                                                {exp.titulo}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        {selectedExpedienteId === exp.id ? (
                                            <div className="w-8 h-8 rounded-full bg-[#7A152E] text-white flex items-center justify-center shadow-md">
                                                <CheckCircle2 size={18} />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 group-hover:border-[#7A152E]/30"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

          </div>

          {/* { footer actions } */}
          <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-4 shrink-0">
            <button 
                onClick={onClose} 
                className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
            >
                Cancelar
            </button>
            <button 
                onClick={handleArchive}
                disabled={!selectedExpedienteId || submitting}
                className="px-10 py-4 bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
                Confirmar Vinculación
            </button>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default VincularExpedienteModal;
