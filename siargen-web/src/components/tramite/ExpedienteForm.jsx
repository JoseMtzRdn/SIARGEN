import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, 
  Save, 
  Loader2, 
  FileText, 
  Calendar, 
  Archive,
  MapPin,
  List,
  Building,
  ChevronDown,
  Check,
  Search,
  Layers,
  Box,
  Hash,
  Bookmark,
  Info,
  AlertCircle,
  Zap,
  CornerDownRight,
  ArrowRightLeft
} from 'lucide-react';
import { createExpediente, updateExpediente, fetchExpedientes } from '../../store/expedienteSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import { fetchSecciones, fetchSeriesArchivistica, fetchSubseries } from '../../store/archivisticaSlice';
import { alerts } from '../../utils/alerts';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../ModalPortal';

const ExpedienteForm = ({ isOpen, onClose, onSuccess, record = null }) => {
  const dispatch = useDispatch();
  const { secciones, series, subseries } = useSelector((state) => state.archivistica);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = React.useRef(null);

  const isAdmin = user?.role?.slug === 'admin_ti';
  const isRat = user?.role?.slug === 'rat';
  const isEdit = !!record;

  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      año_apertura: new Date().getFullYear(),
      unidad_administrativa_id: '',
      clasificacion_informacion: 'publica',
      serie_id: '',
      subserie_id: '',
      seccion_id: '',
      ubicacion_seccion: '',
      ubicacion_bateria: '',
      ubicacion_modulo: '',
      ubicacion_entrepaño: '',
      ubicacion_caja: '',
      numero_cajas: 1
    }
  });

  const selectedSerieId = watch('serie_id');
  const selectedSubserieId = watch('subserie_id');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hierarchicalCatalog = useMemo(() => {
    const list = [];
    series.items.forEach(s => {
      list.push({ id: s.id, type: 'SERIE', codigo: s.codigo, nombre: s.nombre, seccion_id: s.seccion_id, has_subseries: s.subseries_count > 0, selectable: s.subseries_count === 0, full_text: `${s.codigo} ${s.nombre}`.toLowerCase(), data: s });
      const children = subseries.items.filter(ss => ss.serie_id === s.id);
      children.forEach(ss => {
        list.push({ id: ss.id, serie_id: ss.serie_id, type: 'SUBSERIE', codigo: ss.codigo, nombre: ss.nombre, selectable: true, full_text: `${ss.codigo} ${ss.nombre}`.toLowerCase(), data: ss });
      });
    });
    return list;
  }, [series.items, subseries.items]);

  const filteredResults = useMemo(() => {
    if (globalSearch === '') return hierarchicalCatalog;
    return hierarchicalCatalog.filter(item => item.full_text.includes(globalSearch.toLowerCase()));
  }, [hierarchicalCatalog, globalSearch]);

  const currentSelection = useMemo(() => {
    if (selectedSubserieId) {
      const ss = subseries.items.find(s => s.id === parseInt(selectedSubserieId));
      return ss ? { type: 'SUBSERIE', ...ss } : null;
    }
    if (selectedSerieId) {
      const s = series.items.find(s => s.id === parseInt(selectedSerieId));
      return s ? { type: 'SERIE', ...s } : null;
    }
    return null;
  }, [selectedSerieId, selectedSubserieId, series.items, subseries.items]);

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const updateCadidoFields = (source) => {
    if (!source) return;
    setValue('valor_administrativo', !!source.valor_administrativo);
    setValue('valor_legal', !!source.valor_legal);
    setValue('valor_fiscal', !!source.valor_fiscal_contable);
    setValue('valor_contable', !!source.valor_fiscal_contable);
    setValue('tiempo_tramite', source.vigencia_tramite);
    setValue('tiempo_concentracion', source.vigencia_concentracion);
    setValue('tiempo_historico', source.disposicion_final ? source.disposicion_final.toUpperCase() : 'BAJA');
  };

  useEffect(() => {
    if (isOpen) {
      if (!secciones.lastFetch) dispatch(fetchSecciones());
      if (!series.lastFetch) dispatch(fetchSeriesArchivistica());
      if (!subseries.lastFetch) dispatch(fetchSubseries({ per_page: -1 }));
      if (isAdmin) {
        dispatch(fetchUnidadesCatalog());
      }

      if (record) {
        reset({
          serie_id: record.serie?.id || '',
          subserie_id: record.subserie?.id || '',
          seccion_id: record.seccion_id || '',
          unidad_administrativa_id: record.unidad_administrativa?.id,
          titulo: record.titulo,
          observaciones: record.observaciones || '',
          año_apertura: record.año_apertura,
          ubicacion_seccion: record.ubicacion_seccion || '',
          ubicacion_bateria: record.ubicacion_bateria || '',
          ubicacion_modulo: record.ubicacion_modulo || '',
          ubicacion_entrepaño: record.ubicacion_entrepaño || '',
          ubicacion_caja: record.ubicacion_caja || '',
          numero_cajas: record.numero_cajas || 1,
          clasificacion_informacion: record.clasificacion_informacion || 'publica'
        });
        
        const fuente = record.subserie || record.serie;
        if (fuente) updateCadidoFields(fuente);
      } else {
        reset({
          serie_id: '',
          subserie_id: '',
          seccion_id: '',
          año_apertura: new Date().getFullYear(),
          titulo: '',
          observaciones: '',
          unidad_administrativa_id: user?.unidad_administrativa_id || '',
          clasificacion_informacion: 'publica',
          ubicacion_seccion: '',
          ubicacion_bateria: '',
          ubicacion_modulo: '',
          ubicacion_entrepaño: '',
          ubicacion_caja: '',
          numero_cajas: 1
        });
      }
    }
  }, [isOpen, record, reset, isAdmin, dispatch, user, secciones.lastFetch, series.lastFetch, subseries.lastFetch]);

  const handleSelect = (item) => {
    if (!item.selectable) return;
    
    if (item.type === 'SERIE') {
      setValue('serie_id', item.id); 
      setValue('subserie_id', ''); 
      setValue('seccion_id', item.seccion_id);
    } else {
      const parentSerie = series.items.find(s => s.id === item.serie_id);
      setValue('serie_id', item.serie_id); 
      setValue('subserie_id', item.id); 
      setValue('seccion_id', parentSerie?.seccion_id || '');
    }

    if (item.data) updateCadidoFields(item.data);
    
    setGlobalSearch('');
    setIsDropdownOpen(false);
  };

  const onSubmit = async (data) => {
    if (!selectedSerieId && !selectedSubserieId) {
        alerts.warning('Debe seleccionar una serie o subserie para poder abrir el expediente.', 'CLASIFICACIÓN REQUERIDA');
        return;
    }
    setLoading(true);
    try {
      const payload = {
        ...data,
        numero_expediente: isEdit ? record.numero_expediente : 'PENDIENTE',
      };

      if (isEdit) {
        await dispatch(updateExpediente({ id: record.id, data: payload })).unwrap();
        alerts.success('Expediente actualizado correctamente');
      } else {
        await dispatch(createExpediente(payload)).unwrap();
        alerts.success('Expediente abierto correctamente');
      }
      onSuccess();
      onClose();
    } catch (error) {
      alerts.error(error.message || 'Error al procesar el expediente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden z-[10000]"
        >
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <Archive size={28} className="text-[#BC955B]" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{isEdit ? 'Editar Expediente' : 'Apertura de Expediente'}</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Gestión de Acervo Documental ISEM</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
            {/* { identificación } */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2 text-[#BC955B]">
                <FileText size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Datos de Identificación</h4>
              </div>

              {isAdmin && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Unidad Administrativa *</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A152E]/50" size={18} />
                    <select 
                      {...register('unidad_administrativa_id', { required: 'Debe seleccionar una unidad administrativa' })}
                      className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-gray-700 outline-none transition-all appearance-none ${errors.unidad_administrativa_id ? 'border-red-200 focus:border-red-400 bg-red-50/30' : 'border-gray-100 focus:border-[#7A152E]'}`}
                    >
                      <option value="">Seleccionar unidad...</option>
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                  {errors.unidad_administrativa_id && <p className="text-[9px] text-red-500 font-black uppercase ml-2 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.unidad_administrativa_id.message}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className={`bg-[#7A152E]/5 p-6 rounded-[2rem] border-2 space-y-4 transition-all ${errors.serie_id || errors.subserie_id ? 'border-red-200 bg-red-50/30' : 'border-[#7A152E]/10'}`} ref={dropdownRef}>
                  <div className="flex items-center justify-between border-b border-[#7A152E]/10 pb-2 px-1">
                    <div className="flex items-center gap-3">
                      <Layers size={18} className="text-[#7A152E]" />
                      <h4 className="text-[10px] font-black text-[#7A152E] uppercase tracking-[0.3em]">Clasificación Archivística *</h4>
                    </div>
                    {currentSelection && (!record || (record && (record.documentos_count || 0) === 0)) && (
                      <button type="button" onClick={() => { setValue('serie_id', ''); setValue('subserie_id', ''); setValue('seccion_id', ''); }} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                        <X size={12} /> Cambiar Selección
                      </button>
                    )}
                  </div>

                  {record && (record.documentos_count || 0) > 0 && (
                    <div className="px-1 mb-2">
                        <p className="text-[8px] font-black text-amber-600 uppercase flex items-center gap-2">
                            <Info size={12} /> Bloqueado: No se puede cambiar la clasificación de un expediente con documentos vinculados.
                        </p>
                    </div>
                  )}

                  {!currentSelection ? (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-[#7A152E] text-sm font-bold text-gray-700 shadow-sm transition-all" 
                        placeholder="Buscar por código o nombre de serie/subserie..." 
                        value={globalSearch} 
                        onChange={(e) => { setGlobalSearch(e.target.value); setIsDropdownOpen(true); }} 
                        onFocus={() => setIsDropdownOpen(true)} 
                      />
                      
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: 10 }} 
                            className="absolute z-[11000] left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                          >
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 text-left">
                              {filteredResults.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                  <AlertCircle size={32} className="text-gray-200 mx-auto" />
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No se encontraron resultados</p>
                                </div>
                              ) : (
                                filteredResults.map((item, idx) => (
                                  <div 
                                    key={`${item.type}-${item.id || idx}`} 
                                    onClick={() => handleSelect(item)} 
                                    className={`px-5 py-3 rounded-2xl mb-1 transition-all flex items-center justify-between group ${item.type === 'SERIE' ? 'bg-slate-50' : 'pl-12 bg-white hover:bg-emerald-50'} ${!item.selectable ? 'cursor-default opacity-80' : 'cursor-pointer hover:shadow-md'}`}
                                  >
                                    <div className="flex items-center gap-4">
                                      {item.type === 'SUBSERIE' && <CornerDownRight size={14} className="text-gray-300" />}
                                      <div className="flex flex-col">
                                        <span className={`text-[10px] font-black tracking-widest leading-none ${item.type === 'SERIE' ? 'text-[#7A152E]' : 'text-emerald-600'}`}>
                                          {item.codigo}
                                        </span>
                                        <span className={`text-[11px] font-bold uppercase leading-tight mt-1 ${item.type === 'SERIE' ? 'text-slate-800' : 'text-slate-600'}`}>
                                          {item.nombre}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {!item.selectable && (
                                        <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                          Requiere Subserie
                                        </span>
                                      )}
                                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border tracking-widest ${item.type === 'SERIE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                        {item.type}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-5 bg-white p-4 rounded-2xl border-2 border-[#7A152E]/20 shadow-lg text-left"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shrink-0 ${currentSelection.type === 'SERIE' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'} text-white`}>
                        {currentSelection.type === 'SERIE' ? <Bookmark size={24} /> : <Layers size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${currentSelection.type === 'SERIE' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                            {currentSelection.codigo}
                          </span>
                          <span className="text-[8px] font-black text-gray-300 uppercase px-2 border-l border-gray-100">
                            {currentSelection.type}
                          </span>
                        </div>
                        <h5 className="text-[13px] font-black text-slate-800 leading-tight uppercase mt-1 truncate">
                          {currentSelection.nombre}
                        </h5>
                      </div>
                    </motion.div>
                  )}
                  {(errors.serie_id || errors.subserie_id) && (
                    <p className="text-[9px] text-red-500 font-black uppercase ml-2 flex items-center gap-1">
                      <AlertCircle size={12} /> La clasificación es obligatoria para abrir el expediente
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-3 space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Título del Expediente *</label>
                    <input {...register('titulo', { required: 'El campo título es obligatorio' })} className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3 text-sm font-bold text-gray-700 outline-none transition-all ${errors.titulo ? 'border-red-200 focus:border-red-400 bg-red-50/30' : 'border-gray-100 focus:border-[#7A152E]'}`} onChange={e => setValue('titulo', capitalizeWords(e.target.value))} />
                    {errors.titulo && <p className="text-[9px] text-red-500 font-black uppercase ml-2 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.titulo.message}</p>}
                </div>
                <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Año *</label>
                    <input 
                      type="number" 
                      min="1900"
                      max={new Date().getFullYear()}
                      {...register('año_apertura', { 
                        required: 'El campo año es obligatorio',
                        min: { value: 1900, message: 'Año inválido' },
                        max: {
                          value: new Date().getFullYear(),
                          message: `Máximo ${new Date().getFullYear()}`
                        }
                      })} 
                      className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3 text-sm font-bold text-gray-700 outline-none transition-all ${errors.año_apertura ? 'border-red-200 focus:border-red-400 bg-red-50/30' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                    />
                    {errors.año_apertura && <p className="text-[9px] text-red-500 font-black uppercase ml-2 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.año_apertura.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Observaciones del Expediente</label>
                  <textarea 
                    {...register('observaciones')} 
                    rows={3}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:border-[#7A152E] transition-all resize-none custom-scrollbar"
                    placeholder="Escriba cualquier observación relevante del expediente..."
                  />
              </div>
            </div>

            {/* { nueva sección: ubicación topográfica (alineada con vale de préstamo) } */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2 text-[#BC955B]">
                <MapPin size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Ubicación Física (Mapeo Topográfico)</h4>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="space-y-1.5 text-left">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Sección / Área {isRat && '*'}</label>
                      <input {...register('ubicacion_seccion', { required: isRat ? 'Campo obligatorio para RAT' : false })} className={`w-full bg-white border-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase text-slate-700 outline-none transition-all ${errors.ubicacion_seccion ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-[#BC955B]'}`} placeholder="Ej. A-1" />
                      {errors.ubicacion_seccion && <p className="text-[8px] text-red-500 font-black uppercase ml-1 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.ubicacion_seccion.message}</p>}
                   </div>
                   <div className="space-y-1.5 text-left">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Batería {isRat && '*'}</label>
                      <input {...register('ubicacion_bateria', { required: isRat ? 'Campo obligatorio para RAT' : false })} className={`w-full bg-white border-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase text-slate-700 outline-none transition-all ${errors.ubicacion_bateria ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-[#BC955B]'}`} placeholder="Ej. B-04" />
                      {errors.ubicacion_bateria && <p className="text-[8px] text-red-500 font-black uppercase ml-1 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.ubicacion_bateria.message}</p>}
                   </div>
                   <div className="space-y-1.5 text-left">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Módulo {isRat && '*'}</label>
                      <input {...register('ubicacion_modulo', { required: isRat ? 'Campo obligatorio para RAT' : false })} className={`w-full bg-white border-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase text-slate-700 outline-none transition-all ${errors.ubicacion_modulo ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-[#BC955B]'}`} placeholder="Ej. M-1" />
                      {errors.ubicacion_modulo && <p className="text-[8px] text-red-500 font-black uppercase ml-1 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.ubicacion_modulo.message}</p>}
                   </div>
                   <div className="space-y-1.5 text-left">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Entrepaño {isRat && '*'}</label>
                      <input {...register('ubicacion_entrepaño', { required: isRat ? 'Campo obligatorio para RAT' : false })} className={`w-full bg-white border-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase text-slate-700 outline-none transition-all ${errors.ubicacion_entrepaño ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-[#BC955B]'}`} placeholder="Ej. E-3" />
                      {errors.ubicacion_entrepaño && <p className="text-[8px] text-red-500 font-black uppercase ml-1 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.ubicacion_entrepaño.message}</p>}
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100/50">
                   <div className="space-y-1.5 text-left">
                      <label className="text-[9px] font-black text-[#7A152E] uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        <Box size={12} /> No. de Caja (identificador) *
                      </label>
                      <input {...register('ubicacion_caja', { required: 'El número de caja es obligatorio' })} className={`w-full bg-white border-2 rounded-[1.25rem] px-6 py-3 text-sm font-black outline-none transition-all ${errors.ubicacion_caja ? 'border-red-200 bg-red-50/30 text-red-700' : 'border-gray-100 text-[#7A152E] focus:border-[#7A152E]'}`} placeholder="Ej. CAJA-001" />
                      {errors.ubicacion_caja && <p className="text-[9px] text-red-500 font-black uppercase ml-2 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.ubicacion_caja.message}</p>}
                   </div>
                   <div className="space-y-1.5 text-left">
                      <label className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        <Archive size={12} /> Volumen Documental (Número de Cajas) *
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        {...register('numero_cajas', { 
                          required: 'El total de cajas es obligatorio', 
                          min: { value: 1, message: 'Mínimo 1 caja' } 
                        })} 
                        className={`w-full bg-white border-2 rounded-[1.25rem] px-6 py-3 text-sm font-black outline-none transition-all ${errors.numero_cajas ? 'border-red-200 bg-red-50/30 text-red-700' : 'border-gray-100 text-[#BC955B] focus:border-[#BC955B]'}`} 
                        placeholder="1" 
                      />
                      {errors.numero_cajas && <p className="text-[9px] text-red-500 font-black uppercase ml-2 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.numero_cajas.message}</p>}
                   </div>
                </div>
                <div className="pt-2">
                   <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed italic">
                      Esta información es vital para generar el <span className="text-[#BC955B]">Vale de Préstamo</span> y localizar el expediente físicamente en el archivo.
                   </p>
                </div>
              </div>
            </div>

            {/* { valores y vigencias } */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black text-[#BC955B] uppercase tracking-[0.2em]">Valores Documentales</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {['administrativo', 'legal', 'fiscal', 'contable'].map(v => (
                            <label key={v} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-100 opacity-70">
                                <input type="checkbox" disabled {...register(`valor_${v}`)} className="w-4 h-4 rounded text-gray-400" />
                                <span className="text-[10px] font-black uppercase text-gray-400">{v}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black text-[#BC955B] uppercase tracking-[0.2em]">Clasificación</h4>
                    <select {...register('clasificacion_informacion')} className="w-full bg-white border-2 border-gray-100 rounded-xl px-6 py-3 text-xs font-black uppercase">
                        <option value="publica">Pública</option>
                        <option value="reservada">Reservada</option>
                        <option value="confidencial">Confidencial</option>
                    </select>
                </div>
            </div>

            <div className="space-y-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-[#BC955B] uppercase tracking-[0.2em]">Vigencias (Años)</h4>
                <div className="grid grid-cols-3 gap-6">
                    {['tramite', 'concentracion', 'historico'].map(t => (
                        <div key={t} className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-gray-400">{t}</label>
                            <input disabled {...register(`tiempo_${t}`)} className="w-full bg-white/50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold uppercase text-gray-400" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-[2] bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {isEdit ? 'Guardar Cambios' : 'Abrir Expediente'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default ExpedienteForm;
