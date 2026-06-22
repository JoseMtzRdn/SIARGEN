import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Archive, 
  Search, 
  Loader2, 
  FileText, 
  Eye,
  Building,
  Layers,
  MapPin,
  Calendar,
  ShieldCheck,
  X,
  ChevronDown,
  ArrowUpRight,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchExpedientes } from '../../store/expedienteSlice';
import { fetchUnidadesCatalog } from '../../store/unidadSlice';
import api from '../../api/axios';
import ExpedienteView from '../../components/tramite/ExpedienteView';
import PrestamoForm from '../../components/concentracion/PrestamoForm';
import ModalPortal from '../../components/ModalPortal';
import Swal from 'sweetalert2';

const CustodiaPage = () => {
  const dispatch = useDispatch();
  const { items, loading, lastFetch } = useSelector((state) => state.expedientes);
  const { user } = useSelector((state) => state.auth);
  const { catalog: unidades } = useSelector((state) => state.unidades);
  
  const allExpedientes = useMemo(() => Array.isArray(items) ? items : [], [items]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPrestamoOpen, setIsPrestamoOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [locationForm, setLocationModal] = useState({ 
    seccion: '', 
    bateria: '', 
    modulo: '', 
    entrepaño: '',
    ubicacion_caja: '',
    numero_cajas: 1 
  });
  const [selectedUnidad, setSelectedUnidad] = useState('');
  const [filterPendingLocation, setFilterPendingLocation] = useState(false);

  const isCoordinator = user?.role?.slug === 'coord_archivos';
  const isTua = user?.role?.slug === 'tua';
  const isRac = user?.role?.slug === 'rac';
  const canFilter = isCoordinator || isRac;

  const fetchRecords = useCallback((force = false) => {
    const params = { per_page: -1, fase: 'concentracion' };
    if (canFilter && selectedUnidad) {
      params.unidad_administrativa_id = selectedUnidad;
    }
    dispatch(fetchExpedientes(params));
  }, [dispatch, canFilter, selectedUnidad]);

  useEffect(() => {
    fetchRecords();
    if (canFilter) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [fetchRecords, canFilter, dispatch]);

  // Actualiza el acervo al cambiar la unidad.
  useEffect(() => {
    if (canFilter) {
      fetchRecords();
    }
  }, [selectedUnidad, canFilter, fetchRecords]);

  const pendingLocationCount = useMemo(() => {
      const list = Array.isArray(items) ? items : [];
      return list.filter(exp => 
        exp.estatus_disponibilidad !== 'prestado' && 
        (!exp.ubicacion_seccion || exp.ubicacion_seccion.trim() === '')
      ).length;
  }, [items]);

  const filteredRecords = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter(exp => {
      // no mostrar si está en préstamo (solicitud de usuario)
      if (exp.estatus_disponibilidad === 'prestado') return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        exp.numero_expediente?.toLowerCase().includes(searchLower) || 
        exp.titulo?.toLowerCase().includes(searchLower) ||
        exp.serie?.nombre?.toLowerCase().includes(searchLower) ||
        exp.subserie?.nombre?.toLowerCase().includes(searchLower);
        
      const matchesPending = filterPendingLocation ? (!exp.ubicacion_seccion || exp.ubicacion_seccion.trim() === '') : true;

      return matchesSearch && matchesPending;
    });
  }, [items, searchTerm, filterPendingLocation]);

  const handleOpenLocation = (exp) => {
    setSelectedExpediente(exp);
    setLocationModal({
        seccion: exp.ubicacion_seccion || '',
        bateria: exp.ubicacion_bateria || '',
        modulo: exp.ubicacion_modulo || '',
        entrepaño: exp.ubicacion_entrepaño || '',
        ubicacion_caja: exp.ubicacion_caja || '',
        numero_cajas: exp.numero_cajas || 1
    });
    setIsLocationModalOpen(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
        // Estructuración de datos conforme a requerimientos de validación.
        const payload = {
            serie_id: selectedExpediente.serie?.id,
            titulo: selectedExpediente.titulo,
            año_apertura: selectedExpediente.año_apertura,
            clasificacion_informacion: selectedExpediente.clasificacion_informacion,
            ubicacion_seccion: locationForm.seccion,
            ubicacion_bateria: locationForm.bateria,
            ubicacion_modulo: locationForm.modulo,
            ubicacion_entrepaño: locationForm.entrepaño,
            ubicacion_caja: locationForm.ubicacion_caja,
            numero_cajas: locationForm.numero_cajas
        };

        await api.put(`/expedientes/${selectedExpediente.id}`, payload);
        
        setIsLocationModalOpen(false);

        Swal.fire({
            icon: 'success',
            title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡UBICACIÓN ACTUALIZADA!</span>',
            text: 'Las coordenadas del acervo han sido registradas en el sistema.',
            iconColor: '#7A152E',
            timer: 2000,
            showConfirmButton: false,
            background: '#ffffff',
            customClass: { popup: 'rounded-[3rem] shadow-2xl border-none', title: 'text-2xl py-10' }
        });
        
        fetchRecords(true);
    } catch (error) {
        console.error('Update Error:', error.response?.data);
        const errorMsg = error.response?.data?.message || 'No se pudo actualizar la ubicación';
        
        Swal.fire({
            icon: 'error',
            title: 'Error de Validación',
            text: String(errorMsg),
            confirmButtonColor: '#7A152E',
            customClass: { popup: 'rounded-[2rem]' }
        });
    }
  };

  const handleView = async (exp) => {
    try {
      const response = await api.get(`/expedientes/${exp.id}`);
      setSelectedExpediente(response.data.data);
      setIsViewOpen(true);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Lectura',
            text: 'No se pudo cargar el detalle del expediente',
            confirmButtonColor: '#7A152E',
            customClass: { popup: 'rounded-[2rem]' }
        });
    }
  };

  const handlePrestamo = (exp) => {
    if (!exp.ubicacion_seccion || exp.ubicacion_seccion.trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">Ubicación Requerida</span>',
            text: 'No se puede generar un vale de préstamo para un expediente que no tiene coordenadas de ubicación topográfica registradas en el almacén.',
            confirmButtonColor: '#7A152E',
            background: '#ffffff',
            customClass: { popup: 'rounded-[2rem]' }
        });
        return;
    }
    setSelectedExpediente(exp);
    setIsPrestamoOpen(true);
  };

  return (
    <div className="space-y-8 font-inter pb-20 px-4">
      {/* { header - siguiendo patrón de trámite } */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 bg-[#7A152E] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 text-white">
                <Archive size={28} />
             </div>
             Acervo en Custodia
          </h2>
          <p className="text-gray-500 font-bold text-lg uppercase tracking-wider">
             Repositorio Central de Concentración - <span className="text-[#BC955B]">
                {isCoordinator 
                  ? (selectedUnidad ? unidades.find(u => String(u.id) === String(selectedUnidad))?.nombre : 'Todas las Unidades')
                  : isTua ? (user?.unidad_administrativa?.nombre || 'Mi Unidad')
                  : 'Gestión de Inventario'
                }
             </span>
          </p>
        </div>
      </div>

      {/* { buscador y filtro de unidad (solo coordinador y rac) } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Buscar por folio, título o unidad de origen..."
              className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-gray-700 shadow-inner uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setFilterPendingLocation(!filterPendingLocation)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 transition-all shrink-0 ${
                  filterPendingLocation 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' 
                  : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                  <div className={`w-2 h-2 rounded-full ${filterPendingLocation ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <div className="flex flex-col text-left">
                    <span className="text-[7px] font-black uppercase tracking-widest leading-none">Pendientes</span>
                    <span className="text-xs font-black leading-tight mt-0.5">{pendingLocationCount}</span>
                  </div>
              </button>

              {canFilter && (
                <div className="relative group min-w-[200px] lg:min-w-[280px] flex-1 lg:flex-none">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={18} />
                  <select
                    value={selectedUnidad}
                    onChange={(e) => setSelectedUnidad(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-bold text-xs text-gray-700 shadow-inner uppercase appearance-none cursor-pointer h-full"
                  >
                    <option value="">Todas las Unidades</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#7A152E] transition-colors" size={16} />
                </div>
              )}
          </div>
      </div>

      {/* { tabla - siguiendo patrón de trámite } */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative min-h-[400px]">
        {loading && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-4 text-[#7A152E]">
                <Loader2 className="animate-spin" size={48} />
                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Consultando Acervo...</span>
              </div>
           </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest w-[25%]">Identificación</th>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest w-[25%]">Serie Documental</th>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-[12%]">Volumen / Disposición final</th>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest w-[28%]">Ubicación RAC (S·B·M·E·C)</th>
                  <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-[10%]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold">No hay registros bajo custodia en este momento</td>
                  </tr>
                ) : (
                  filteredRecords.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#7A152E]/5 rounded-xl flex items-center justify-center text-[#7A152E] shrink-0 border border-[#7A152E]/10">
                             <FileText size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-slate-900 font-black text-[11px] block leading-tight uppercase tracking-tight line-clamp-2 mb-1">
                              {exp.titulo}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[#7A152E] font-bold text-[9px] bg-[#7A152E]/5 px-1.5 py-0.5 rounded tracking-widest border border-[#7A152E]/10">
                                {exp.numero_expediente}
                              </span>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200" title="Documentos integrados">
                                 <Layers size={9} className="text-slate-400" />
                                 <span className="text-[8px] font-black text-slate-600">{exp.documentos_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-slate-600 font-black text-[10px] uppercase tracking-tighter leading-tight line-clamp-2">
                           {exp.subserie ? exp.subserie.nombre : exp.serie?.nombre}
                        </span>
                        <span className="text-[8px] font-bold text-[#BC955B] uppercase block mt-1">
                          {exp.subserie ? `SUBSERIE: ${exp.subserie.codigo}` : `SERIE: ${exp.serie?.codigo}`}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                           <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                              <Archive size={9} className="text-amber-600" />
                              <span className="text-[9px] font-black text-amber-700">{exp.numero_cajas || 1} CAJAS</span>
                           </div>
                           <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                              exp.serie?.disposicion_final === 'Historico' 
                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                : exp.serie?.disposicion_final === 'Muestreo'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {exp.serie?.disposicion_final || 'Baja'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           {!exp.ubicacion_seccion || exp.ubicacion_seccion.trim() === '' ? (
                               isRac ? (
                                 <button 
                                   onClick={() => handleOpenLocation(exp)}
                                   className="flex-1 bg-amber-50 p-2 rounded-xl border-2 border-amber-200 border-dashed flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors group/btn"
                                 >
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                    <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest group-hover/btn:text-amber-800">Pendiente</span>
                                 </button>
                               ) : (
                                 <div className="flex-1 bg-amber-50/50 p-2 rounded-xl border-2 border-amber-100 border-dashed flex items-center justify-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300"></div>
                                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Pendiente de Ubicar</span>
                                 </div>
                               )
                           ) : (
                               <div className="flex-1 bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-between">
                                  <div className="flex flex-col items-center px-1.5 border-r border-gray-200">
                                     <span className="text-[6px] font-black text-gray-400 uppercase mb-0.5">Secc</span>
                                     <span className="text-[9px] font-black text-[#7A152E]">{exp.ubicacion_seccion}</span>
                                  </div>
                                  <div className="flex flex-col items-center px-1.5 border-r border-gray-200">
                                     <span className="text-[6px] font-black text-gray-400 uppercase mb-0.5">Bat</span>
                                     <span className="text-[9px] font-black text-[#7A152E]">{exp.ubicacion_bateria || '-'}</span>
                                  </div>
                                  <div className="flex flex-col items-center px-1.5 border-r border-gray-200">
                                     <span className="text-[6px] font-black text-gray-400 uppercase mb-0.5">Mod</span>
                                     <span className="text-[9px] font-black text-[#7A152E]">{exp.ubicacion_modulo || '-'}</span>
                                  </div>
                                  <div className="flex flex-col items-center px-1.5 border-r border-gray-200">
                                     <span className="text-[6px] font-black text-gray-400 uppercase mb-0.5">Entr</span>
                                     <span className="text-[9px] font-black text-[#7A152E]">{exp.ubicacion_entrepaño || '-'}</span>
                                  </div>
                                  <div className="flex flex-col items-center px-1.5">
                                     <span className="text-[6px] font-black text-gray-400 uppercase mb-0.5">Caja</span>
                                     <span className="text-[9px] font-black text-[#7A152E]">{exp.ubicacion_caja || '-'}</span>
                                  </div>
                               </div>
                           )}
                           {isRac && (
                              <button 
                                onClick={() => handleOpenLocation(exp)}
                                className="p-2 bg-white text-[#BC955B] rounded-lg shadow-sm border border-[#BC955B]/20 hover:bg-[#BC955B] hover:text-white transition-all shrink-0"
                                title="Editar Ubicación"
                              >
                                 <MapPin size={14} />
                              </button>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={() => handleView(exp)}
                            className={`p-2 rounded-lg shadow-sm border transition-all ${
                              exp.estado_archivo === 'subsanacion'
                              ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 animate-pulse'
                              : 'bg-white text-slate-400 border-slate-100 hover:text-[#7A152E]'
                            }`}
                            title={exp.estado_archivo === 'subsanacion' ? "Subsanar / Corregir" : "Ver Detalle"}
                          >
                             {exp.estado_archivo === 'subsanacion' ? <Wrench size={16} /> : <Eye size={16} />}
                          </button>

                          {isRac && (
                            <button 
                              onClick={() => handlePrestamo(exp)}
                              className={`p-2 rounded-lg shadow-sm border transition-all ${
                                !exp.ubicacion_seccion || exp.ubicacion_seccion.trim() === ''
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-slate-400 border-slate-100 hover:text-blue-600'
                              }`}
                              title={!exp.ubicacion_seccion || exp.ubicacion_seccion.trim() === '' ? "Ubicación Requerida" : "Generar Vale de Préstamo"}
                            >
                               <ArrowUpRight size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* { modal de ubicación topográfica } */}
      {isLocationModalOpen && isRac && (
        <ModalPortal>
          <div className="overlay-blur-full flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden z-[10001]"
            >
              <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] p-6 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shadow-inner text-[#BC955B]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight leading-none">Ubicación Topográfica</h3>
                    <p className="text-[#BC955B] text-[7px] font-black uppercase tracking-widest mt-1">Coordenadas de Almacén</p>
                  </div>
                </div>
                <button onClick={() => setIsLocationModalOpen(false)} className="text-white/30 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateLocation} className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Expediente:</p>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase leading-tight line-clamp-1">{selectedExpediente?.titulo}</h4>
                  <p className="text-[#7A152E] font-bold text-[9px] mt-0.5">{selectedExpediente?.numero_expediente}</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1">Secc</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-2 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-[#BC955B]/30 outline-none transition-all font-black text-[10px] text-slate-700 text-center uppercase"
                      value={locationForm.seccion}
                      onChange={(e) => setLocationModal({...locationForm, seccion: e.target.value})}
                      placeholder="-"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1">Bat</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-2 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-[#BC955B]/30 outline-none transition-all font-black text-[10px] text-slate-700 text-center uppercase"
                      value={locationForm.bateria}
                      onChange={(e) => setLocationModal({...locationForm, bateria: e.target.value})}
                      placeholder="-"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1">Mod</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-2 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-[#BC955B]/30 outline-none transition-all font-black text-[10px] text-slate-700 text-center uppercase"
                      value={locationForm.modulo}
                      onChange={(e) => setLocationModal({...locationForm, modulo: e.target.value})}
                      placeholder="-"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1">Entr</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-2 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-[#BC955B]/30 outline-none transition-all font-black text-[10px] text-slate-700 text-center uppercase"
                      value={locationForm.entrepaño}
                      onChange={(e) => setLocationModal({...locationForm, entrepaño: e.target.value})}
                      placeholder="-"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Caja *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-black text-[10px] text-slate-700 uppercase"
                      value={locationForm.ubicacion_caja}
                      onChange={(e) => setLocationModal({...locationForm, ubicacion_caja: e.target.value})}
                      placeholder="C-000"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-1">Volumen (Cajas)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#7A152E]/20 outline-none transition-all font-black text-[10px] text-slate-700"
                      value={locationForm.numero_cajas}
                      onChange={(e) => setLocationModal({...locationForm, numero_cajas: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                   <button 
                      type="button"
                      onClick={() => setIsLocationModalOpen(false)}
                      className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                   >
                      Cancelar
                   </button>
                   <button 
                      type="submit"
                      className="flex-[2] bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#7A152E]/10 hover:shadow-[#7A152E]/20 transition-all active:scale-95"
                   >
                      Guardar Coordenadas
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      <ExpedienteView
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        record={selectedExpediente}
      />

      <PrestamoForm
        isOpen={isPrestamoOpen}
        onClose={() => setIsPrestamoOpen(false)}
        onSuccess={() => fetchRecords(true)}
        expediente={selectedExpediente}
      />
    </div>
  );
};

export default CustodiaPage;
