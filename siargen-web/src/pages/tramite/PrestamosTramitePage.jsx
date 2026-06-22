import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  X,
  ArrowUpRight,
  User,
  Calendar,
  MoreVertical,
  RotateCcw,
  Building,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPrestamos, devolverPrestamo } from '../../store/prestamoSlice';
import { fetchExpedientes } from '../../store/expedienteSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import PrestamoForm from '../../components/concentracion/PrestamoForm';
import PrestamoLoteView from '../../components/concentracion/PrestamoLoteView';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const PrestamosTramitePage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.prestamos);
  const { items: expedientes, lastFetch: lastFetchExp } = useSelector((state) => state.expedientes);
  const { user } = useSelector((state) => state.auth);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [selectedUnidad, setSelectedUnidad] = useState('');

  const userRole = user?.role?.slug || '';
  const isCoordinator = userRole === 'coord_archivos' || userRole === 'tua';
  const isRat = userRole === 'rat';
  const isTua = userRole === 'tua';

  const fetchRecords = useCallback((force = false) => {
    // si es tua o coordinador, asegurar que cargue la fase de trámite al entrar
    const faseToFetch = 'tramite';
    const params = { per_page: -1, fase: faseToFetch };
    if (isCoordinator && selectedUnidad) {
      params.unidad_administrativa_id = selectedUnidad;
    }
    
    // forzamos la recarga ignorando el caché de redux
    dispatch(fetchPrestamos({ ...params, force }));
    dispatch(fetchExpedientes({ per_page: -1, fase: faseToFetch }));
  }, [dispatch, isCoordinator, selectedUnidad]);

  useEffect(() => {
    fetchRecords();
    if (isCoordinator) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [isCoordinator, dispatch]); // quitamos fetchrecords de aquí para evitar bucles, solo al montar

  // Actualiza préstamos al cambiar la unidad.
  useEffect(() => {
    if (isCoordinator) {
      fetchRecords(true);
    }
  }, [selectedUnidad, isCoordinator, fetchRecords]);
const filteredRecords = useMemo(() => {
  const list = Array.isArray(items) ? items : [];
  return list.filter(p => {
    const isTramite = p.fase === 'tramite' || Number(p.fase) === 1;
    if (!isTramite) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      p.folio_prestamo?.toLowerCase().includes(searchLower) ||
      p.nombre_completo?.toLowerCase().includes(searchLower) ||
      p.detalles?.some(d => d.expediente?.numero_expediente?.toLowerCase().includes(searchLower));
    const matchesStatus = filterStatus === 'todos' || p.estatus === filterStatus;
    return matchesSearch && matchesStatus;
  });
}, [items, searchTerm, filterStatus]);

  const handleDevolucion = async (detalleId, estadoSalida = 'bueno') => {
    // definir jerarquía de estados (3: mejor, 0: peor)
    const states = [
      { id: 'bueno', label: 'Bueno', rank: 3 },
      { id: 'completo', label: 'Completo', rank: 3 },
      { id: 'regular', label: 'Regular', rank: 2 },
      { id: 'incompleto', label: 'Incompleto', rank: 1 },
      { id: 'malo', label: 'Malo', rank: 0 }
    ];

    const currentRank = states.find(s => s.id === (estadoSalida || 'bueno').toLowerCase())?.rank ?? 3;
    const availableOptions = states.filter(s => s.rank <= currentRank);

    const optionsHtml = availableOptions.map(opt => 
      `<option value="${opt.id}" ${opt.id === estadoSalida ? 'selected' : ''}>${opt.label}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      icon: 'question',
      title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase text-xl">Registrar Devolución</span>',
      html: `
        <div class="space-y-6 text-left p-2">
          <div class="flex items-center justify-between px-2">
              <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado registrado al salir:</span>
              <span class="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-tight">${estadoSalida}</span>
          </div>

          <div class="space-y-3">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Físico Actual (Al Recibir) *</label>
            <div class="relative group">
              <select id="estado_devolucion" class="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#7A152E] outline-none font-black text-sm text-[#7A152E] cursor-pointer appearance-none transition-all group-hover:bg-white shadow-sm">
                ${optionsHtml}
              </select>
              <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <RotateCcw size={16} />
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observaciones de Entrega</label>
            <textarea id="observaciones" class="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#7A152E] outline-none font-bold text-sm min-h-[120px] resize-none text-gray-700 transition-all hover:bg-white shadow-sm" placeholder="Detalle cualquier novedad, daño o faltante..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Confirmar Entrega',
      cancelButtonText: 'Cancelar',
      iconColor: '#7A152E',
      background: '#ffffff',
      customClass: { 
        container: 'z-[12000]',
        popup: 'rounded-[3rem] shadow-2xl border-none',
        title: 'text-2xl py-6'
      },
      preConfirm: () => {
        return {
          estado_devolucion: document.getElementById('estado_devolucion').value,
          observaciones: document.getElementById('observaciones').value
        };
      }
    });

    if (formValues) {
      try {
        const result = await dispatch(devolverPrestamo({ 
            id: detalleId, 
            estado_devolucion: formValues.estado_devolucion, 
            observaciones: formValues.observaciones 
        })).unwrap();
        
        // actualización en tiempo real: usar el resultado directo de la api
        if (result) {
            setSelectedPrestamo(result);
            // Actualiza el acervo de trámite tras registrar la devolución.
            dispatch(fetchExpedientes({ per_page: -1, fase: 'tramite' }));
        }
        
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡RECIBIDO!</span>',
          text: 'El expediente ha sido marcado como devuelto y liberado.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            container: 'z-[13000]',
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
      } catch (error) {
        Swal.fire({
            icon: 'error',
            title: '<span class="font-black tracking-tighter text-red-600 uppercase">Error</span>',
            text: error || 'No se pudo procesar la devolución',
            confirmButtonColor: '#7A152E',
            customClass: {
                container: 'z-[13000]',
                popup: 'rounded-[2rem]'
            }
        });
      }
    }
  };

  const handleViewLote = (p) => {
    setSelectedPrestamo(p);
    setIsLoteModalOpen(true);
  };

  const handleImprimir = async (id, folio) => {
    try {
        Swal.fire({
            title: 'Generando Documento...',
            html: 'Por favor espere mientras se crea el PDF oficial.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: { container: 'z-[99999]' }
        });

        const response = await api.get(`/prestamos/${id}/imprimir`, { responseType: 'blob' });
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Vale_Prestamo_${folio}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡VALE GENERADO!</span>',
          text: 'El documento oficial ha sido generado y descargado correctamente.',
          iconColor: '#7A152E',
          timer: 3000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: { 
              container: 'z-[100000]',
              popup: 'rounded-[3rem] shadow-2xl border-none',
              title: 'text-2xl py-10',
          }
        });
    } catch (error) {
        console.error("Error printing:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Generación',
            text: 'No se pudo generar el documento PDF del vale. Verifique la plantilla del Anexo 6 en el servidor.',
            confirmButtonColor: '#7A152E',
            customClass: { container: 'z-[99999]', popup: 'rounded-[2rem]' }
        });
    }
  };

  const getStatusBadge = (status, vencido) => {
    if (vencido && status === 'prestado') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-200">
          <Clock size={12} /> Vencido
        </span>
      );
    }
    switch (status) {
      case 'prestado':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-200">
            <ArrowUpRight size={12} /> En Préstamo
          </span>
        );
      case 'devuelto':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-200">
            <CheckCircle2 size={12} /> Devuelto
          </span>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-10 p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#7A152E] tracking-tighter uppercase leading-none">Gestión de Préstamos<br/>Archivo de Trámite</h2>
        </div>
        {!isCoordinator && (
          <button 
            onClick={() => { setSelectedExpediente(null); setIsModalOpen(true); }}
            className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all active:scale-95"
          >
            <Plus size={18} /> Nuevo Préstamo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-4 bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col xl:flex-row gap-4">
           {/* { buscador } */}
           <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por folio, solicitante o expediente..." 
                className="w-full pl-16 pr-8 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-[#7A152E]/20 transition-all font-bold text-gray-700 shadow-inner uppercase" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
           </div>

           {/* { selector de unidades (solo para coordinador) } */}
           {userRole === 'coord_archivos' && (
             <div className="relative group min-w-[320px]">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                 <Building size={20} />
               </div>
               <select 
                 value={selectedUnidad}
                 onChange={(e) => setSelectedUnidad(e.target.value)}
                 className="w-full pl-16 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-[#7A152E]/20 transition-all font-black text-[10px] text-gray-700 shadow-inner appearance-none cursor-pointer uppercase tracking-tighter"
               >
                 <option value="">TODAS LAS UNIDADES</option>
                 {unidades.map(u => (
                   <option key={u.id} value={u.id}>{u.nombre}</option>
                 ))}
               </select>
               <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={18} />
               </div>
             </div>
           )}
           
           {/* { botones de filtro } */}
           <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-inner shrink-0 overflow-x-auto custom-scrollbar">
             {['todos', 'prestado', 'devuelto'].map(s => (
               <button 
                 key={s} 
                 onClick={() => setFilterStatus(s)} 
                 className={`px-6 py-2.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                   filterStatus === s 
                    ? 'bg-white text-[#7A152E] shadow-sm border border-gray-200' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                 }`}
               >
                 {s === 'todos' ? 'Ver Todos' : s === 'prestado' ? 'Pendientes' : 'Devueltos'}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
             <div className="flex flex-col items-center gap-4 text-[#7A152E]">
                <Loader2 className="animate-spin" size={48} />
                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Consultando Registros...</span>
             </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[20%]">Folio de Vale</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[30%]">Solicitante / Contacto</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-[20%]">Expedientes Vinculados</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-[20%]">Estatus</th>
                {!isCoordinator && (
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-[10%]">Impresión</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((p) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-8 py-6 align-top">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-[#7A152E] tracking-tight">{p.folio_prestamo}</span>
                           <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Generado: {p.fecha_prestamo}</span>
                           <span className="text-[10px] font-black text-amber-600 uppercase mt-1">Vence: {p.fecha_vencimiento}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-white transition-all shadow-inner"><User size={18} /></div>
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-800 tracking-tight">{p.nombre_completo}</span>
                              <span className="text-[10px] font-bold text-[#7A152E] uppercase tracking-tighter">{p.unidad_solicitante || 'Sin Unidad'}</span>
                              {p.telefono && <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">Tel: {p.telefono} {p.extension ? `Ext: ${p.extension}` : ''}</span>}
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center align-top">
                        <button onClick={() => handleViewLote(p)} className="inline-flex flex-col items-center gap-2 px-6 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-[#7A152E]/20 hover:bg-white transition-all group/btn">
                            <span className="text-lg font-black text-[#7A152E] leading-none">{p.detalles?.length || 0}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest group-hover/btn:text-[#7A152E]">Expedientes</span>
                        </button>
                      </td>
                      <td className="px-8 py-6 text-center align-top">
                        <div className="flex justify-center">{getStatusBadge(p.estatus, p.vencido)}</div>
                      </td>
                      {!isCoordinator && (
                        <td className="px-8 py-6 text-right align-top">
                           <button onClick={() => handleImprimir(p.id, p.folio_prestamo)} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#7A152E] hover:border-red-100 hover:shadow-xl transition-all active:scale-90 shadow-sm"><FileText size={18} /></button>
                        </td>
                      )}
                    </motion.tr>
                  ))
                ) : (
                  <tr><td colSpan={isCoordinator ? "4" : "5"} className="px-8 py-20 text-center"><div className="flex flex-col items-center gap-4"><History className="text-gray-200" size={64} /><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No se encontraron registros de préstamos</p></div></td></tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <PrestamoForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchRecords(true)} fase="tramite" />
      <PrestamoLoteView 
        isOpen={isLoteModalOpen} 
        onClose={() => setIsLoteModalOpen(false)} 
        prestamo={selectedPrestamo} 
        onDevolucion={handleDevolucion} 
        isCoordinator={isCoordinator}
      />
    </div>
  );
};

export default PrestamosTramitePage;
