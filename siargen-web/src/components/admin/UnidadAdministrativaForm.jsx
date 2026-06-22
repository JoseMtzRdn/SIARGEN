import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Loader2, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle, 
  Hash 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createUnidad, 
  updateUnidad, 
  clearValidationErrors 
} from '../../store/unidadSlice';
import Swal from 'sweetalert2';
import ModalPortal from '../ModalPortal';

const UnidadAdministrativaForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  unidad = null 
}) => {
  const dispatch = useDispatch();
  const { actionLoading: loading, validationErrors: reduxErrors } = useSelector((state) => state.unidades);
  
  const isEdit = !!unidad;
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    telefono: '',
    extension: '',
    email: '',
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
        .replace(/[^A-Z0-9._\-\/]/g, '')
        .slice(0, 10);
    } else if (name === 'nombre' || name === 'direccion') {
      finalValue = capitalizeWords(value);
    } else if (name === 'email') {
      finalValue = value.toLowerCase();
    } else if (name === 'telefono' || name === 'extension') {
      finalValue = value.replace(/\D/g, '');
    }

    setFormData({ ...formData, [name]: finalValue });
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(clearValidationErrors());
      if (unidad) {
        setFormData({
          codigo: unidad.codigo || '',
          nombre: unidad.nombre || '',
          direccion: unidad.direccion || '',
          telefono: unidad.telefono || '',
          extension: unidad.extension || '',
          email: unidad.email || '',
        });
      } else {
        setFormData({
          codigo: '',
          nombre: '',
          direccion: '',
          telefono: '',
          extension: '',
          email: '',
        });
      }
    }
  }, [isOpen, unidad, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await dispatch(updateUnidad({ id: unidad.id, formData })).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Actualizado!</span>',
          text: 'La unidad administrativa ha sido actualizada correctamente.',
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
        await dispatch(createUnidad(formData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Registrada!</span>',
          text: 'La unidad administrativa ha sido registrada correctamente.',
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
      // si no es un error de validación (422), mostramos alerta general
      if (typeof error !== 'object' || !error.errors) {
        Swal.fire('Error', error || 'Ocurrió un problema al procesar la solicitud', 'error');
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
          className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          {/* { header } */}
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-8 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#BC955B]/10 rounded-full -mr-24 -mt-24"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                <Building className="text-[#BC955B]" size={32} />
                {isEdit ? 'ACTUALIZAR ÁREA' : 'REGISTRAR NUEVA ÁREA'}
              </h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 ml-12">Estructura Orgánica ISEM</p>
            </div>
            <button 
              onClick={onClose}
              className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-[1.25rem] transition-all shadow-xl active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* { columna izquierda: identificación } */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Código de Unidad *</label>
                  <div className={`relative transition-all ${reduxErrors?.codigo ? 'ring-4 ring-red-50' : ''}`}>
                     <input 
                       required 
                       type="text" 
                       name="codigo"
                       maxLength={10}
                       value={formData.codigo} 
                       onChange={handleInputChange} 
                       className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm uppercase ${reduxErrors?.codigo ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                       placeholder="UA-XXX" 
                     />
                     {reduxErrors?.codigo && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                  </div>
                  {reduxErrors?.codigo && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.codigo[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Nombre de la Unidad *</label>
                  <div className={`relative transition-all ${reduxErrors?.nombre ? 'ring-4 ring-red-50' : ''}`}>
                     <input 
                       required 
                       type="text" 
                       name="nombre"
                       maxLength={80}
                       value={formData.nombre} 
                       onChange={handleInputChange} 
                       className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm ${reduxErrors?.nombre ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                     />
                     {reduxErrors?.nombre && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                  </div>
                  {reduxErrors?.nombre && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.nombre[0]}</p>}
                </div>
              </div>

              {/* { columna derecha: contacto y ubicación } */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Email de Contacto *</label>
                  <div className={`relative transition-all ${reduxErrors?.email ? 'ring-4 ring-red-50' : ''}`}>
                     <Mail size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                     <input 
                       required 
                       type="text" 
                       name="email"
                       maxLength={45}
                       value={formData.email} 
                       onChange={handleInputChange} 
                       className={`w-full pl-14 pr-8 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm ${reduxErrors?.email ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                     />
                     {reduxErrors?.email && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                  </div>
                  {reduxErrors?.email && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.email[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Teléfono *</label>
                      <div className={`relative transition-all ${reduxErrors?.telefono ? 'ring-4 ring-red-50' : ''}`}>
                         <Phone size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                         <input 
                           required 
                           type="text" 
                           name="telefono"
                           minLength={10}
                           maxLength={10}
                           value={formData.telefono} 
                           onChange={handleInputChange} 
                           className={`w-full pl-14 pr-8 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm ${reduxErrors?.telefono ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                           placeholder="10 DÍGITOS EXACTOS" 
                         />
                      </div>
                      {reduxErrors?.telefono && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.telefono[0]}</p>}
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Extensión</label>
                      <div className="relative">
                         <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                         <input 
                           type="text" 
                           name="extension"
                           maxLength={10} 
                           value={formData.extension} 
                           onChange={handleInputChange} 
                           className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 focus:border-[#7A152E] outline-none transition-all font-black text-gray-700 text-sm" 
                           placeholder="000" 
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Dirección Física *</label>
                  <div className={`relative transition-all ${reduxErrors?.direccion ? 'ring-4 ring-red-50' : ''}`}>
                     <MapPin size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                     <input 
                       required 
                       type="text" 
                       name="direccion"
                       maxLength={150}
                       value={formData.direccion} 
                       onChange={handleInputChange} 
                       className={`w-full pl-14 pr-8 py-4 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-black text-gray-700 text-sm ${reduxErrors?.direccion ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`} 
                     />
                  </div>
                  {reduxErrors?.direccion && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{reduxErrors.direccion[0]}</p>}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end gap-4">
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
                className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isEdit ? 'Actualizar Área' : 'Registrar Área'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default UnidadAdministrativaForm;
