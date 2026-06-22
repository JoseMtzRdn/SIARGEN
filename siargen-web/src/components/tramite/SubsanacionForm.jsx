import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { 
  X, 
  Loader2, 
  Search, 
  Trash2, 
  PlusCircle, 
  FileText, 
  AlertCircle,
  ClipboardList,
  Eye,
  Info,
  Archive
} from 'lucide-react';
import { updateSubsanacion } from '../../store/transferenciaSlice';
import { fetchExpedientes } from '../../store/expedienteSlice';
import ModalPortal from '../ModalPortal';
import ExpedienteView from './ExpedienteView';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

// constantes de estado alineadas con el backend
const STATE_CERRADO = 2;
const STATE_SUBSANACION = 3;

const SubsanacionForm = ({ isOpen, onClose, onSuccess, record }) => {
    const dispatch = useDispatch();
    
    const [isSaving, setIsSaving] = useState(false);
    const [loadingExpedientes, setLoadingExpedientes] = useState(false);
    
    // Lista de expedientes incluidos en la transferencia en revisión.
    const [currentExpedientes, setCurrentExpedientes] = useState([]);
    
    // Lista de expedientes elegibles y disponibles para agregar.
    const [availableExpedientes, setAvailableExpedientes] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [observaciones, setObservaciones] = useState('');

    const [selectedExpedienteView, setSelectedExpedienteView] = useState(null);
    const [isExpViewOpen, setIsExpViewOpen] = useState(false);

    // Preserva el estado inicial del registro.
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isOpen && record) {
            // Carga inicial al abrir el modal.
            if (!isInitialized.current) {
                const initialExpedientes = record.expedientes || [];
                setCurrentExpedientes([...initialExpedientes]);
                
                setObservaciones(''); 
                setSearchTerm('');
                fetchAvailableExpedientes();
                isInitialized.current = true;
            } else {
                // Sincroniza la lista ante cambios en el registro.
                setCurrentExpedientes([...(record.expedientes || [])]);
            }
        } else if (!isOpen) {
            // resetear cuando se cierra
            isInitialized.current = false;
        }
    }, [isOpen, record]);

    const fetchAvailableExpedientes = async () => {
        setLoadingExpedientes(true);
        try {
            const response = await api.get('/expedientes', { 
                params: { 
                    fase: 'tramite', 
                    estatus_disponibilidad: 'disponible',
                    'estado_archivo[]': ['cerrado'], 
                    per_page: -1,
                    exclude_subsanacion: true
                } 
            });
            setAvailableExpedientes(response.data.data);
        } catch (error) {
            console.error('Error al cargar expedientes:', error);
        } finally {
            setLoadingExpedientes(false);
        }
    };

    const handleRemove = async (id) => {
        const idNum = Number(id);
        const expToRemove = currentExpedientes.find(e => Number(e.id) === idNum);
        
        if (expToRemove) {
            const result = await Swal.fire({
                title: '<span class="text-orange-600 uppercase font-black tracking-tighter">¿Retirar Expediente?</span>',
                text: "Si quita este expediente de la transferencia en subsanación, ya no podrá editar sus metadatos aunque lo agregue nuevamente en esta sesión.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#7A152E',
                cancelButtonColor: '#cbd5e1',
                confirmButtonText: 'Sí, retirar',
                cancelButtonText: 'No, mantener',
                customClass: {
                    popup: 'rounded-[2.5rem] shadow-2xl border-none',
                    title: 'text-xl py-6',
                }
            });

            if (!result.isConfirmed) return;

            // proceder con la eliminación local
            setCurrentExpedientes(prev => prev.filter(e => Number(e.id) !== idNum));
            
            setAvailableExpedientes(prev => {
                if (prev.some(e => Number(e.id) === idNum)) return [...prev];
                // al quitarlo, vuelve a estado cerrado/disponible para el buscador
                const cleanedExp = { 
                    ...expToRemove, 
                    estado_archivo: STATE_CERRADO, 
                    is_in_subsanacion: false 
                };
                return [cleanedExp, ...prev];
            });
        }
    };

    const handleAdd = (id) => {
        const idNum = Number(id);
        const expToAdd = availableExpedientes.find(e => Number(e.id) === idNum);
        if (expToAdd) {
            const finalizedExp = {
                ...expToAdd,
                estado_archivo: STATE_SUBSANACION,
                is_in_subsanacion: true
            };

            setCurrentExpedientes(prev => [...prev, finalizedExp]);
            setAvailableExpedientes(prev => prev.filter(e => Number(e.id) !== idNum));
        }
    };

    const handleQuickView = async (id) => {
        const idNum = Number(id);
        try {
            const response = await api.get(`/expedientes/${idNum}`);
            const serverData = response.data.data;
            
            // Determina privilegios de edición según estado local.
            const localExp = currentExpedientes.find(e => Number(e.id) === idNum);
            
            if (localExp) {
                setSelectedExpedienteView({
                    ...serverData,
                    estado_archivo: localExp.estado_archivo,
                    is_in_subsanacion: localExp.is_in_subsanacion
                });
            } else {
                setSelectedExpedienteView(serverData);
            }
            
            setIsExpViewOpen(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
        }
    };

    const handleSave = async () => {
        if (currentExpedientes.length === 0) {
            return Swal.fire('Error', 'La transferencia debe contener al menos un expediente', 'error');
        }

        if (!observaciones || observaciones.trim().length < 10) {
            return Swal.fire({
                icon: 'warning',
                title: '<span class="text-orange-600 uppercase font-black tracking-tighter">Justificación Requerida</span>',
                text: 'Por favor, detalle los cambios realizados (mínimo 10 caracteres) antes de guardar.',
                confirmButtonColor: '#7A152E'
            });
        }

        setIsSaving(true);
        try {
            const expediente_ids = currentExpedientes.map(e => Number(e.id));

            await dispatch(updateSubsanacion({
                id: record.id,
                data: {
                    expediente_ids,
                    observaciones
                }
            })).unwrap();
            
            // refrescar datos
            dispatch(fetchExpedientes({ per_page: -1, fase: 'tramite' }));

            Swal.fire({
                icon: 'success',
                title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡CAMBIOS GUARDADOS!</span>',
                text: 'La transferencia se ha actualizado físicamente en el sistema.',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[3rem] shadow-2xl' }
            });
            
            onSuccess(); 
        } catch (error) {
            console.error("Subsanacion Save Error:", error);
            const errorMsg = typeof error === 'string' ? error : (error.first_error || error.message || 'Error de validación de datos');
            Swal.fire({
                icon: 'error',
                title: 'No se pudieron guardar los cambios',
                text: errorMsg,
                confirmButtonColor: '#7A152E'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredAvailable = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        const currentIds = new Set(currentExpedientes.map(e => Number(e.id)));

        return availableExpedientes.filter(exp => {
            if (currentIds.has(Number(exp.id))) return false;
            const matchesSearch = !searchTerm || 
                exp.numero_expediente?.toLowerCase().includes(searchLower) ||
                exp.titulo?.toLowerCase().includes(searchLower);
            return matchesSearch;
        });
    }, [availableExpedientes, currentExpedientes, searchTerm]);

    if (!isOpen || !record) return null;

    return (
        <ModalPortal>
            <div className="overlay-blur-full flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] z-[10000]"
                >
                    {/* { header } */}
                    <div className="bg-gradient-to-r from-orange-600 to-amber-700 px-10 py-6 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-5 text-white">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight leading-none">Subsanación de Transferencia</h3>
                                <p className="text-orange-200 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">Folio: {record.numero_transferencia}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 min-h-0">
                        <div className="px-10 py-3 bg-red-50 border-b border-red-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-red-500 rounded-lg text-white">
                                    <X size={12} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest block">Motivo del Rechazo:</span>
                                    <p className="text-[11px] font-bold text-red-900 italic truncate">"{record.motivo_rechazo || 'No se especificó motivo'}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-0">
                            {/* { panel izquierdo } */}
                            <div className="flex flex-col border-r border-slate-100 p-6 space-y-4 min-h-0">
                                <div className="flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <ClipboardList size={16} className="text-orange-600" />
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">En Transferencia</h4>
                                    </div>
                                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[8px] font-black border border-orange-100">
                                        {currentExpedientes.length} REGISTROS
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 bg-slate-100/30 rounded-xl p-3 border border-slate-200/50">
                                    <AnimatePresence>
                                        {currentExpedientes.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-200 rounded-2xl opacity-60">
                                                <AlertCircle size={30} />
                                                <p className="text-[8px] font-black uppercase">Lista vacía</p>
                                            </div>
                                        ) : (
                                            currentExpedientes.map(exp => (
                                                <motion.div 
                                                    key={exp.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all shrink-0"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-black text-slate-800 uppercase truncate">{exp.titulo}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[8px] font-bold text-orange-600 tracking-tight">{exp.numero_expediente}</p>
                                                                {exp.estado_archivo === 'subsanacion' || Number(exp.estado_archivo) === STATE_SUBSANACION ? (
                                                                    <span className="text-[6px] bg-red-50 text-red-500 px-1 py-0.5 rounded font-black uppercase">Editable</span>
                                                                ) : (
                                                                    <span className="text-[6px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded font-black uppercase">Protegido</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => handleQuickView(exp.id)} className="p-1.5 text-slate-300 hover:text-orange-600 rounded-lg transition-all">
                                                            <Eye size={14} />
                                                        </button>
                                                        <button type="button" onClick={() => handleRemove(exp.id)} className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* { panel derecho } */}
                            <div className="flex flex-col p-6 space-y-4 bg-slate-50/80 min-h-0">
                                <div className="space-y-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <PlusCircle size={16} className="text-emerald-600" />
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Agregar otros</h4>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input 
                                            type="text"
                                            placeholder="Buscar vencidos..."
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-bold outline-none focus:border-emerald-200 uppercase"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 bg-slate-100/30 rounded-xl p-3 border border-slate-200/50">
                                    {loadingExpedientes ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span className="text-[8px] font-black uppercase">Buscando...</span>
                                        </div>
                                    ) : (
                                        filteredAvailable.map(exp => (
                                            <div 
                                                key={exp.id}
                                                className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-all shrink-0"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black text-slate-800 uppercase truncate">{exp.titulo}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 tracking-tight">{exp.numero_expediente}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleAdd(exp.id)}
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <PlusCircle size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* { footer con observaciones destacadas } */}
                        <div className="p-6 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <div className="flex flex-col lg:flex-row gap-6 items-end">
                                <div className="flex-1 w-full space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 text-orange-600">
                                            <div className="p-1.5 bg-orange-50 rounded-lg">
                                                <Info size={14} />
                                            </div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em]">Justificación de las Correcciones <span className="text-red-500">*</span></label>
                                        </div>
                                        <span className="text-[7px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-widest">Campo Obligatorio</span>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-200 to-amber-200 rounded-[1.5rem] blur opacity-20 group-focus-within:opacity-40 transition-all duration-300"></div>
                                        <textarea 
                                            className="relative w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-orange-500/30 outline-none transition-all font-bold text-slate-700 text-xs shadow-inner min-h-[90px] max-h-[120px] resize-none placeholder:text-slate-300 placeholder:font-medium"
                                            placeholder="Describa detalladamente los cambios realizados para que el titular pueda validar la corrección..."
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 shrink-0 pb-1">
                                    <button 
                                        type="button" 
                                        onClick={onClose} 
                                        className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        Cerrar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving || loadingExpedientes || currentExpedientes.length === 0}
                                        className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-lg hover:shadow-[#7A152E]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Archive size={16} />}
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <ExpedienteView 
                isOpen={isExpViewOpen}
                onClose={() => setIsExpViewOpen(false)}
                record={selectedExpedienteView}
                forceSubsanacionMode={selectedExpedienteView && (selectedExpedienteView.estado_archivo === 'subsanacion' || Number(selectedExpedienteView.estado_archivo) === STATE_SUBSANACION)}
            />
        </ModalPortal>
    );
};

export default SubsanacionForm;
