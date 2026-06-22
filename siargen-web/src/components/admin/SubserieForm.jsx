import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save, Loader2, Layers, BookOpen, Clock, ShieldCheck, AlertCircle, MapPin, Hash, Building, FileText, Bookmark, ShieldAlert } from 'lucide-react';
import { createSubserie, updateSubserie, fetchSeriesArchivistica, clearArchivisticaErrors } from '../../store/archivisticaSlice';
import ModalPortal from '../ModalPortal';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

const SubserieForm = ({ isOpen, onClose, onSuccess, record = null }) => {
    const dispatch = useDispatch();
    const { series, actionLoading: loading, validationErrors: reduxErrors } = useSelector((state) => state.archivistica);
    const isEdit = !!record;

    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
        defaultValues: {
            serie_id: '',
            codigo_sufijo: '',
            nombre: '',
            descripcion: '',
            valor_administrativo: false,
            valor_legal: false,
            valor_fiscal_contable: false,
            vigencia_tramite: 1,
            vigencia_concentracion: 1,
            disposicion_final: 'Baja',
            metros_lineales: 0,
            edificio_sede: '',
            area_resguardo: '',
        }
    });

    const selectedSerieId = watch('serie_id');
    const selectedDisposicion = watch('disposicion_final');

    const getSerieCodigo = (id) => {
        const s = series.items.find(item => item.id === parseInt(id));
        return s ? `${s.codigo}.` : '';
    };

    const capitalizeWords = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Hereda valores documentales y vigencias de la serie seleccionada al crear.
    useEffect(() => {
        if (!isEdit && selectedSerieId) {
            const parentSerie = series.items.find(s => s.id === parseInt(selectedSerieId));
            if (parentSerie) {
                setValue('vigencia_tramite', parentSerie.vigencia_tramite || 1);
                setValue('vigencia_concentracion', parentSerie.vigencia_concentracion || 1);
                setValue('disposicion_final', parentSerie.disposicion_final || 'Baja');
                setValue('valor_administrativo', !!parentSerie.valor_administrativo);
                setValue('valor_legal', !!parentSerie.valor_legal);
                setValue('valor_fiscal_contable', !!parentSerie.valor_fiscal_contable);
                setValue('edificio_sede', parentSerie.edificio_sede || '');
                setValue('area_resguardo', parentSerie.area_resguardo || '');
                setValue('metros_lineales', parentSerie.metros_lineales || 0);
            }
        }
    }, [selectedSerieId, series.items, setValue, isEdit]);

    useEffect(() => {
        if (isOpen) {
            dispatch(clearArchivisticaErrors());
            if (series.items.length === 0) {
                dispatch(fetchSeriesArchivistica());
            }

            if (record) {
                const serie = series.items.find(s => s.id === record.serie_id);
                const prefix = serie ? `${serie.codigo}.` : '';
                const sufijo = record.codigo.startsWith(prefix) 
                  ? record.codigo.slice(prefix.length) 
                  : record.codigo;

                reset({
                    ...record,
                    serie_id: record.serie_id,
                    codigo_sufijo: sufijo,
                    valor_administrativo: !!record.valor_administrativo,
                    valor_legal: !!record.valor_legal,
                    valor_fiscal_contable: !!record.valor_fiscal_contable,
                    metros_lineales: record.metros_lineales || 0,
                    edificio_sede: record.edificio_sede || '',
                    area_resguardo: record.area_resguardo || '',
                });
            } else {
                reset({
                    serie_id: '',
                    codigo_sufijo: '',
                    nombre: '',
                    descripcion: '',
                    valor_administrativo: false,
                    valor_legal: false,
                    valor_fiscal_contable: false,
                    vigencia_tramite: 1,
                    vigencia_concentracion: 1,
                    disposicion_final: 'Baja',
                    metros_lineales: 0,
                    edificio_sede: '',
                    area_resguardo: '',
                });
            }
        }
    }, [isOpen, record, reset, series.items, dispatch]);

    const handleSufijoChange = (e) => {
        const value = e.target.value.toUpperCase()
          .replace(/[^A-Z0-9._/-]/g, '')
          .slice(0, 20);
        setValue('codigo_sufijo', value);
    };

    const onSubmit = async (data) => {
        const fullCodigo = `${getSerieCodigo(data.serie_id)}${data.codigo_sufijo}`;
        const payload = {
            ...data,
            codigo: fullCodigo,
            valor_administrativo: data.valor_administrativo ? 1 : 0,
            valor_legal: data.valor_legal ? 1 : 0,
            valor_fiscal_contable: data.valor_fiscal_contable ? 1 : 0,
            metros_lineales: parseFloat(data.metros_lineales) || 0,
            vigencia_tramite: parseInt(data.vigencia_tramite) || 1,
            vigencia_concentracion: parseInt(data.vigencia_concentracion) || 1
        };

        try {
            if (isEdit) {
                await dispatch(updateSubserie({ id: record.id, formData: payload })).unwrap();
                Swal.fire({
                    icon: 'success',
                    title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Actualizada!</span>',
                    text: 'La subserie ha sido actualizada correctamente.',
                    iconColor: '#7A152E',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[3rem] shadow-2xl border-none',
                        title: 'text-2xl py-10',
                    }
                });
            } else {
                await dispatch(createSubserie(payload)).unwrap();
                Swal.fire({
                    icon: 'success',
                    title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Registrada!</span>',
                    text: 'La subserie ha sido registrada correctamente.',
                    iconColor: '#7A152E',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-[3rem] shadow-2xl border-none',
                        title: 'text-2xl py-10',
                    }
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            // error handling managed by redux
        }
    };

    if (!isOpen) return null;

    return (
        <ModalPortal>
            <div className="overlay-blur-full flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
                >
                    <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-8 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#BC955B]/10 rounded-full -mr-24 -mt-24"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <Layers size={32} className="text-[#BC955B]" />
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                                    {isEdit ? 'EDITAR SUBSERIE' : 'NUEVA SUBSERIE'}
                                </h3>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Clasificación Nivel 4 (Subserie)</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-[1.25rem] transition-all shadow-xl active:scale-90"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        
                        {/* { sección 1: identificación y jerarquía } */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Serie Documental Padre *</label>
                                    <div className={`relative transition-all ${reduxErrors?.serie_id ? 'ring-4 ring-red-50' : ''}`}>
                                        <select 
                                            {...register('serie_id', { required: 'La serie padre es obligatoria' })}
                                            className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none transition-all font-bold text-gray-700 text-sm appearance-none ${reduxErrors?.serie_id ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                                        >
                                            <option value="">Seleccionar Serie...</option>
                                            {series.items.map(s => <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>)}
                                        </select>
                                    </div>
                                    {reduxErrors?.serie_id && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.serie_id[0]}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Código de la Subserie *</label>
                                    <div className="flex items-center gap-2">
                                        {selectedSerieId && (
                                            <span className="bg-gray-100 px-4 py-4 rounded-2xl font-black text-gray-400 text-sm border-2 border-gray-100">
                                                {getSerieCodigo(selectedSerieId)}
                                            </span>
                                        )}
                                        <div className={`relative flex-1 transition-all ${reduxErrors?.codigo ? 'ring-4 ring-red-50' : ''}`}>
                                            <input 
                                                {...register('codigo_sufijo', { required: 'El sufijo es obligatorio' })}
                                                type="text" 
                                                onChange={handleSufijoChange}
                                                className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm uppercase ${reduxErrors?.codigo ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                                                placeholder="Sufijo (ej. 1)" 
                                            />
                                            {reduxErrors?.codigo && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                                        </div>
                                    </div>
                                    {reduxErrors?.codigo && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.codigo[0]}</p>}
                                    <p className="text-[8px] text-[#BC955B] font-bold uppercase tracking-widest ml-4 mt-1">Código final: {getSerieCodigo(selectedSerieId)}{watch('codigo_sufijo') || '...'}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Nombre de la Subserie *</label>
                                    <div className={`relative transition-all ${reduxErrors?.nombre ? 'ring-4 ring-red-50' : ''}`}>
                                        <input 
                                            {...register('nombre', { required: 'El nombre es obligatorio' })}
                                            type="text" 
                                            className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none font-black text-gray-700 text-sm focus:border-[#7A152E] ${reduxErrors?.nombre ? 'border-red-200 focus:border-red-400' : 'border-gray-100'}`} 
                                            placeholder="Nombre descriptivo..." 
                                            onChange={(e) => setValue('nombre', capitalizeWords(e.target.value))}
                                        />
                                    </div>
                                    {reduxErrors?.nombre && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.nombre[0]}</p>}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                                        <FileText size={12} className="text-[#BC955B]" /> Descripción de la Subserie *
                                    </label>
                                    <div className={`relative transition-all ${reduxErrors?.descripcion ? 'ring-4 ring-red-50' : ''}`}>
                                        <textarea 
                                            {...register('descripcion', { required: 'La descripción es requerida para Guía Simple' })}
                                            className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-bold text-gray-700 text-sm min-h-[140px] resize-none ${reduxErrors?.descripcion ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                                            placeholder="Contenido y alcance (Requerido para Guía Simple)..." 
                                        />
                                    </div>
                                    {reduxErrors?.descripcion && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.descripcion[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* { sección 2: volumen y ubicación administrativa } */}
                        <div className="bg-[#BC955B]/5 p-8 rounded-[2.5rem] border border-[#BC955B]/10 space-y-8">
                            <h4 className="text-[10px] font-black text-[#BC955B] uppercase tracking-[0.3em] flex items-center gap-2">
                                <Building size={14} /> Información Física y de Resguardo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Edificio / Sede</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#BC955B]/50" />
                                        <input 
                                            type="text" 
                                            {...register('edificio_sede')}
                                            className="w-full bg-white border-2 border-white rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-700 text-sm focus:border-[#BC955B] outline-none transition-all shadow-sm"
                                            placeholder="Ej. Almacén Central" 
                                            onChange={(e) => setValue('edificio_sede', capitalizeWords(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Área de Resguardo</label>
                                    <div className="relative">
                                        <Layers size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#BC955B]/50" />
                                        <input 
                                            type="text" 
                                            {...register('area_resguardo')}
                                            className="w-full bg-white border-2 border-white rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-700 text-sm focus:border-[#BC955B] outline-none transition-all shadow-sm"
                                            placeholder="Ej. Nave A, Bóveda 1" 
                                            onChange={(e) => setValue('area_resguardo', capitalizeWords(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Metros Lineales</label>
                                    <div className="relative">
                                        <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#BC955B]/50" />
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            min="0"
                                            {...register('metros_lineales', { 
                                                min: 0,
                                                onChange: (e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (val < 0) setValue('metros_lineales', 0);
                                                }
                                            })}
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                            }}
                                            className="w-full bg-white border-2 border-white rounded-2xl pl-12 pr-16 py-4 font-black text-[#7A152E] text-sm focus:border-[#BC955B] outline-none transition-all shadow-sm"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[9px] text-gray-400">m</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* { sección 3: valores y vigencias } */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ShieldAlert size={14} /> Valores Documentales
                                </h4>
                                <div className="flex flex-wrap gap-4">
                                    {[
                                        { id: 'valor_administrativo', label: 'Administrativo' },
                                        { id: 'valor_legal', label: 'Legal' },
                                        { id: 'valor_fiscal_contable', label: 'Fiscal' }
                                    ].map(v => (
                                        <label key={v.id} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 cursor-pointer hover:border-[#BC955B] transition-all group">
                                            <input 
                                                type="checkbox" 
                                                {...register(v.id)} 
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 text-[#BC955B] focus:ring-0 transition-all cursor-pointer"
                                            />
                                            <span className="text-xs font-black text-gray-500 group-hover:text-slate-800 uppercase tracking-tighter">{v.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Clock size={14} /> Plazos de Conservación (Años)
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2 text-blue-600 font-black">Archivo Trámite *</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            {...register('vigencia_tramite', {
                                                required: true,
                                                min: 1,
                                                onBlur: (e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (isNaN(val) || val < 1) setValue('vigencia_tramite', 1);
                                                }
                                            })} 
                                            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                            className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all font-black text-slate-700 text-sm ${reduxErrors?.vigencia_tramite ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-blue-400'}`} 
                                        />
                                        {reduxErrors?.vigencia_tramite && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.vigencia_tramite[0]}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2 text-amber-600 font-black">Concentración *</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            {...register('vigencia_concentracion', {
                                                required: true,
                                                min: 1,
                                                onBlur: (e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (isNaN(val) || val < 1) setValue('vigencia_concentracion', 1);
                                                }
                                            })} 
                                            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                            className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all font-black text-slate-700 text-sm ${reduxErrors?.vigencia_concentracion ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-amber-400'}`} 
                                        />
                                        {reduxErrors?.vigencia_concentracion && <p className="text-[8px] text-red-500 font-bold uppercase ml-2 mt-1">{reduxErrors.vigencia_concentracion[0]}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* { sección 4: disposición final } */}
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                            <h4 className="text-[10px] font-black text-[#7A152E] uppercase tracking-[0.3em] flex items-center gap-2">
                                <Bookmark size={14} /> Destino y Disposición Final
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { value: 'Baja', label: 'Baja Documental', desc: 'Eliminación definitiva' },
                                    { value: 'Historico', label: 'Transferencia Secundaria', desc: 'Conservación permanente' },
                                    { value: 'Muestreo', label: 'Muestreo', desc: 'Selección representativa' }
                                ].map(option => (
                                    <label 
                                        key={option.value}
                                        className={`relative flex flex-col p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${
                                            selectedDisposicion === option.value 
                                            ? 'bg-white border-[#7A152E] shadow-xl' 
                                            : 'bg-white/50 border-transparent hover:border-gray-200'
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            {...register('disposicion_final')} 
                                            value={option.value}
                                            className="hidden"
                                        />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDisposicion === option.value ? 'text-[#7A152E]' : 'text-gray-400'}`}>
                                            {option.label}
                                        </span>
                                        <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase leading-tight">{option.desc}</p>
                                        {selectedDisposicion === option.value && (
                                            <div className="absolute top-4 right-4 w-4 h-4 bg-[#7A152E] rounded-full flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* { botones } */}
                        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-100 active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-[280px] bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {isEdit ? 'Actualizar Subserie' : 'Guardar Subserie'}</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </ModalPortal>
    );
};

export default SubserieForm;
