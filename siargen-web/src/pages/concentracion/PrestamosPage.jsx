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

const PrestamosPage = () => {
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
  const isRac = userRole === 'rac';
  const canFilterUnit = userRole === 'coord_archivos' || isRac;

  const fetchRecords = useCallback((force = false) => {
    // si es tua o coordinador, asegurar que cargue la fase de concentración al entrar
    const faseToFetch = 'concentracion';
    const params = { per_page: -1, fase: faseToFetch };

    // si es coordinador o rac y tiene unidad seleccionada, filtrar
    if (canFilterUnit && selectedUnidad) {
        params.unidad_administrativa_id = selectedUnidad;
    }

    dispatch(fetchPrestamos({ ...params, force }));
    dispatch(fetchExpedientes({ per_page: -1, fase: faseToFetch }));
  }, [dispatch, canFilterUnit, selectedUnidad]);

  useEffect(() => {
    fetchRecords();
    if (canFilterUnit) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [canFilterUnit, dispatch]); // quitamos fetchrecords de aquí para evitar bucles

  // Actualiza préstamos al cambiar la unidad.
  useEffect(() => {
    if (canFilterUnit) {
      fetchRecords(true);
    }
  }, [selectedUnidad, canFilterUnit, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter(p => {
      const isConcentracion = p.fase === 'concentracion' || Number(p.fase) === 2;
      if (!isConcentracion) return false;

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
            // Actualiza el acervo en custodia tras registrar la devolución.
            dispatch(fetchExpedientes({ per_page: -1, fase: 'concentracion' }));
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
    const baseClasses = "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border transition-all whitespace-nowrap shadow-sm";

    if (vencido && status === 'prestado') {
      return (
        <span className={`${baseClasses} bg-red-50 text-red-600 border-red-100 animate-pulse`}>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          <Clock size={13} className="shrink-0" /> Vencido
        </span>
      );
    }
    switch (status) {
      case 'prestado':
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-600 border-blue-100`}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <ArrowUpRight size={13} className="shrink-0" /> En Préstamo
          </span>
        );
      case 'devuelto':
        return (
          <span className={`${baseClasses} bg-emerald-50 text-emerald-600 border-emerald-100`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <CheckCircle2 size={13} className="shrink-0" /> Devuelto
          </span>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-10 p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#7A152E] tracking-tighter uppercase leading-none">Gestión de Préstamos<br/>Control de Vale de Préstamo</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* { métrica compacta } */}
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 flex-1 md:flex-none justify-center md:justify-start">
             <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                <Clock size={16} />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Vales Activos</span>
                <span className="text-lg font-black text-[#7A152E] leading-none mt-1">
                   {items.filter(p => p.estatus === 'prestado' && (p.fase === 'concentracion' || Number(p.fase) === 2)).length}
                </span>
             </div>
          </div>

          {!isCoordinator && (
            <button 
              onClick={() => { setSelectedExpediente(null); setIsModalOpen(true); }}
              className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all active:scale-95 flex-1 md:flex-none justify-center"
            >
              <Plus size={18} /> Nuevo Préstamo
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-6 items-center">
           {/* { buscador } */}
           <div className="relative flex-1 w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Buscar por folio, solicitante o expediente..." 
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-[#7A152E]/20 transition-all font-bold text-gray-700 shadow-inner uppercase" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
           </div>

           <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto items-center">
             {/* { selector de unidades (solo para coordinador o rac) } */}
             {canFilterUnit && (
               <div className="relative group flex-1 lg:flex-none min-w-[200px] lg:min-w-[280px]">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                   <Building size={18} />
                 </div>
                 <select 
                   value={selectedUnidad}
                   onChange={(e) => setSelectedUnidad(e.target.value)}
                   className="w-full pl-14 pr-10 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-[#7A152E]/20 transition-all font-black text-[10px] text-gray-700 shadow-inner appearance-none cursor-pointer uppercase tracking-tighter"
                 >
                   <option value="">TODAS LAS UNIDADES</option>
                   {unidades.map(u => (
                     <option key={u.id} value={u.id}>{u.nombre}</option>
                   ))}
                 </select>
                 <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                 </div>
               </div>
             )}
             
             {/* { botones de filtro } */}
             <div className="flex bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100 shadow-inner shrink-0 overflow-x-auto custom-scrollbar w-full lg:w-auto justify-start">
               {['todos', 'prestado', 'devuelto'].map(s => (
                 <button 
                   key={s} 
                   onClick={() => setFilterStatus(s)} 
                   className={`flex-1 lg:flex-none px-6 py-3.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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

      <PrestamoForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchRecords(true)} />
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

export default PrestamosPage;
