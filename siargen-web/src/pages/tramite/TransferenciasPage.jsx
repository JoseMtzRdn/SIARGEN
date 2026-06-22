import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  Archive, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Truck, 
  ArrowRightLeft, 
  LayoutGrid, 
  Filter, 
  X, 
  UserCheck, 
  Send, 
  Building, 
  ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTransferencias, enviarATua, enviarARac, checkVigencias, resubmitTransfer } from '../../store/transferenciaSlice';
import { fetchExpedientes } from '../../store/expedienteSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import TransferenciaForm from '../../components/tramite/TransferenciaForm';
import TransferenciaView from '../../components/tramite/TransferenciaView';
import SubsanacionForm from '../../components/tramite/SubsanacionForm';
import api from '../../api/axios';
import { alerts } from '../../utils/alerts';
import Swal from 'sweetalert2';

const TransferenciasPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.transferencias);
  const { user } = useSelector((state) => state.auth);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubsanacionOpen, setIsSubsanacionOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState('');

  // Sincroniza el registro seleccionado con el estado global de Redux.
  useEffect(() => {
    if (selectedRecord && items.length > 0) {
      const updated = items.find(i => i.id === selectedRecord.id);
      if (updated) setSelectedRecord(updated);
    }
  }, [items, selectedRecord]);

  const isCoordinator = user?.role?.slug === 'coord_archivos' || user?.role?.slug === 'tua';

  const fetchRecords = useCallback((force = false) => {
    const params = { per_page: -1 };
    if (isCoordinator && selectedUnidad) {
      params.unidad_administrativa_id = selectedUnidad;
    }
    dispatch(fetchTransferencias(params));
  }, [dispatch, isCoordinator, selectedUnidad]);

  useEffect(() => {
    fetchRecords();
    if (isCoordinator) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [fetchRecords, isCoordinator, dispatch]);

  // Actualiza transferencias al cambiar la unidad.
  useEffect(() => {
    if (isCoordinator && selectedUnidad) {
      fetchRecords(true);
    }
  }, [selectedUnidad, isCoordinator, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter(t => {
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm || 
        t.numero_transferencia?.toLowerCase().includes(searchLower) ||
        t.estatus?.toLowerCase().includes(searchLower) ||
        t.unidad_origen?.nombre?.toLowerCase().includes(searchLower);
    });
  }, [items, searchTerm]);

  const handleView = async (id) => {
    try {
        const response = await api.get(`/transferencias/${id}/detail`);
        setSelectedRecord(response.data.data);
        setIsViewOpen(true);
    } catch (error) {
        console.error('Detalle Error:', error);
        const msg = error.response?.data?.message || error.message || 'Error desconocido';
        alerts.error(msg);
    }
  };

  const handleEnviarATua = async (id) => {
    const result = await alerts.confirm(
      'El Titular de tu Unidad (TUA) recibirá la solicitud para su firma y visto bueno.', 
      '¿Enviar a autorización?', 
      'Sí, enviar a Titular'
    );

    if (result.isConfirmed) {
      try {
        await dispatch(enviarATua(id)).unwrap();
        alerts.success('La transferencia está ahora en revisión por tu Titular.', '¡ENVIADO A REVISIÓN!');
        fetchRecords(true);
        dispatch(checkVigencias());
      } catch (error) {
        console.error("Transfer Error Object:", error);
        alerts.error(error);
      }
    }
  };

  const handleResubmit = async (id) => {
    const result = await alerts.confirm(
      'Confirma que has realizado las correcciones solicitadas. La transferencia regresará a revisión del TUA.', 
      '¿Re-enviar Transferencia?', 
      'Sí, re-enviar corregida'
    );

    if (result.isConfirmed) {
      try {
        await dispatch(resubmitTransfer({ id, data: {} })).unwrap();
        alerts.success('La transferencia ha sido enviada nuevamente a revisión tras la subsanación.', '¡CORRECCIONES ENVIADAS!');
        fetchRecords(true);
      } catch (error) {
        alerts.error(error);
      }
    }
  };

  const handleEnviarARac = async (id) => {
    const result = await alerts.confirm(
      'Confirma que las cajas han sido enviadas físicamente al Archivo de Concentración.', 
      '¿Confirmar Envío Físico?', 
      'Sí, confirmar envío'
    );

    if (result.isConfirmed) {
      try {
        await dispatch(enviarARac(id)).unwrap();
        alerts.success('Se ha notificado al RAC sobre el arribo físico del acervo.', '¡TRANSFERENCIA EN CAMINO!');
        fetchRecords(true);
        dispatch(checkVigencias());
      } catch (error) {
        console.error("Transfer Error Object:", error);
        alerts.error(error);
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'elaboracion': return 'bg-gray-50 text-gray-500 border-gray-100';
      case 'revision_tua': return 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse';
      case 'revision_coordinador': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'autorizada': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'en_transito': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'recibida': return 'bg-emerald-500 text-white border-emerald-500';
      case 'rechazada_tua':
      case 'rechazada_coordinador':
      case 'rechazada_rac': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header } */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
               <Send className="text-white" size={28} />
            </div>
            {isCoordinator ? 'Supervisión de Transferencias' : 'Mis Transferencias'}
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
            {isCoordinator ? 'Control Institucional de Envíos Primarios y Secundarios' : 'Gestión de Envíos Primarios de la Unidad'}
          </p>
        </div>
        {user?.role?.slug === 'rat' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:shadow-[0_20px_50px_rgba(122,21,46,0.3)] transition-all active:scale-95 flex items-center gap-3"
          >
            <Plus size={18} />
            Nueva Transferencia
          </button>
        )}
      </div>

      {/* { buscador y filtro de unidad (solo coordinador) } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por folio o estatus..."
            className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {user?.role?.slug === 'coord_archivos' && (
          <div className="relative group w-full lg:w-96">
            <Building className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
            <select
              value={selectedUnidad}
              onChange={(e) => setSelectedUnidad(e.target.value)}
              className="w-full pl-16 pr-12 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase appearance-none cursor-pointer"
            >
              <option value="">Todas las Unidades</option>
              {unidades.map(u => (
                <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#7A152E] transition-colors" size={20} />
          </div>
        )}
      </div>

      {/* { tabla } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-4 text-[#7A152E]">
            <Loader2 className="animate-spin" size={48} />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Cargando Transferencias...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Folio / Fecha</th>
                  {isCoordinator && <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Unidad Origen</th>}
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Expedientes</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                  <th className="px-10 py-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isCoordinator ? "5" : "4"} className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold">No hay registros para mostrar</td>
                  </tr>
                ) : (
                  filteredRecords.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-10 py-8">
                        <span className="text-[#7A152E] font-black text-sm">{t.numero_transferencia}</span>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic">{new Date(t.created_at).toLocaleDateString()}</p>
                      </td>
                      {isCoordinator && (
                        <td className="px-10 py-8">
                          <span className="text-slate-700 font-black text-[10px] uppercase tracking-tighter leading-tight line-clamp-1">{t.unidad_origen?.nombre}</span>
                        </td>
                      )}
                      <td className="px-10 py-8">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500">
                          {t.expedientes?.length || 0} Expedientes
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border w-fit ${getStatusStyle(t.estatus)}`}>
                          {t.estatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex justify-center gap-3">
                          {t.estatus === 'elaboracion' && user?.role?.slug === 'rat' && (
                            <button 
                              onClick={() => handleEnviarATua(t.id)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                            >
                              <UserCheck size={14} /> Enviar a TUA
                            </button>
                          )}
                          {t.estatus.startsWith('rechazada_') && (
                            <div className="flex gap-2">
                              {user?.role?.slug === 'rat' && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setSelectedRecord(t);
                                      setIsSubsanacionOpen(true);
                                    }}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
                                  >
                                    <CheckCircle2 size={14} /> Subsanar / Editar
                                  </button>

                                  <button 
                                    onClick={() => handleResubmit(t.id)}
                                    className="bg-[#7A152E] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4A0D1C] transition-all shadow-md flex items-center gap-2"
                                  >
                                    <Send size={14} /> Re-enviar
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          {t.estatus === 'autorizada' && user?.role?.slug === 'rat' && (
                            <button 
                              onClick={() => handleEnviarARac(t.id)}
                              className="bg-[#BC955B] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a6834d] transition-all shadow-md flex items-center gap-2"
                            >
                              <Truck size={14} /> Confirmar Envío
                            </button>
                          )}
                          <button 
                            onClick={() => handleView(t.id)}
                            className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-[#7A152E] transition-all"
                          >
                             <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransferenciaForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
            fetchRecords(true);
            Swal.fire({
              icon: 'success',
              title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡TRANSFERENCIA INICIADA!</span>',
              text: 'La solicitud ha sido creada y enviada a revisión.',
              iconColor: '#7A152E',
              timer: 2500,
              showConfirmButton: false,
              background: '#ffffff',
              customClass: {
                popup: 'rounded-[3rem] shadow-2xl border-none',
                title: 'text-2xl py-10',
              }
            });
        }}
      />

      <TransferenciaView 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        record={selectedRecord}
      />

      <SubsanacionForm 
        isOpen={isSubsanacionOpen}
        onClose={() => setIsSubsanacionOpen(false)}
        record={selectedRecord}
        onSuccess={() => {
            fetchRecords(true);
            // refrescar expedientes para actualizar iconos en la tabla general
            dispatch(fetchExpedientes({ per_page: -1, fase: 'tramite' }));

            Swal.fire({
              icon: 'success',
              title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡CAMBIOS GUARDADOS!</span>',
              text: 'La transferencia ha sido actualizada. Recuerda pulsar "Re-enviar" cuando estés listo.',
              iconColor: '#7A152E',
              timer: 2500,
              showConfirmButton: false,
              background: '#ffffff',
              customClass: {
                popup: 'rounded-[3rem] shadow-2xl border-none',
                title: 'text-2xl py-10',
              }
            });
        }}
      />
    </div>
  );
};

export default TransferenciasPage;
