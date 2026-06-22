import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Loader2, Send, Search, CheckSquare, Square, Eye, ClipboardList } from 'lucide-react';
import { createTransferencia } from '../../store/transferenciaSlice';
import ModalPortal from '../ModalPortal';
import ExpedienteView from './ExpedienteView';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const TransferenciaForm = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { vencidos } = useSelector((state) => state.transferencias);
    
    const [loading, setLoading] = useState(false);
    const [loadingExpedientes, setLoadingExpedientes] = useState(false);
    const [expedientes, setExpedientes] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [observaciones, setObservaciones] = useState('');

    const [selectedExpedienteView, setSelectedExpedienteView] = useState(null);
    const [isExpViewOpen, setIsExpViewOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableExpedientes();
            setSelectedIds([]);
            setObservaciones('');
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchAvailableExpedientes = async () => {
        setLoadingExpedientes(true);
        try {
            const response = await api.get('/expedientes', { 
                params: { 
                    fase: 'tramite', 
                    estatus_disponibilidad: 'disponible',
                    estado_archivo: 'cerrado', 
                    per_page: -1,
                    exclude_subsanacion: true
                } 
            });
            setExpedientes(response.data.data);
        } catch (error) {
            console.error('Error al cargar expedientes:', error);
        } finally {
            setLoadingExpedientes(false);
        }
    };

    const handleQuickView = async (id) => {
        try {
            const response = await api.get(`/expedientes/${id}`);
            setSelectedExpedienteView(response.data.data);
            setIsExpViewOpen(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            return Swal.fire('Error', 'Debes seleccionar al menos un expediente', 'error');
        }

        setLoading(true);
        try {
            await dispatch(createTransferencia({
                tipo: 'primaria',
                expediente_ids: selectedIds,
                observaciones
            })).unwrap();
            
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire('Error', typeof error === 'string' ? error : 'No se pudo crear la transferencia', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredExpedientes = (expedientes || []).filter(exp => {
        const esApto = vencidos.some(v => v.id === exp.id);
        const estaDisponible = exp.estatus_disponibilidad !== 'prestado';
        
        const noEstaProtegido = !exp.is_in_subsanacion;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            exp.numero_expediente?.toLowerCase().includes(searchLower) ||
            exp.titulo?.toLowerCase().includes(searchLower);

        return esApto && estaDisponible && noEstaProtegido && matchesSearch;
    });

    return (
        <ModalPortal>
            <div className="overlay-blur-full flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] z-[10000]">
                    
                    {/* { header refactorizado } */}
                    <div className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] px-10 py-8 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-inner">
                                <ClipboardList size={28} />
                            </div>
                            <div>
                                <h3 className="text-white text-2xl font-black uppercase tracking-tight">Nueva Transferencia Primaria</h3>
                                <p className="text-[#BC955B] text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Integración de acervo al archivo de concentración</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                            
                            {/* { sección de observaciones compactada } */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 ml-1 text-[#7A152E]">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest">Observaciones del Envío</h4>
                                </div>
                                <textarea 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 text-[11px] shadow-inner min-h-[70px] max-h-[80px] resize-none"
                                    placeholder="Indique detalles relevantes del acervo (ej: Número de cajas)..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                />
                            </div>

                            {/* { selección de expedientes (espacio expandido) } */}
                            <div className="space-y-4 pt-2">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-800 uppercase tracking-tight block">
                                            Listado de Expedientes con Plazo Cumplido
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <input 
                                                type="text"
                                                placeholder="Búsqueda rápida..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:border-[#7A152E]/20 uppercase shadow-sm"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="px-4 py-2.5 bg-[#7A152E]/5 rounded-xl border border-[#7A152E]/10">
                                            <span className="text-[10px] font-black text-[#7A152E] whitespace-nowrap">{selectedIds.length} SELECCIONADOS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden max-h-[420px] overflow-y-auto bg-gray-50/50 shadow-inner">
                                    {loadingExpedientes ? (
                                        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-4">
                                            <Loader2 className="animate-spin" size={40} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando acervo apto...</span>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                                                <tr>
                                                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest w-16 text-center">Sel.</th>
                                                    <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest w-40">Folio</th>
                                                    <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Título del Expediente</th>
                                                    <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-20">Audit.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredExpedientes.map(exp => (
                                                    <tr 
                                                        key={exp.id} 
                                                        className={`hover:bg-white transition-colors group ${selectedIds.includes(exp.id) ? 'bg-[#7A152E]/5' : ''}`}
                                                    >
                                                        <td className="px-8 py-5 text-center" onClick={() => toggleSelection(exp.id)}>
                                                            <div className="flex justify-center cursor-pointer">
                                                                {selectedIds.includes(exp.id) ? (
                                                                    <div className="w-6 h-6 bg-[#7A152E] rounded-lg flex items-center justify-center text-white shadow-md shadow-[#7A152E]/20">
                                                                        <CheckSquare size={16} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded-lg group-hover:border-[#7A152E]/30 transition-colors" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="text-[10px] font-black text-[#7A152E] tracking-tight">{exp.numero_expediente}</span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <p className="text-[10px] font-bold text-slate-700 uppercase truncate max-w-[300px] leading-tight">{exp.titulo}</p>
                                                            <p className="text-[8px] font-medium text-gray-400 uppercase mt-0.5">{exp.serie?.nombre}</p>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleQuickView(exp.id); }}
                                                                className="p-2.5 bg-white text-slate-400 rounded-xl border border-gray-100 hover:text-[#7A152E] hover:shadow-lg transition-all active:scale-90"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredExpedientes.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="py-20">
                                                            <div className="flex flex-col items-center justify-center gap-3 w-full text-center">
                                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                                                    <ClipboardList size={24} />
                                                                </div>
                                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin expedientes listos para transferencia</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* { footer compactado } */}
                        <div className="px-10 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter max-w-[250px] leading-tight">
                                * Se enviará notificación al Titular (TUA) para firma electrónica.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Descartar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading || selectedIds.length === 0}
                                    className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#7A152E]/20 hover:shadow-[#7A152E]/40 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                    Firmar y Enviar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <ExpedienteView 
                isOpen={isExpViewOpen}
                onClose={() => setIsExpViewOpen(false)}
                record={selectedExpedienteView}
            />
        </ModalPortal>
    );
};

export default TransferenciaForm;
