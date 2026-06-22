import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  X, 
  Save, 
  Loader2, 
  FileText, 
  Calendar, 
  User, 
  ArrowRightLeft, 
  FileUp, 
  Building,
  Hash,
  Clock,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Search,
  Layers,
  Bookmark,
  AlertCircle,
  Zap,
  Info,
  CornerDownRight,
  UserCheck,
  Timer
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { createCorrespondencia, updateCorrespondencia, clearValidationErrors } from '../../store/correspondenciaSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import { fetchSecciones, fetchSeriesArchivistica, fetchSubseries } from '../../store/archivisticaSlice';
import { alerts } from '../../utils/alerts';
import ModalPortal from '../ModalPortal';

const CLASES_DOCUMENTO = [
  "Oficio",
  "Circular",
  "Memorándum",
  "Tarjeta Informativa",
  "Expediente Clínico",
  "Nota Técnica",
  "Otro"
];

const PRIORIDADES = [
    { value: 'baja', label: 'Baja', color: 'text-gray-500' },
    { value: 'media', label: 'Media', color: 'text-blue-500' },
    { value: 'alta', label: 'Alta', color: 'text-amber-500' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-500' }
];

const CorrespondenciaForm = ({ isOpen, onClose, onSuccess, record = null }) => {
  const dispatch = useDispatch();
  const { catalog: unidades } = useSelector((state) => state.unidades);
  const { secciones, series, subseries } = useSelector((state) => state.archivistica);
  const { actionLoading, validationErrors: reduxErrors } = useSelector((state) => state.correspondencia);
  const { user } = useSelector((state) => state.auth);
  
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [removerPdf, setRemoverPdf] = useState(false);
  const [isNoClassification, setIsNoClassification] = useState(false);
  
  const classificationRef = useRef(null);

  const isEdit = !!record;
  const isRestrictedRole = user?.role?.slug === 'correspondencia' || user?.role?.slug === 'rat';
  const today = new Date().toLocaleDateString('en-CA');

  const { register, handleSubmit, watch, reset, setValue, control, formState: { errors } } = useForm({
    mode: 'onBlur'
  });
  
  const tipo = watch('tipo');
  const selectedSerieId = watch('serie_id');
  const selectedSubserieId = watch('subserie_id');
  const documento_pdf = watch('documento_pdf');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (classificationRef.current && !classificationRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hierarchicalCatalog = useMemo(() => {
    const list = [];
    list.push({ type: 'NONE', codigo: 'S/C', nombre: 'SIN CLASIFICACIÓN DEFINIDA / PENDIENTE', selectable: true, full_text: 'sin clasificacion pendiente sc' });
    series.items.forEach(s => {
      list.push({ id: s.id, type: 'SERIE', codigo: s.codigo, nombre: s.nombre, seccion_id: s.seccion_id, has_subseries: s.subseries_count > 0, selectable: s.subseries_count === 0, full_text: `${s.codigo} ${s.nombre}`.toLowerCase() });
      const children = subseries.items.filter(ss => ss.serie_id === s.id);
      children.forEach(ss => {
        list.push({ id: ss.id, serie_id: ss.serie_id, type: 'SUBSERIE', codigo: ss.codigo, nombre: ss.nombre, selectable: true, full_text: `${ss.codigo} ${ss.nombre}`.toLowerCase() });
      });
    });
    return list;
  }, [series.items, subseries.items]);

  const filteredResults = useMemo(() => {
    if (globalSearch === '') return hierarchicalCatalog;
    return hierarchicalCatalog.filter(item => item.full_text.includes(globalSearch.toLowerCase()));
  }, [hierarchicalCatalog, globalSearch]);

  const currentSelection = useMemo(() => {
    if (isNoClassification) return { type: 'NONE', codigo: 'S/C', nombre: 'SIN CLASIFICACIÓN DEFINIDA' };
    if (selectedSubserieId) {
      const ss = subseries.items.find(s => s.id === parseInt(selectedSubserieId));
      return ss ? { type: 'SUBSERIE', ...ss } : null;
    }
    if (selectedSerieId) {
      const s = series.items.find(s => s.id === parseInt(selectedSerieId));
      return s ? { type: 'SERIE', ...s } : null;
    }
    return null;
  }, [selectedSerieId, selectedSubserieId, series.items, subseries.items, isNoClassification]);

  useEffect(() => {
    if (isOpen) {
      dispatch(clearValidationErrors());
      if (!secciones.lastFetch) dispatch(fetchSecciones());
      if (!series.lastFetch) dispatch(fetchSeriesArchivistica());
      if (!subseries.lastFetch) dispatch(fetchSubseries({ per_page: -1 }));
      dispatch(fetchUnidadesCatalog());
      setRemoverPdf(false);
      setIsNoClassification(false);

      if (record) {
        reset({
          tipo: record.tipo?.toLowerCase() || 'entrada',
          fecha: record.fecha,
          num_oficio: record.num_oficio || '',
          clase_documento: record.clase_documento || 'Oficio',
          num_fojas: record.num_fojas || 1,
          remitente: record.remitente || '',
          destinatario: record.destinatario || '',
          asunto: record.asunto,
          fecha_limite_respuesta: record.fecha_limite_respuesta || '',
          turnado_a: record.turnado_a || record.unidad_administrativa_id || '',
          seccion_id: record.seccion_id || '',
          serie_id: record.serie_id || '',
          subserie_id: record.subserie_id || '',
          prioridad: record.prioridad?.toLowerCase() || 'media'
        });
        if (!record.serie_id && !record.subserie_id) setIsNoClassification(true);
      } else {
        reset({
          tipo: 'entrada',
          fecha: new Date().toLocaleDateString('en-CA'),
          num_oficio: '',
          clase_documento: 'Oficio',
          num_fojas: 1,
          remitente: '',
          destinatario: '',
          asunto: '',
          fecha_limite_respuesta: '',
          turnado_a: isRestrictedRole ? user?.unidad_administrativa_id : '',
          seccion_id: '',
          serie_id: '',
          subserie_id: '',
          prioridad: 'media'
        });
      }
    }
  }, [isOpen, record, reset, dispatch, user, isRestrictedRole, secciones.lastFetch, series.lastFetch, subseries.lastFetch]);

  const handleSelect = (item) => {
    if (!item.selectable) return;
    if (item.type === 'NONE') {
        setValue('serie_id', ''); setValue('subserie_id', ''); setValue('seccion_id', '');
        setIsNoClassification(true);
    } else if (item.type === 'SERIE') {
      setValue('serie_id', item.id); setValue('subserie_id', ''); setValue('seccion_id', item.seccion_id);
      setIsNoClassification(false);
    } else {
      const parentSerie = series.items.find(s => s.id === item.serie_id);
      setValue('serie_id', item.serie_id); setValue('subserie_id', item.id); setValue('seccion_id', parentSerie?.seccion_id || '');
      setIsNoClassification(false);
    }
    setGlobalSearch('');
    setIsDropdownOpen(false);
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const onSubmit = async (data) => {
    // Requiere clasificar correspondencia en nuevos registros.
    if (!isNoClassification && !selectedSerieId && !selectedSubserieId) {
        alerts.warning('Debe seleccionar una serie/subserie o elegir la opción "Sin Clasificación" para continuar.', 'SIN CLASIFICACIÓN');
        return;
    }

    const formData = new FormData();
    Object.keys(data).forEach(key => {
        const val = data[key];
        if (key === 'documento_pdf') {
            if (val && val[0]) formData.append(key, val[0]);
        } else if (key === 'fecha_limite_respuesta' && !val) {
            formData.append(key, '');
        } else if (['seccion_id', 'serie_id', 'subserie_id'].includes(key)) {
            formData.append(key, val || '');
        } else if (val !== null && val !== undefined && val !== '') {
            let finalVal = val;
            if (key === 'tipo') finalVal = val.toUpperCase();
            formData.append(key, finalVal);
        }
    });
    if (isEdit) formData.append('_method', 'PUT');
    if (removerPdf) formData.append('remover_pdf', '1');

    try {
      if (isEdit) {
        await dispatch(updateCorrespondencia({ id: record.id, formData })).unwrap();
      } else {
        await dispatch(createCorrespondencia(formData)).unwrap();
      }
      alerts.success(`Registro ${isEdit ? 'actualizado' : 'creado'} correctamente`);
      onSuccess();
      onClose();
    } catch (error) {
        if (typeof error === 'object' && error.errors) {
            alerts.validation(error.errors);
        } else {
            const message = typeof error === 'string' ? error : (error?.message || 'Ocurrió un problema al procesar la solicitud');
            alerts.error(message);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC955B]/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-4 text-left">
              <ArrowRightLeft size={28} className="text-[#BC955B]" />
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{isEdit ? 'Editar Correspondencia' : 'Registro de Correspondencia'}</h3>
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">ISEM • Oficialía de Partes</p>
              </div>
            </div>
            <button onClick={onClose} className="relative z-20 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white text-white hover:text-[#7A152E] transition-all active:scale-90"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            {/* { fila 1: datos de control } */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Tipo de Trámite *</label>
                    <select {...register('tipo', { required: 'El tipo es obligatorio' })} disabled={isEdit} className={`w-full bg-gray-50 border-2 rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none appearance-none disabled:opacity-50 ${errors.tipo || reduxErrors?.tipo ? 'border-red-200' : 'border-gray-100 focus:border-[#7A152E]'}`}>
                        <option value="entrada">Entrada (Recibida)</option>
                        <option value="salida">Salida (Enviada)</option>
                    </select>
                    {errors.tipo && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{errors.tipo.message}</p>}
                    {reduxErrors?.tipo && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{reduxErrors.tipo[0]}</p>}
                </div>
                <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Fecha Documento *</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="date" max={today} {...register('fecha', { required: 'La fecha es obligatoria' })} className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-gray-700 outline-none ${errors.fecha || reduxErrors?.fecha ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} />
                    </div>
                    {errors.fecha && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{errors.fecha.message}</p>}
                    {reduxErrors?.fecha && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.fecha[0]}</p>}
                </div>
                <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Núm. Oficio / Ref.</label>
                    <input {...register('num_oficio')} className={`w-full bg-gray-50 border-2 rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none ${reduxErrors?.num_oficio ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} placeholder="ISEM/001/2026" />
                    {reduxErrors?.num_oficio && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.num_oficio[0]}</p>}
                </div>
                <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Clase Documental *</label>
                    <select {...register('clase_documento', { required: 'La clase es obligatoria' })} className={`w-full bg-gray-50 border-2 rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 outline-none appearance-none ${errors.clase_documento || reduxErrors?.clase_documento ? 'border-red-200' : 'border-gray-100 focus:border-[#7A152E]'}`}>
                        {CLASES_DOCUMENTO.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.clase_documento && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{errors.clase_documento.message}</p>}
                    {reduxErrors?.clase_documento && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{reduxErrors.clase_documento[0]}</p>}
                </div>
            </div>

            {/* { fila 2: clasificación y datos técnicos compactos } */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* { buscador de clasificación } */}
                <div className={`md:col-span-5 bg-[#7A152E]/5 p-4 rounded-[1.5rem] border space-y-3 h-[120px] flex flex-col justify-center transition-all ${reduxErrors?.serie_id || reduxErrors?.subserie_id ? 'border-red-200 bg-red-50/30' : 'border-[#7A152E]/10'}`} ref={classificationRef}>
                    <div className="flex items-center justify-between border-b border-[#7A152E]/10 pb-1 px-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[9px] font-black text-[#7A152E] uppercase tracking-[0.3em]">Seleccione serie o subserie *</h4>
                        </div>
                        {(currentSelection || isNoClassification) && (
                            <button type="button" onClick={() => { setValue('serie_id', ''); setValue('subserie_id', ''); setValue('seccion_id', ''); setIsNoClassification(false); }} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline">Cambiar</button>
                        )}
                    </div>
                    {!currentSelection && !isNoClassification ? (
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" className="w-full pl-10 pr-6 py-2.5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-[#7A152E] text-[13px] font-bold text-gray-700 shadow-sm" placeholder="Código o nombre..." value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} />
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[11000] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                        <div className="max-h-52 overflow-y-auto custom-scrollbar p-1.5 text-left">
                                            <div onClick={() => handleSelect({ type: 'NONE', codigo: 'S/C', nombre: 'SIN CLASIFICACIÓN / PENDIENTE', selectable: true })} className="px-4 py-2 rounded-lg mb-1 bg-amber-50 hover:bg-amber-100 cursor-pointer border border-dashed border-amber-200 flex items-center justify-between group transition-all">
                                                <div className="flex items-center gap-3"><Info size={14} className="text-amber-500" /><div className="flex flex-col"><span className="text-[9px] font-black text-amber-600 tracking-widest leading-none">S/C</span><span className="text-[10px] font-bold text-amber-700 uppercase">Pendiente</span></div></div>
                                            </div>
                                            {filteredResults.filter(i => i.type !== 'NONE').map((item, idx) => (
                                                <div key={`${item.type}-${item.id || idx}`} onClick={() => handleSelect(item)} className={`px-4 py-2 rounded-lg mb-0.5 transition-all flex items-center justify-between group ${item.type === 'SERIE' ? 'bg-slate-50' : 'pl-10 bg-white hover:bg-emerald-50'} ${!item.selectable ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
                                                    <div className="flex items-center gap-3">{item.type === 'SUBSERIE' && <CornerDownRight size={12} className="text-gray-300" />}<div className="flex flex-col"><span className={`text-[9px] font-black tracking-widest leading-none ${item.type === 'SERIE' ? 'text-[#7A152E]' : 'text-emerald-600'}`}>{item.codigo}</span><span className={`text-[10px] font-bold uppercase leading-tight ${item.type === 'SERIE' ? 'text-slate-800' : 'text-slate-600'}`}>{item.nombre}</span></div></div>
                                                    <div className="flex items-center gap-2">{!item.selectable && <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase">Subserie req.</span>}<span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase border ${item.type === 'SERIE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{item.type}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-[#7A152E]/10 shadow-sm text-left">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md shrink-0 ${isNoClassification ? 'bg-amber-500' : (currentSelection.type === 'SERIE' ? 'bg-indigo-500' : 'bg-emerald-500')} text-white`}>
                                {isNoClassification ? <Info size={18} /> : (currentSelection.type === 'SERIE' ? <Bookmark size={18} /> : <Layers size={18} />)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-black text-[#7A152E] tracking-widest uppercase block leading-none">{currentSelection.codigo}</span>
                                <h5 className="text-[11px] font-black text-slate-800 leading-tight uppercase mt-0.5 truncate">{currentSelection.nombre}</h5>
                            </div>
                        </div>
                    )}
                    {(reduxErrors?.serie_id || reduxErrors?.subserie_id) && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">Clasificación requerida.</p>}
                </div>

                <div className="md:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4 h-[120px]">
                    <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Fojas *</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                            <input type="number" min="1" {...register('num_fojas', { required: 'Obligatorio' })} className={`w-full bg-gray-50 border-2 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-gray-700 outline-none ${errors.num_fojas || reduxErrors?.num_fojas ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} />
                        </div>
                        {errors.num_fojas && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{errors.num_fojas.message}</p>}
                        {reduxErrors?.num_fojas && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{reduxErrors.num_fojas[0]}</p>}
                    </div>
                    <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Prioridad *</label>
                        <select {...register('prioridad', { required: 'Obligatorio' })} className={`w-full bg-gray-50 border-2 rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none appearance-none ${errors.prioridad || reduxErrors?.prioridad ? 'border-red-200' : 'border-gray-100 focus:border-[#7A152E]'}`}>
                            {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {errors.prioridad && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{errors.prioridad.message}</p>}
                    </div>
                    <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Registrado por</label>
                        <div className="relative">
                            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A152E]/50" size={16} />
                            <input 
                                type="text"
                                value={isEdit ? (record.usuario?.nombre ? `${record.usuario.nombre} ${record.usuario.apellido_paterno || ''} ${record.usuario.apellido_materno || ''}`.trim() : 'SISTEMA') : (user ? `${user.nombre} ${user.apellido_paterno || ''} ${user.apellido_materno || ''}`.trim() : '')}
                                readOnly 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-5 py-3 text-[10px] font-black text-slate-500 outline-none cursor-not-allowed uppercase" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">
                        {tipo === 'entrada' ? 'Remitente (Origen) *' : 'Destinatario (Destino) *'}
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input {...register(tipo === 'entrada' ? 'remitente' : 'destinatario', { required: 'Este campo es obligatorio' })} onChange={e => setValue(e.target.name, capitalizeWords(e.target.value))} className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-gray-700 outline-none ${errors.remitente || errors.destinatario || reduxErrors?.remitente || reduxErrors?.destinatario ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} placeholder="Institución o Nombre completo" />
                    </div>
                    {(errors.remitente || errors.destinatario) && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{(errors.remitente || errors.destinatario).message}</p>}
                    {(reduxErrors?.remitente || reduxErrors?.destinatario) && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">Obligatorio.</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 text-slate-500">Fecha Límite Respuesta</label>
                    <div className="relative">
                        <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="date" min={today} {...register('fecha_limite_respuesta')} className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-gray-700 outline-none ${reduxErrors?.fecha_limite_respuesta ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} />
                    </div>
                    {reduxErrors?.fecha_limite_respuesta && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.fecha_limite_respuesta[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                <div className="md:col-span-4 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">
                            {tipo === 'entrada' ? 'Unidad Turnada (Destino) *' : 'Unidad Emisora (Origen) *'}
                        </label>
                        {isRestrictedRole ? (
                            <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                                <Building size={16} className="text-[#7A152E]/50" />
                                <span className="text-xs font-black text-slate-500 uppercase">{user?.unidad_administrativa?.nombre}</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select {...register('turnado_a', { required: 'Seleccione una unidad' })} className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-10 py-3 text-sm font-bold text-gray-700 outline-none appearance-none ${errors.turnado_a || reduxErrors?.turnado_a ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}>
                                    <option value="">Seleccionar Unidad...</option>
                                    {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                        {errors.turnado_a && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{errors.turnado_a.message}</p>}
                        {reduxErrors?.turnado_a && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.turnado_a[0]}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Evidencia Digital (PDF)</label>
                        <div className="relative">
                            <div className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-2xl transition-all cursor-pointer group
                                ${(documento_pdf && documento_pdf[0]) || (record?.documento_pdf_path && !removerPdf) ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 hover:border-[#7A152E]/30'}`}>
                                <FileUp size={20} className={(documento_pdf && documento_pdf[0]) || (record?.documento_pdf_path && !removerPdf) ? 'text-emerald-500' : 'text-[#7A152E]'} />
                                <div className="flex-1 min-w-0"><p className="text-[10px] font-black uppercase truncate text-slate-700">{(documento_pdf && documento_pdf[0]) ? documento_pdf[0].name : (record?.documento_pdf_path && !removerPdf ? 'Archivo Cargado' : 'Subir PDF (Máx. 10MB)')}</p></div>
                                <input type="file" accept=".pdf" {...register('documento_pdf')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <AnimatePresence>{((documento_pdf && documento_pdf[0]) || (record?.documento_pdf_path && !removerPdf)) && (<button type="button" onClick={(e) => { e.preventDefault(); if (documento_pdf && documento_pdf[0]) { setValue('documento_pdf', null); } else { setRemoverPdf(true); } }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all z-20"><X size={12} /></button>)}</AnimatePresence>
                        </div>
                        {reduxErrors?.documento_pdf && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.documento_pdf[0]}</p>}
                    </div>
                </div>
                
                <div className="md:col-span-8 space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 text-[#7A152E]">Asunto / Extracto del Contenido *</label>
                    <textarea {...register('asunto', { required: 'El asunto es obligatorio', minLength: { value: 10, message: 'Mínimo 10 caracteres' } })} rows="5" className={`w-full bg-gray-50 border-2 rounded-[2rem] px-6 py-4 text-sm font-bold text-gray-700 outline-none resize-none custom-scrollbar ${errors.asunto || reduxErrors?.asunto ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} placeholder="Describa el contenido del documento de forma clara..."></textarea>
                    {errors.asunto && <p className="text-[8px] text-red-500 font-bold uppercase ml-4 mt-1">{errors.asunto.message}</p>}
                    {reduxErrors?.asunto && <p className="text-[8px] text-red-500 font-bold uppercase ml-4 mt-1">{reduxErrors.asunto[0]}</p>}
                </div>
            </div>

            {/* { footer } */}
            <div className="pt-6 border-t border-gray-100 flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent active:scale-95">Cerrar</button>
                <button type="submit" disabled={actionLoading} className="w-[280px] bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl">
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {isEdit ? 'Actualizar Registro' : 'Registrar Correspondencia'}</>}
                </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default CorrespondenciaForm;
