import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { 
  createUser, 
  updateUser, 
  clearValidationErrors 
} from '../../store/userSlice';
import { 
  X, 
  Save, 
  Loader2, 
  User, 
  Mail, 
  Shield, 
  Building, 
  Key,
  AlertCircle,
  Phone,
  Eye,
  EyeOff,
  Hash
} from 'lucide-react';
import Swal from 'sweetalert2';
import { userService } from '../../api/userService';
import { checkAuth } from '../../store/authSlice';
import { motion } from 'framer-motion';
import ModalPortal from '../ModalPortal';

const UsuarioForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user = null, 
  roles = [], 
  unidades = [], 
  catalogsLoading = false 
}) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector(state => state.auth);
  const { actionLoading: loading, validationErrors: reduxErrors } = useSelector(state => state.users);
  
  const isEdit = !!user;
  const isSelf = user && currentUser && Number(user.id) === Number(currentUser.id);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, setError, clearErrors, formState: { errors } } = useForm({
    mode: 'onBlur'
  });
  
  const selectedRoleId = watch('role_id');

  const isGlobalRole = () => {
    if (!selectedRoleId || roles.length === 0) return false;
    const role = roles.find(r => Number(r.id) === Number(selectedRoleId));
    return role && ['admin_ti', 'coord_archivos', 'rac', 'rah'].includes(role.slug);
  };

  useEffect(() => {
    if (isGlobalRole()) {
      setValue('unidad_administrativa_id', '');
    }
  }, [selectedRoleId, setValue]);

  const checkFieldAvailability = async (field, value) => {
    if (!value || isSelf) return;
    try {
      const res = await userService.checkAvailability(field, value, user?.id);
      const data = res.data.data;
      if (!data.available) {
        setError(field, { type: 'manual', message: data.message });
      } else if (errors[field]?.type === 'manual') {
        clearErrors(field);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    setValue(name, capitalizeWords(value));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value.toLowerCase());
  };

  useEffect(() => {
    if (isOpen && !catalogsLoading) {
      dispatch(clearValidationErrors());
      if (user) {
        reset({
          nombre: user.nombre || '',
          apellido_paterno: user.apellido_paterno || '',
          apellido_materno: user.apellido_materno || '',
          username: user.username,
          email: user.email,
          cargo: user.cargo || '',
          telefono: user.telefono || '',
          extension: user.extension || '',
          role_id: user.role_id,
          unidad_administrativa_id: user.unidad_administrativa_id || '',
          activo: user.activo,
          password: '',
          password_confirmation: ''
        });
      } else {
        reset({
          nombre: '',
          apellido_paterno: '',
          apellido_materno: '',
          username: '',
          email: '',
          cargo: '',
          telefono: '',
          extension: '',
          password: '',
          password_confirmation: '',
          role_id: '',
          unidad_administrativa_id: '',
          activo: true
        });
      }
    }
  }, [isOpen, user, reset, catalogsLoading, dispatch]);

  const onSubmit = async (data) => {
    const submitData = { ...data };
    if (isEdit && !submitData.password) {
      delete submitData.password;
      delete submitData.password_confirmation;
    }

    if (isSelf) {
      delete submitData.role_id;
      delete submitData.activo;
    }

    try {
      if (isEdit) {
        await dispatch(updateUser({ id: user.id, formData: submitData })).unwrap();
        if (isSelf) dispatch(checkAuth());
        Swal.fire({
          icon: 'success',
          title: `<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Actualizado!</span>`,
          text: isSelf ? 'Tu perfil ha sido actualizado correctamente.' : 'El usuario ha sido actualizado correctamente.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
      } else {
        await dispatch(createUser(submitData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: `<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Creado!</span>`,
          text: 'El usuario ha sido creado correctamente.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("User Form Error:", error);
      if (typeof error !== 'object' || !error.errors) {
        const message = typeof error === 'string' ? error : (error.message || 'Ocurrió un problema al procesar la solicitud');
        Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonColor: '#7A152E' });
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
          className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]"
        >
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC955B]/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <User size={24} className="text-[#BC955B]" />
                {isSelf ? 'MI PERFIL' : (isEdit ? 'EDITAR USUARIO' : 'NUEVA CUENTA')}
              </h3>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em] mt-1 ml-9">
                Gestión de Personal Institucional ISEM
              </p>
            </div>
            <button onClick={onClose} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-xl transition-all shadow-xl active:scale-90">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {catalogsLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-[#7A152E]" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Sincronizando catálogos...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                    <User size={14} className="text-[#BC955B]" />
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Identidad Personal</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Nombre(s) *</label>
                      <input
                        {...register('nombre', { 
                          required: 'Obligatorio', 
                          maxLength: { value: 25, message: 'Máx. 25' },
                          pattern: { 
                            value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 
                            message: 'Sin signos de puntuación' 
                          }
                        })}
                        onChange={(e) => { handleNameChange(e); register('nombre').onChange(e); }}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.nombre || reduxErrors?.nombre ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="Nombre"
                      />
                      {errors.nombre && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.nombre.message}</p>}
                      {reduxErrors?.nombre && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.nombre[0]}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Ap. Paterno *</label>
                      <input
                        {...register('apellido_paterno', { 
                          required: 'Obligatorio', 
                          maxLength: { value: 25, message: 'Máx. 25' },
                          pattern: { 
                            value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 
                            message: 'Sin signos de puntuación' 
                          }
                        })}
                        onChange={(e) => { handleNameChange(e); register('apellido_paterno').onChange(e); }}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.apellido_paterno || reduxErrors?.apellido_paterno ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="Paterno"
                      />
                      {errors.apellido_paterno && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.apellido_paterno.message}</p>}
                      {reduxErrors?.apellido_paterno && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.apellido_paterno[0]}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Ap. Materno *</label>
                      <input
                        {...register('apellido_materno', { 
                          required: 'Obligatorio', 
                          maxLength: { value: 25, message: 'Máx. 25' },
                          pattern: { 
                            value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 
                            message: 'Sin signos de puntuación' 
                          }
                        })}
                        onChange={(e) => { handleNameChange(e); register('apellido_materno').onChange(e); }}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.apellido_materno || reduxErrors?.apellido_materno ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="Materno"
                      />
                      {errors.apellido_materno && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.apellido_materno.message}</p>}
                      {reduxErrors?.apellido_materno && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.apellido_materno[0]}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">ID Acceso (Usuario) *</label>
                      <input
                        {...register('username', { 
                          required: 'Obligatorio', 
                          minLength: { value: 6, message: 'Mínimo 6 caracteres' } 
                        })}
                        onBlur={(e) => checkFieldAvailability('username', e.target.value)}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.username || reduxErrors?.username ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errors.username && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.username.message}</p>}
                      {reduxErrors?.username && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.username[0]}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Cargo Institucional *</label>
                      <input
                        {...register('cargo', { required: 'Obligatorio' })}
                        onChange={(e) => { handleNameChange(e); register('cargo').onChange(e); }}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.cargo || reduxErrors?.cargo ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="Ej. Jefe De Departamento"
                      />
                      {errors.cargo && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.cargo.message}</p>}
                      {reduxErrors?.cargo && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.cargo[0]}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Correo Electrónico *</label>
                    <input
                      {...register('email', { 
                        required: 'Obligatorio',
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]{6,30}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: 'Formato inválido (mín. 6 caracteres antes del @ y dominio válido)'
                        }
                      })}
                      onChange={(e) => { handleEmailChange(e); register('email').onChange(e); }}
                      onBlur={(e) => checkFieldAvailability('email', e.target.value)}
                      className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.email || reduxErrors?.email ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                      placeholder="usuario@ejemplo.com"
                    />
                    {errors.email && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.email.message}</p>}
                    {reduxErrors?.email && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.email[0]}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Teléfono Institucional *</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                          {...register('telefono', { 
                            required: 'Obligatorio',
                            pattern: { value: /^[0-9]*$/, message: 'Solo números' }, 
                            minLength: { value: 10, message: 'Debe ser de 10 dígitos' }
                          })}
                          maxLength={10}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, '');
                            register('telefono').onChange(e);
                          }}
                          className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.telefono || reduxErrors?.telefono ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                          placeholder="10 DÍGITOS"
                        />
                        {(errors.telefono || reduxErrors?.telefono) && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                      </div>
                      {errors.telefono && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.telefono.message}</p>}
                      {reduxErrors?.telefono && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.telefono[0]}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Extensión</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                          {...register('extension', { 
                            pattern: { value: /^[0-9]*$/, message: 'Solo números' },
                            maxLength: { value: 10, message: 'Máx. 10 caracteres' }
                          })}
                          maxLength={10}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, '');
                            register('extension').onChange(e);
                          }}
                          className={`w-full bg-gray-50 border-2 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.extension || reduxErrors?.extension ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                          placeholder="000"
                        />
                        {(errors.extension || reduxErrors?.extension) && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />}
                      </div>
                      {errors.extension && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.extension.message}</p>}
                      {reduxErrors?.extension && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.extension[0]}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                    <Building size={14} className="text-[#BC955B]" />
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Adscripción y Perfil</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Unidad Administrativa *</label>
                      <select
                        disabled={isGlobalRole()}
                        {...register('unidad_administrativa_id', { required: !isGlobalRole() ? 'Obligatorio' : false })}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all appearance-none ${isGlobalRole() ? 'opacity-50 cursor-not-allowed bg-gray-100' : (errors.unidad_administrativa_id || reduxErrors?.unidad_administrativa_id ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]')}`}
                      >
                        <option value="">{isGlobalRole() ? 'No requerida' : 'Seleccionar Unidad...'}</option>
                        {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>)}
                      </select>
                      {errors.unidad_administrativa_id && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.unidad_administrativa_id.message}</p>}
                      {reduxErrors?.unidad_administrativa_id && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.unidad_administrativa_id[0]}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Rol Normativo *</label>
                      <select
                        disabled={isSelf}
                        {...register('role_id', { required: 'Obligatorio' })}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all appearance-none ${isSelf ? 'opacity-50 cursor-not-allowed bg-gray-100' : (errors.role_id || reduxErrors?.role_id ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]')}`}
                      >
                        <option value="">Seleccionar Rol...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                      {errors.role_id && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.role_id.message}</p>}
                      {reduxErrors?.role_id && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.role_id[0]}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                    <Key size={14} className="text-[#BC955B]" />
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Seguridad</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 relative">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">{isEdit ? 'Nueva Contraseña' : 'Contraseña *'}</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register('password', { 
                          required: !isEdit ? 'Obligatorio' : false, 
                          minLength: { value: 8, message: 'Mínimo 8 caracteres' } 
                        })}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.password || reduxErrors?.password ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-gray-300 hover:text-[#7A152E]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      {errors.password && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.password.message}</p>}
                      {reduxErrors?.password && <p className="text-red-500 text-[9px] mt-1 font-black uppercase tracking-wider ml-2">{reduxErrors.password[0]}</p>}
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Confirmar *</label>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        {...register('password_confirmation', { 
                          required: watch('password') ? 'Confirme la contraseña' : false,
                          validate: value => !watch('password') || value === watch('password') || 'Las contraseñas no coinciden' 
                        })}
                        className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all ${errors.password_confirmation || reduxErrors?.password_confirmation ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-[#7A152E]'}`}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-[38px] text-gray-300 hover:text-[#7A152E]">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      {errors.password_confirmation && <p className="text-red-500 text-[9px] font-bold italic ml-2">{errors.password_confirmation.message}</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent active:scale-90">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-[#7A152E]/20">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> {isEdit ? 'Actualizar' : 'Guardar'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default UsuarioForm;
