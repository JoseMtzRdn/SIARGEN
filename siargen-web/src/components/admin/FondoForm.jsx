import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { createFondo, updateFondo, clearArchivisticaErrors } from '../../store/archivisticaSlice';
import Swal from 'sweetalert2';
import ModalPortal from '../ModalPortal';

const FondoForm = ({ isOpen, onClose, onSuccess, fondo = null }) => {
  const dispatch = useDispatch();
  const { actionLoading: loading, validationErrors: reduxErrors } = useSelector((state) => state.archivistica);
  
  const isEdit = !!fondo;
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
  });

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'codigo') {
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
      if (fondo) {
        setFormData({
          codigo: fondo.codigo || '',
          nombre: fondo.nombre || '',
        });
      } else {
        setFormData({
          codigo: '',
          nombre: '',
        });
      }
    }
  }, [isOpen, fondo, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await dispatch(updateFondo({ id: fondo.id, formData })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Actualizado!</span>',
          text: 'El fondo ha sido actualizado correctamente.',
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
        await dispatch(createFondo(formData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Registrado!</span>',
          text: 'El fondo ha sido registrado correctamente.',
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
          className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC955B]/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <Database size={24} className="text-[#BC955B]" />
                {isEdit ? 'EDITAR FONDO' : 'NUEVO FONDO'}
              </h3>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em] mt-1 ml-9">Clasificación Nivel 1 (Fondo)</p>
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
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Código del Fondo *</label>
              <div className={`relative transition-all ${reduxErrors?.codigo ? 'ring-4 ring-red-50' : ''}`}>
                 <input 
                   required 
                   type="text" 
                   name="codigo"
                   value={formData.codigo} 
                   onChange={handleInputChange} 
                   className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm uppercase ${reduxErrors?.codigo ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                   placeholder="EJ. ISEM" 
                 />
                 {reduxErrors?.codigo && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
              </div>
              {reduxErrors?.codigo && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.codigo[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Nombre del Fondo *</label>
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

export default FondoForm;
