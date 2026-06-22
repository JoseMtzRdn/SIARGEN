import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, User, Building2, Briefcase, Calendar, FileText, Search, Plus, ArrowLeft, Phone, Trash2, Lock, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { createPrestamo, clearPrestamoErrors } from '../../store/prestamoSlice';
import { fetchExpedientes } from '../../store/expedienteSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import Swal from 'sweetalert2';
import ModalPortal from '../ModalPortal';

const PrestamoForm = ({ isOpen, onClose, onSuccess, expediente = null, fase = 'concentracion' }) => {
  const dispatch = useDispatch();
  
  const { actionLoading: loading, validationErrors: reduxErrors } = useSelector((state) => state.prestamos);
  const { items: allExpedientes, loading: loadingExpedientes } = useSelector((state) => state.expedientes);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  
    const [formData, setFormData] = useState({
    expedientes_ids: [],
    unidad_administrativa_id: '',
    fase: fase,
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    cargo_solicitante: '',
    unidad_solicitante: '',
    telefono: '',
    extension: '',
    fecha_vencimiento: '',
    estado_salida: 'bueno',
    observaciones: ''
  });

  const [selectedExpedientes, setSelectedExpedientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOtherUnidad, setIsOtherUnidad] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const availableExpedientes = useMemo(() => {
    if (!formData.unidad_administrativa_id) return [];
    const list = Array.isArray(allExpedientes) ? allExpedientes : [];
    
    return list.filter(exp => {
        // 1.
        const matchesUnidad = Number(exp.unidad_administrativa_id) === Number(formData.unidad_administrativa_id);
        const isCorrectFase = exp.fase === fase;
        
        // 2.
        const isDisponible = exp.estatus_disponibilidad === 'disponible';
        
        // 3.
        const isCerradoYProtegido = exp.estado_archivo === 'cerrado' && !exp.is_in_subsanacion;
        
        // 4.
        const hasLocation = !!(exp.ubicacion_seccion && exp.ubicacion_caja); 
        
        // 5.
        const isNotExpired = !exp.vigencia_cumplida; 

        // 6.
        const isNotSelected = !selectedExpedientes.some(s => s.id === exp.id);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            exp.numero_expediente?.toLowerCase().includes(searchLower) || 
            exp.titulo?.toLowerCase().includes(searchLower) ||
            exp.serie?.nombre?.toLowerCase().includes(searchLower) ||
            exp.subserie?.nombre?.toLowerCase().includes(searchLower);
        
        return matchesUnidad && isCorrectFase && isDisponible && isCerradoYProtegido && hasLocation && isNotExpired && isNotSelected && matchesSearch;
    });
  }, [allExpedientes, selectedExpedientes, searchTerm, formData.unidad_administrativa_id, fase]);

  const { user: rawUser } = useSelector((state) => state.auth);
  const user = rawUser?.data || rawUser;
  const userRole = user?.role?.slug || '';
  const isRat = userRole === 'rat';

  useEffect(() => {
    if (isOpen) {
      dispatch(clearPrestamoErrors());
      setLocalErrors({});
      if (unidades.length === 0) dispatch(fetchUnidadesCatalog());
      dispatch(fetchExpedientes({ per_page: -1, fase: fase }));

      const initialExpedientes = expediente ? [expediente] : [];
      setSelectedExpedientes(initialExpedientes);
      
      const userUnidadId = user?.unidad_administrativa_id || user?.unidad_administrativa?.id || '';

      setFormData({
        expedientes_ids: initialExpedientes.map(e => e.id),
        unidad_administrativa_id: (fase === 'tramite' && isRat) ? userUnidadId : (expediente?.unidad_administrativa_id || ''),
        fase: fase,
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        cargo_solicitante: '',
        unidad_solicitante: '',
        telefono: '',
        extension: '',
        fecha_vencimiento: '',
        estado_salida: 'bueno',
        observaciones: ''
      });
      
      setIsOtherUnidad(false);
      setSearchTerm('');
    }
  }, [isOpen, expediente, dispatch, fase, isRat, user]);

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'unidad_administrativa_id' && value !== formData.unidad_administrativa_id) {
        setSelectedExpedientes([]);
        setFormData(prev => ({ ...prev, [name]: value, expedientes_ids: [] }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (localErrors[name]) setLocalErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: capitalizeWords(value) });
    if (localErrors[name]) setLocalErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/\D/g, '').slice(0, name === 'telefono' ? 10 : 6);
    setFormData({ ...formData, [name]: cleanValue });
    if (localErrors[name]) setLocalErrors(prev => ({ ...prev, [name]: null }));
  };

  const addExpediente = (exp) => {
    const newSelected = [...selectedExpedientes, exp];
    setSelectedExpedientes(newSelected);
    setFormData({ ...formData, expedientes_ids: newSelected.map(e => e.id) });
    setLocalErrors(prev => ({ ...prev, expedientes_ids: null }));
  };

  const removeExpediente = (id) => {
    const newSelected = selectedExpedientes.filter(e => e.id !== id);
    setSelectedExpedientes(newSelected);
    setFormData({ ...formData, expedientes_ids: newSelected.map(e => e.id) });
  };

  const handleUnidadChange = (e) => {
    const value = e.target.value;
    if (value === 'OTHER') {
        setIsOtherUnidad(true);
        setFormData({ ...formData, unidad_solicitante: '' });
    } else {
        setFormData({ ...formData, unidad_solicitante: capitalizeWords(value) });
    }
    if (localErrors.unidad_solicitante) setLocalErrors(prev => ({ ...prev, unidad_solicitante: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (formData.expedientes_ids.length === 0) errors.expedientes_ids = 'Debe seleccionar al menos un expediente.';
    if (!formData.unidad_administrativa_id) errors.unidad_administrativa_id = 'La unidad responsable es obligatoria.';
    if (!formData.nombre) errors.nombre = 'El nombre es obligatorio.';
    if (!formData.apellido_paterno) errors.apellido_paterno = 'El apellido paterno es obligatorio.';
    if (!formData.apellido_materno) errors.apellido_materno = 'El apellido materno es obligatorio.';
    if (!formData.cargo_solicitante) errors.cargo_solicitante = 'El cargo es obligatorio.';

    if (!formData.telefono || formData.telefono.length !== 10) {
        errors.telefono = 'El teléfono de 10 dígitos es obligatorio.';
    }

    // validar fecha de vencimiento posterior a hoy
    if (formData.fecha_vencimiento) {
        const selected = new Date(formData.fecha_vencimiento);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected <= today) {
            errors.fecha_vencimiento = 'La fecha debe ser al menos un día posterior a hoy.';
        }
    }

    if (Object.keys(errors).length > 0) {
        setLocalErrors(errors);
        return;
    }

    // mapeo de fase a entero para la base de datos
    const faseValue = formData.fase === 'concentracion' ? 2 : 1;

    try {
      await dispatch(createPrestamo({
        ...formData,
        fase: faseValue
      })).unwrap();
      Swal.fire({
        icon: 'success',
        title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡VALE GENERADO!</span>',
        text: 'Los expedientes han sido bloqueados correctamente.',
        iconColor: '#7A152E',
        timer: 2500,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: { 
            container: 'z-[10001]',
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
        }
      });
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error?.errors ? Object.values(error.errors)[0][0] : (error?.message || 'Error desconocido');
      Swal.fire({
        icon: 'error',
        title: '<span class="font-black tracking-tighter text-red-600 uppercase">Error de Validación</span>',
        html: `<p class="font-bold text-gray-600">${errorMessage}</p>`,
        confirmButtonColor: '#7A152E',
        background: '#ffffff',
        customClass: { 
            container: 'z-[10001]',
            popup: 'rounded-[2rem] shadow-2xl border-none',
            title: 'text-xl py-6',
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 z-[10000]">
          <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3"><FileText size={28} className="text-[#BC955B]" />VALE DE PRÉSTAMO</h3>
              <p className="text-white/60 text-[8px] font-bold uppercase tracking-[0.4em] mt-1 ml-10">ISEM</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-[#7A152E] rounded-xl transition-all"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            <div className={`p-6 rounded-[2rem] border-2 transition-all ${localErrors.unidad_administrativa_id ? 'bg-red-50 border-red-200 ring-4 ring-red-50' : 'bg-amber-50/40 border-amber-100'}`}>
                <div className="flex items-center gap-2 border-b border-amber-100/50 pb-2 mb-4">
                    <Building2 size={16} className="text-amber-600" /><h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Unidad que Presta (Origen)</h4>
                </div>
                <div className="space-y-1">
                    {isRat && fase === 'tramite' ? (
                        <div className="w-full px-5 py-4 bg-white/50 border-2 border-amber-200 rounded-2xl font-black text-xs text-amber-900 text-center uppercase shadow-inner">
                            {user?.unidad_administrativa?.nombre || 'UNIDAD NO IDENTIFICADA'}
                        </div>
                    ) : (
                        <>
                            <label className="text-[9px] font-black text-amber-800/50 uppercase tracking-widest ml-2 text-center block">Seleccione la unidad administrativa que entrega los expedientes *</label>
                            <select required name="unidad_administrativa_id" value={formData.unidad_administrativa_id} onChange={handleInputChange} className={`w-full px-5 py-4 bg-white border-2 rounded-2xl focus:border-amber-500 outline-none font-bold text-sm appearance-none cursor-pointer text-center transition-all ${localErrors.unidad_administrativa_id ? 'border-red-300' : 'border-amber-100'}`}>
                                <option value="">-- SELECCIONAR UNIDAD ORIGEN --</option>
                                {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>)}
                            </select>
                        </>
                    )}
                    
                    {localErrors.unidad_administrativa_id && <p className="text-[8px] text-red-500 font-bold text-center mt-2 uppercase">{localErrors.unidad_administrativa_id}</p>}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expedientes en este Vale ({selectedExpedientes.length})</label>
                    {selectedExpedientes.length > 0 && <button type="button" onClick={() => setSelectedExpedientes([])} className="text-[8px] font-black text-red-400 hover:text-red-600 uppercase">Limpiar Cesta</button>}
                </div>
                <div className={`min-h-[60px] max-h-40 overflow-y-auto p-4 rounded-[1.5rem] border-2 border-dashed space-y-2 transition-all ${localErrors.expedientes_ids ? 'bg-red-50 border-red-200 ring-4 ring-red-50' : 'bg-slate-50 border-slate-200'}`}>
                    <AnimatePresence>
                        {selectedExpedientes.length > 0 ? selectedExpedientes.map(exp => (
                            <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                <div className="flex flex-col overflow-hidden"><span className="text-[10px] font-black text-[#7A152E] uppercase truncate">{exp.numero_expediente}</span><span className="text-[11px] font-bold text-gray-600 truncate">{exp.titulo}</span></div>
                                <button type="button" onClick={() => removeExpediente(exp.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </motion.div>
                        )) : <p className="py-4 text-center text-gray-400 text-[10px] font-bold uppercase italic">Añada expedientes abajo</p>}
                    </AnimatePresence>
                </div>
                {localErrors.expedientes_ids && <p className="text-[9px] text-red-500 font-bold uppercase ml-4">{localErrors.expedientes_ids}</p>}
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input disabled={!formData.unidad_administrativa_id} type="text" placeholder="Buscar para añadir..." className={`w-full pl-14 pr-6 py-4 border-2 rounded-2xl outline-none font-bold text-sm transition-all ${!formData.unidad_administrativa_id ? 'bg-gray-100 cursor-not-allowed border-gray-100' : 'bg-white border-gray-100 focus:border-[#7A152E]'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar bg-slate-50/50 p-2 rounded-2xl border border-gray-50">
                    {loadingExpedientes ? <div className="py-8 flex flex-col items-center gap-2"><Loader2 className="animate-spin text-[#7A152E]" size={24} /><p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Cargando Acervo...</p></div> : formData.unidad_administrativa_id ? availableExpedientes.length > 0 ? availableExpedientes.map(exp => {
                        const hasLocation = fase === 'tramite' || !!(exp.ubicacion_seccion && exp.ubicacion_seccion.trim() !== '');
                        const isSubsanacion = exp.estado_archivo === 'subsanacion';
                        const isBlocked = !hasLocation || isSubsanacion;

                        return (
                        <button 
                            key={exp.id} 
                            type="button" 
                            disabled={isBlocked} 
                            onClick={() => !isBlocked && addExpediente(exp)} 
                            className={`w-full p-4 bg-white border border-gray-100 rounded-xl text-left transition-all flex justify-between items-center group shadow-sm ${!isBlocked ? 'hover:bg-[#7A152E]/5 hover:border-[#7A152E]/20' : 'opacity-60 cursor-not-allowed bg-gray-50'}`} 
                            title={isSubsanacion ? "El expediente está en proceso de subsanación" : !hasLocation ? "Debe asignar la ubicación topográfica antes de prestar" : ""}
                        >
                            <div className="flex flex-col overflow-hidden w-full pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${!isBlocked ? 'bg-[#7A152E]/5 text-[#7A152E] border-[#7A152E]/10' : 'bg-red-50 text-red-400 border-red-100'}`}>
                                        {exp.numero_expediente}
                                    </span>
                                    {isSubsanacion && (
                                        <span className="text-[7px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200 uppercase animate-pulse">
                                            En Subsanación
                                        </span>
                                    )}
                                    {fase === 'concentracion' && !hasLocation && (
                                        <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase">
                                            Sin Ubicación RAC
                                        </span>
                                    )}
                                </div>
                                
                                <span className="text-xs font-bold text-gray-700 truncate leading-tight mb-1">{exp.titulo}</span>
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                                        <Archive size={8} /> {exp.subserie ? exp.subserie.nombre : exp.serie?.nombre}
                                    </span>
                                    {fase === 'concentracion' && hasLocation && (
                                        <span className="text-[8px] font-bold text-[#BC955B] uppercase tracking-tighter">
                                            Ubic: {exp.ubicacion_seccion}-{exp.ubicacion_bateria || '-'}-{exp.ubicacion_modulo || '-'}-{exp.ubicacion_entrepaño || '-'}-{exp.ubicacion_caja || '-'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!isBlocked ? <Plus size={16} className="text-gray-300 group-hover:text-[#7A152E] shrink-0" /> : <Lock size={16} className="text-red-300 shrink-0" />}
                        </button>
                    )}) : <div className="py-8 text-center bg-white rounded-xl border border-dashed border-gray-200"><p className="text-[9px] font-black text-gray-400 uppercase italic">Sin expedientes disponibles para préstamo</p></div> : <div className="py-8 text-center bg-white rounded-xl border border-dashed border-gray-200"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Seleccione Unidad Origen arriba</p></div>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 pt-6 border-t border-gray-100">
                <div className="col-span-3 flex items-center gap-3"><User size={14} className="text-[#7A152E]" /><h4 className="text-[10px] font-black text-[#7A152E] uppercase tracking-widest">Información del Solicitante</h4></div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre(s) *</label>
                    <input required name="nombre" value={formData.nombre} onChange={handleNameChange} className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all ${localErrors.nombre ? 'border-red-200 bg-red-50' : 'border-gray-100'}`} placeholder="Nombres..." />
                    {localErrors.nombre && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.nombre}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Ap. Paterno *</label>
                    <input required name="apellido_paterno" value={formData.apellido_paterno} onChange={handleNameChange} className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all ${localErrors.apellido_paterno ? 'border-red-200 bg-red-50' : 'border-gray-100'}`} placeholder="Paterno..." />
                    {localErrors.apellido_paterno && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.apellido_paterno}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Ap. Materno *</label>
                    <input required name="apellido_materno" value={formData.apellido_materno} onChange={handleNameChange} className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all ${localErrors.apellido_materno ? 'border-red-200 bg-red-50' : 'border-gray-100'}`} placeholder="Materno..." />
                    {localErrors.apellido_materno && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.apellido_materno}</p>}
                </div>

                <div className="space-y-1 col-span-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Área que Solicita *</label>{!isOtherUnidad ? <select required value={formData.unidad_solicitante} onChange={handleUnidadChange} className={`w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm appearance-none cursor-pointer uppercase ${localErrors.unidad_solicitante ? 'border-red-200 bg-red-50' : ''}`}><option value="">Seleccione Unidad...</option>{unidades.map(u => <option key={u.id} value={capitalizeWords(u.nombre)}>{u.nombre}</option>)}<option value="OTHER" className="text-[#7A152E] font-black">EXTERNO / ÁREA NO LISTADA</option></select> : <div className="relative"><input required name="unidad_solicitante" value={formData.unidad_solicitante} onChange={handleNameChange} className="w-full pl-5 pr-12 py-3.5 bg-white border-2 border-[#7A152E]/30 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm uppercase" placeholder="Escriba la unidad..." /><button type="button" onClick={() => setIsOtherUnidad(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"><ArrowLeft size={16} /></button></div>}{localErrors.unidad_solicitante && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.unidad_solicitante}</p>}</div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Cargo *</label>
                    <input required name="cargo_solicitante" value={formData.cargo_solicitante} onChange={handleNameChange} className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all ${localErrors.cargo_solicitante ? 'border-red-200 bg-red-50' : 'border-gray-100'}`} placeholder="Ej. Jefe de Área" />
                    {localErrors.cargo_solicitante && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.cargo_solicitante}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono (10 Dígitos) *</label>
                    <input required name="telefono" value={formData.telefono} onChange={handleNumberInput} className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all ${localErrors.telefono ? 'border-red-200 bg-red-50' : 'border-gray-100'}`} placeholder="7221234567" />
                    {localErrors.telefono && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.telefono}</p>}
                </div>

                <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Extensión</label><input name="extension" value={formData.extension} onChange={handleNumberInput} className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm" placeholder="Ext..." /></div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Vencimiento *</label>
                    <input 
                      required 
                      type="date" 
                      name="fecha_vencimiento" 
                      value={formData.fecha_vencimiento} 
                      onChange={handleInputChange} 
                      className={`w-full px-5 py-3.5 bg-gray-50 border-2 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all ${localErrors.fecha_vencimiento ? 'border-red-200 bg-red-50' : 'border-gray-100'}`} 
                    />
                    {localErrors.fecha_vencimiento && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{localErrors.fecha_vencimiento}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado Físico a la Salida *</label>
                    <select required name="estado_salida" value={formData.estado_salida} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm appearance-none cursor-pointer">
                        <option value="bueno">Bueno</option>
                        <option value="completo">Completo</option>
                        <option value="incompleto">Incompleto</option>
                        <option value="regular">Regular</option>
                        <option value="malo">Malo</option>
                    </select>
                </div>
                <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Observaciones</label><textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm transition-all min-h-[80px] resize-none" placeholder="Notas adicionales..." /></div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all active:scale-95 border-2 border-transparent hover:border-gray-100">Cancelar</button>
              <button type="submit" disabled={loading} className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-xl active:scale-95 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}Generar Vale</button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default PrestamoForm;
