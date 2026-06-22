import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Database, AlertCircle, Bookmark, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { createSeccion, updateSeccion, clearArchivisticaErrors } from '../../store/archivisticaSlice';
import Swal from 'sweetalert2';
import ModalPortal from '../ModalPortal';

const SeccionForm = ({ isOpen, onClose, onSuccess, seccion = null }) => {
  const dispatch = useDispatch();
  const { actionLoading: loading, validationErrors: reduxErrors } = useSelector((state) => state.archivistica);
  const { items: fondos } = useSelector((state) => state.archivistica.fondos);
  
  const isEdit = !!seccion;
  const [formData, setFormData] = useState({
    fondo_id: '',
    codigo_sufijo: '',
    nombre: '',
  });

  const getFondoCodigo = (id) => {
    const f = fondos.find(item => item.id === parseInt(id));
    return f ? `${f.codigo}.` : '';
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'codigo_sufijo') {
      finalValue = value.toUpperCase()
        .replace(/[^A-Z0-9._/-]/g, '')
        .slice(0, 20);
    } else if (name === 'nombre') {
      finalValue = capitalizeWords(value).slice(0, 80);
    }

    setFormData({ ...formData, [name]: finalValue });
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(clearArchivisticaErrors());
      if (seccion) {
        const f = fondos.find(item => item.id === seccion.fondo_id);
        const prefix = f ? `${f.codigo}.` : '';
        const sufijo = seccion.codigo.startsWith(prefix) 
          ? seccion.codigo.slice(prefix.length) 
          : seccion.codigo;

        setFormData({
          fondo_id: seccion.fondo_id || '',
          codigo_sufijo: sufijo || '',
          nombre: seccion.nombre || '',
        });
      } else {
        setFormData({
          fondo_id: '',
          codigo_sufijo: '',
          nombre: '',
        });
      }
    }
  }, [isOpen, seccion, dispatch, fondos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const fullCodigo = `${getFondoCodigo(formData.fondo_id)}${formData.codigo_sufijo}`;
    const submitData = {
      ...formData,
      codigo: fullCodigo
    };

    try {
      if (isEdit) {
        await dispatch(updateSeccion({ id: seccion.id, formData: submitData })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Actualizada!</span>',
          text: 'La sección ha sido actualizada correctamente.',
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
        await dispatch(createSeccion(submitData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Registrada!</span>',
          text: 'La sección ha sido registrada correctamente.',
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
      if (typeof error !== 'object' || !error.errors) {
        const message = typeof error === 'string' ? error : (error?.message || 'Ocurrió un problema al procesar la solicitud');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: message,
          confirmButtonColor: '#7A152E'
        });
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
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC955B]/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <Bookmark size={24} className="text-[#BC955B]" />
                {isEdit ? 'EDITAR SECCIÓN' : 'NUEVA SECCIÓN'}
              </h3>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em] mt-1 ml-9">Clasificación Nivel 2 (Sección)</p>
            </div>
            <button 
              onClick={onClose}
              className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-xl transition-all shadow-xl active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Fondo Perteneciente *</label>
              <div className={`relative transition-all ${reduxErrors?.fondo_id ? 'ring-4 ring-red-50' : ''}`}>
                 <select 
                   required 
                   name="fondo_id"
                   value={formData.fondo_id} 
                   onChange={handleInputChange} 
                   className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none transition-all font-bold text-gray-700 text-sm appearance-none ${reduxErrors?.fondo_id ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                 >
                   <option value="">Seleccionar Fondo...</option>
                   {fondos.map(f => (
                     <option key={f.id} value={f.id}>{f.codigo} - {f.nombre}</option>
                   ))}
                 </select>
              </div>
              {reduxErrors?.fondo_id && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.fondo_id[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Código de la Sección *</label>
              <div className="flex items-center gap-2">
                {formData.fondo_id && (
                  <span className="bg-gray-100 px-4 py-4 rounded-2xl font-black text-gray-400 text-sm border-2 border-gray-100">
                    {getFondoCodigo(formData.fondo_id)}
                  </span>
                )}
                <div className={`relative flex-1 transition-all ${reduxErrors?.codigo ? 'ring-4 ring-red-50' : ''}`}>
                   <input 
                     required 
                     type="text" 
                     name="codigo_sufijo"
                     value={formData.codigo_sufijo} 
                     onChange={handleInputChange} 
                     className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm uppercase ${reduxErrors?.codigo ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                     placeholder="Sufijo (ej. 1)" 
                   />
                   {reduxErrors?.codigo && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                </div>
              </div>
              {reduxErrors?.codigo && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.codigo[0]}</p>}
              <p className="text-[8px] text-[#BC955B] font-bold uppercase tracking-widest ml-4 mt-1">El código se formará automáticamente como: {getFondoCodigo(formData.fondo_id)}{formData.codigo_sufijo || '...'}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Nombre de la Sección *</label>
              <div className={`relative transition-all ${reduxErrors?.nombre ? 'ring-4 ring-red-50' : ''}`}>
                 <input 
                   required 
                   type="text" 
                   name="nombre"
                   value={formData.nombre} 
                   onChange={handleInputChange} 
                   className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm ${reduxErrors?.nombre ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                   placeholder="Nombre descriptivo..." 
                 />
                 {reduxErrors?.nombre && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
              </div>
              {reduxErrors?.nombre && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.nombre[0]}</p>}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-100 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:shadow-[0_10px_30px_rgba(122,21,46,0.2)] transition-all transform active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isEdit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default SeccionForm;
