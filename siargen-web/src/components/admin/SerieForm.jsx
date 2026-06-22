import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Bookmark, AlertCircle, ShieldCheck, Clock, ShieldAlert, Layers, MapPin, Hash, Building, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { createSerie, updateSerie, clearArchivisticaErrors } from '../../store/archivisticaSlice';
import Swal from 'sweetalert2';
import ModalPortal from '../ModalPortal';

const SerieForm = ({ isOpen, onClose, onSuccess, serie = null }) => {
  const dispatch = useDispatch();
  const { actionLoading: loading, validationErrors: reduxErrors } = useSelector((state) => state.archivistica);
  const { items: secciones } = useSelector((state) => state.archivistica.secciones);
  
  const isEdit = !!serie;
  const [formData, setFormData] = useState({
    seccion_id: '',
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

  const vigenciaTotal = (parseInt(formData.vigencia_tramite) || 0) + (parseInt(formData.vigencia_concentracion) || 0);

  const getSeccionCodigo = (id) => {
    const s = secciones.find(item => item.id === parseInt(id));
    return s ? `${s.codigo}.` : '';
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'codigo_sufijo') {
      finalValue = value.toUpperCase()
        .replace(/[^A-Z0-9._/-]/g, '')
        .slice(0, 20);
    } else if (name === 'nombre' || name === 'edificio_sede' || name === 'area_resguardo') {
      finalValue = capitalizeWords(value);
    } else if (name === 'vigencia_tramite' || name === 'vigencia_concentracion' || name === 'metros_lineales') {
      if (value === '') {
        finalValue = '';
      } else {
        const val = name === 'metros_lineales' ? parseFloat(value) : parseInt(value, 10);
        finalValue = isNaN(val) ? '' : val;
      }
    }

    setFormData({ ...formData, [name]: finalValue });
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'vigencia_tramite' || name === 'vigencia_concentracion') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1) {
        setFormData(prev => ({ ...prev, [name]: 1 }));
      }
    } else if (name === 'metros_lineales') {
      const val = parseFloat(value);
      if (isNaN(val) || val < 0) {
        setFormData(prev => ({ ...prev, [name]: 0 }));
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(clearArchivisticaErrors());
      if (serie) {
        const s = secciones.find(item => item.id === serie.seccion_id);
        const prefix = s ? `${s.codigo}.` : '';
        const sufijo = serie.codigo.startsWith(prefix) 
          ? serie.codigo.slice(prefix.length) 
          : serie.codigo;

        setFormData({
          seccion_id: serie.seccion_id || '',
          codigo_sufijo: sufijo || '',
          nombre: serie.nombre || '',
          descripcion: serie.descripcion || '',
          valor_administrativo: !!serie.valor_administrativo,
          valor_legal: !!serie.valor_legal,
          valor_fiscal_contable: !!serie.valor_fiscal_contable,
          vigencia_tramite: serie.vigencia_tramite || 1,
          vigencia_concentracion: serie.vigencia_concentracion || 1,
          disposicion_final: serie.disposicion_final || 'Baja',
          metros_lineales: serie.metros_lineales || 0,
          edificio_sede: serie.edificio_sede || '',
          area_resguardo: serie.area_resguardo || '',
        });
      } else {
        setFormData({
          seccion_id: '',
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
  }, [isOpen, serie, dispatch, secciones]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      codigo: `${getSeccionCodigo(formData.seccion_id)}${formData.codigo_sufijo}`,
      vigencia_tramite: parseInt(formData.vigencia_tramite) || 1,
      vigencia_concentracion: parseInt(formData.vigencia_concentracion) || 1,
      metros_lineales: parseFloat(formData.metros_lineales) || 0
    };

    try {
      if (isEdit) {
        await dispatch(updateSerie({ id: serie.id, formData: submitData })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Actualizada!</span>',
          text: 'La serie documental ha sido actualizada correctamente.',
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
        await dispatch(createSerie(submitData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Registrada!</span>',
          text: 'La serie documental ha sido registrada correctamente.',
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
       // Gestión de excepciones de validación centralizada en Redux.
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
          className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-8 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#BC955B]/10 rounded-full -mr-24 -mt-24"></div>
            <div className="relative z-10 flex items-center gap-4">
              <ShieldCheck size={32} className="text-[#BC955B]" />
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                    {isEdit ? 'EDITAR SERIE' : 'NUEVA SERIE DOCUMENTAL'}
                </h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Clasificación Nivel 3 (Serie)</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-[1.25rem] transition-all shadow-xl active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* { sección 1: identificación y jerarquía } */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
              <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Sección Perteneciente *</label>
                    <div className={`relative transition-all ${reduxErrors?.seccion_id ? 'ring-4 ring-red-50' : ''}`}>
                       <select 
                         required 
                         name="seccion_id"
                         value={formData.seccion_id} 
                         onChange={handleInputChange} 
                         className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none transition-all font-bold text-gray-700 text-sm appearance-none ${reduxErrors?.seccion_id ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                       >
                         <option value="">Seleccionar Sección...</option>
                         {secciones.map(s => (
                           <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
                         ))}
                       </select>
                    </div>
                    {reduxErrors?.seccion_id && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.seccion_id[0]}</p>}
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Código de la Serie *</label>
                    <div className="flex items-center gap-2">
                      {formData.seccion_id && (
                        <span className="bg-gray-100 px-4 py-4 rounded-2xl font-black text-gray-400 text-sm border-2 border-gray-100">
                          {getSeccionCodigo(formData.seccion_id)}
                        </span>
                      )}
                      <div className={`relative flex-1 transition-all ${reduxErrors?.codigo ? 'ring-4 ring-red-50' : ''}`}>
                         <input 
                           required 
                           type="text" 
                           name="codigo_sufijo"
                           value={formData.codigo_sufijo} 
                           onChange={handleInputChange} 
                           className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none font-black text-gray-700 text-sm uppercase transition-all ${reduxErrors?.codigo ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                           placeholder="Sufijo (ej. 1)" 
                         />
                      </div>
                    </div>
                    {reduxErrors?.codigo && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.codigo[0]}</p>}
                    <p className="text-[8px] text-[#BC955B] font-bold uppercase tracking-widest ml-4 mt-1">Código final: {getSeccionCodigo(formData.seccion_id)}{formData.codigo_sufijo || '...'}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Nombre de la Serie *</label>
                    <div className={`relative transition-all ${reduxErrors?.nombre ? 'ring-4 ring-red-50' : ''}`}>
                       <input 
                         required 
                         type="text" 
                         name="nombre"
                         value={formData.nombre} 
                         onChange={handleInputChange} 
                         className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none transition-all font-black text-gray-700 text-sm ${reduxErrors?.nombre ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                         placeholder="Nombre descriptivo..." 
                       />
                    </div>
                    {reduxErrors?.nombre && <p className="text-[9px] text-red-500 font-bold uppercase ml-4 mt-2">{reduxErrors.nombre[0]}</p>}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                      <FileText size={12} className="text-[#BC955B]" /> Descripción de la Serie *
                    </label>
                    <div className={`relative transition-all ${reduxErrors?.descripcion ? 'ring-4 ring-red-50' : ''}`}>
                       <textarea 
                         required
                         name="descripcion"
                         value={formData.descripcion} 
                         onChange={handleInputChange} 
                         className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-bold text-gray-700 text-sm min-h-[100px] resize-none ${reduxErrors?.descripcion ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                         placeholder="Describa el contenido y alcance de esta serie (Requerido para Guía Simple)..." 
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
                         name="edificio_sede" 
                         value={formData.edificio_sede} 
                         onChange={handleInputChange} 
                         className="w-full bg-white border-2 border-white rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-700 text-sm focus:border-[#BC955B] outline-none transition-all shadow-sm"
                         placeholder="Ej. Almacén Central" 
                       />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Área de Resguardo</label>
                    <div className="relative">
                       <Layers size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#BC955B]/50" />
                       <input 
                         type="text" 
                         name="area_resguardo" 
                         value={formData.area_resguardo} 
                         onChange={handleInputChange} 
                         className="w-full bg-white border-2 border-white rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-700 text-sm focus:border-[#BC955B] outline-none transition-all shadow-sm"
                         placeholder="Ej. Nave A, Bóveda 1" 
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
                         name="metros_lineales" 
                         value={formData.metros_lineales} 
                         onChange={handleInputChange} 
                         onBlur={handleInputBlur}
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
                          name={v.id} 
                          checked={formData[v.id]} 
                          onChange={handleInputChange} 
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
                       <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2 text-blue-600 font-black">Trámite *</label>
                       <input 
                         type="number" 
                         name="vigencia_tramite" 
                         min="1"
                         value={formData.vigencia_tramite} 
                         onChange={handleInputChange} 
                         onBlur={handleInputBlur}
                         onKeyDown={(e) => {
                           if (e.key === '-' || e.key === 'e') e.preventDefault();
                         }}
                         className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all font-black text-slate-700 text-sm ${reduxErrors?.vigencia_tramite ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-blue-400'}`}
                       />
                       {reduxErrors?.vigencia_tramite && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{reduxErrors.vigencia_tramite[0]}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2 text-amber-600 font-black">Concentración *</label>
                       <input 
                         type="number" 
                         name="vigencia_concentracion" 
                         min="1"
                         value={formData.vigencia_concentracion} 
                         onChange={handleInputChange} 
                         onBlur={handleInputBlur}
                         onKeyDown={(e) => {
                           if (e.key === '-' || e.key === 'e') e.preventDefault();
                         }}
                         className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all font-black text-slate-700 text-sm ${reduxErrors?.vigencia_concentracion ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-amber-400'}`}
                       />
                       {reduxErrors?.vigencia_concentracion && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{reduxErrors.vigencia_concentracion[0]}</p>}
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
                        formData.disposicion_final === option.value 
                          ? 'bg-white border-[#7A152E] shadow-xl' 
                          : 'bg-white/50 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="disposicion_final" 
                        value={option.value}
                        checked={formData.disposicion_final === option.value}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${formData.disposicion_final === option.value ? 'text-[#7A152E]' : 'text-gray-400'}`}>
                        {option.label}
                      </span>
                      <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase leading-tight">{option.desc}</p>
                      {formData.disposicion_final === option.value && (
                        <div className="absolute top-4 right-4 w-4 h-4 bg-[#7A152E] rounded-full flex items-center justify-center">
                           <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
            </div>

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
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {isEdit ? 'Actualizar Serie' : 'Guardar Serie'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default SerieForm;
