import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, 
  Archive, 
  Calendar, 
  Building, 
  User, 
  Hash, 
  MapPin, 
  Layers, 
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  Info,
  List,
  Box,
  Trash2,
  RefreshCcw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../ModalPortal';
import CorrespondenciaView from '../correspondencia/CorrespondenciaView';
import { desarchivarCorrespondencia } from '../../store/correspondenciaSlice';
import { reclasificarExpediente, updateUbicacionExpediente, fetchExpedientes } from '../../store/expedienteSlice';
import { fetchSubseries } from '../../store/catalogoSlice';
import Swal from 'sweetalert2';

const ExpedienteView = ({ isOpen, onClose, record, forceSubsanacionMode = false }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { series, subseries } = useSelector((state) => state.catalogos);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isDocViewOpen, setIsDocViewOpen] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);

  // sincronizar record cuando cambie y cargar catálogos necesarios
  React.useEffect(() => {
    setLocalRecord(record);
    if (isOpen) {
      dispatch(fetchSubseries()); // cargar todas las subseries para la cascada
    }
  }, [record, isOpen, dispatch]);

  if (!isOpen || !localRecord) return null;

  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    setIsDocViewOpen(true);
  };

  const handleExtraerDocumento = async (e, doc) => {
    e.stopPropagation(); // evitar abrir el detalle del documento
    
    const { value: motivo } = await Swal.fire({
      title: 'Extraer Documento por Error',
      text: `¿Deseas desvincular el folio ${doc.folio_sistema} de este expediente? Regresará a la bandeja de correspondencia pendiente.`,
      input: 'textarea',
      inputPlaceholder: 'Explique brevemente el motivo de la extracción...',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, extraer documento',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debe proporcionar un motivo para la auditoría';
      }
    });

    if (motivo) {
      try {
        await dispatch(desarchivarCorrespondencia({ id: doc.id, motivo })).unwrap();
        
        // actualizar vista local
        setLocalRecord(prev => ({
          ...prev,
          documentos: prev.documentos.filter(d => d.id !== doc.id)
        }));

        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡DOCUMENTO EXTRAÍDO!</span>',
          text: 'El folio ha sido desvinculado exitosamente del expediente.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
        
        // refrescar lista general para actualizar contadores
        dispatch(fetchExpedientes({ per_page: -1, fase: 'tramite' }));
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: String(error) });
      }
    }
  };

  const handleReclasificar = async () => {
    // generar opciones para el select (jerarquía serie -> subserie)
    const optionsHtml = series.map(s => {
        const children = subseries.filter(sub => sub.serie_id === s.id);
        const hasChildren = children.length > 0;
        
        let html = `<option value="serie_${s.id}" ${hasChildren ? 'disabled' : ''} ${!hasChildren && s.id === localRecord.serie_id && !localRecord.subserie_id ? 'selected' : ''} class="${hasChildren ? 'font-black text-gray-400 bg-gray-100' : 'font-bold'}">
            ${s.codigo} - ${s.nombre} ${hasChildren ? '(REQUIERE SUBSERIE)' : ''}
        </option>`;

        children.forEach(sub => {
            html += `<option value="subserie_${sub.id}" ${sub.id === localRecord.subserie_id ? 'selected' : ''} class="pl-4">
                &nbsp;&nbsp;&nbsp;↳ ${sub.codigo} - ${sub.nombre}
            </option>`;
        });

        return html;
    }).join('');

    const { value: selectedValue } = await Swal.fire({
      title: 'Reclasificación Archivística (Cascada)',
      html: `
        <div class="text-left space-y-4 p-4">
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Seleccione la nueva serie o subserie. Las series con subseries están deshabilitadas: debe seleccionar una de sus subseries.</p>
            <label class="block text-[9px] font-black text-[#7A152E] uppercase">Nueva Clasificación</label>
            <select id="swal-input-clasificacion" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-[#7A152E]">
                <option value="">-- Seleccionar --</option>
                ${optionsHtml}
            </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Confirmar Reclasificación',
      preConfirm: () => {
        const val = document.getElementById('swal-input-clasificacion').value;
        if (!val) {
            Swal.showValidationMessage('Debe seleccionar una clasificación válida');
            return false;
        }
        return val;
      }
    });

    if (selectedValue) {
      const [type, id] = selectedValue.split('_');
      const payload = { id: localRecord.id };
      
      if (type === 'subserie') {
          const sub = subseries.find(s => String(s.id) === String(id));
          payload.serie_id = sub.serie_id;
          payload.subserie_id = sub.id;
      } else {
          payload.serie_id = id;
          payload.subserie_id = null;
      }

      try {
        const updated = await dispatch(reclasificarExpediente(payload)).unwrap();
        setLocalRecord(updated);
        
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡RECLASIFICACIÓN EXITOSA!</span>',
          text: 'Se ha actualizado la serie en cascada para todos los documentos vinculados.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
        
        dispatch(fetchExpedientes({ per_page: -1, fase: 'tramite' }));
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: String(error) });
      }
    }
  };

  const handleEditarUbicacion = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Corregir Ubicación Topográfica',
      html: `
        <div class="text-left space-y-4 p-4">
            <div class="bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl flex items-center gap-4 mb-4">
              <div class="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div>
                <h4 class="text-orange-900 font-black text-[10px] uppercase tracking-tighter leading-none mb-1">Campos Obligatorios</h4>
                <p class="text-orange-700 font-bold text-[9px] italic line-clamp-2">Si no cuenta con el dato físico exacto, debe capturar "N/A" o "S/N".</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-1">
                    <label class="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Sección *</label>
                    <input id="swal-seccion" class="swal2-input !m-0 !w-full !text-xs font-bold !rounded-xl !border-2 !border-gray-100 focus:!border-orange-500 !bg-gray-50" placeholder="EJM: AREA A / N/A" value="${localRecord.ubicacion_seccion || ''}">
                </div>
                <div class="col-span-1">
                    <label class="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Batería *</label>
                    <input id="swal-bateria" class="swal2-input !m-0 !w-full !text-xs font-bold !rounded-xl !border-2 !border-gray-100 focus:!border-orange-500 !bg-gray-50" placeholder="EJM: BAT-01 / S/N" value="${localRecord.ubicacion_bateria || ''}">
                </div>
                <div class="col-span-1">
                    <label class="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Módulo *</label>
                    <input id="swal-modulo" class="swal2-input !m-0 !w-full !text-xs font-bold !rounded-xl !border-2 !border-gray-100 focus:!border-orange-500 !bg-gray-50" placeholder="EJM: MOD-05 / N/A" value="${localRecord.ubicacion_modulo || ''}">
                </div>
                <div class="col-span-1">
                    <label class="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Entrepaño *</label>
                    <input id="swal-entrepano" class="swal2-input !m-0 !w-full !text-xs font-bold !rounded-xl !border-2 !border-gray-100 focus:!border-orange-500 !bg-gray-50" placeholder="EJM: NIVEL 3 / S/N" value="${localRecord.ubicacion_entrepaño || ''}">
                </div>
                <div class="col-span-2">
                    <label class="block text-[8px] font-black text-[#7A152E] uppercase mb-1 ml-1">No. de Caja (Identificador) *</label>
                    <input id="swal-caja" class="swal2-input !m-0 !w-full !text-xs font-black !rounded-xl !border-2 !border-gray-100 focus:!border-[#7A152E] !bg-gray-50 uppercase" placeholder="EJM: CAJA-2024-001" value="${localRecord.ubicacion_caja || ''}">
                </div>
                <div class="col-span-2">
                    <label class="block text-[8px] font-black text-[#BC955B] uppercase mb-1 ml-1">Cantidad Total de Cajas *</label>
                    <input id="swal-num-cajas" type="number" min="1" class="swal2-input !m-0 !w-full !text-xs font-black !rounded-xl !border-2 !border-gray-100 focus:!border-[#BC955B] !bg-gray-50" value="${localRecord.numero_cajas || 1}">
                </div>
            </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#7A152E',
      confirmButtonText: 'Guardar Cambios',
      preConfirm: () => {
        const data = {
          ubicacion_seccion: document.getElementById('swal-seccion').value.trim(),
          ubicacion_bateria: document.getElementById('swal-bateria').value.trim(),
          ubicacion_modulo: document.getElementById('swal-modulo').value.trim(),
          ubicacion_entrepaño: document.getElementById('swal-entrepano').value.trim(),
          ubicacion_caja: document.getElementById('swal-caja').value.trim(),
          numero_cajas: parseInt(document.getElementById('swal-num-cajas').value),
        };

        if (!data.ubicacion_seccion || !data.ubicacion_bateria || !data.ubicacion_modulo || !data.ubicacion_entrepaño || !data.ubicacion_caja) {
            Swal.showValidationMessage('Todos los campos de ubicación son obligatorios. Use "N/A" si es necesario.');
            return false;
        }

        if (isNaN(data.numero_cajas) || data.numero_cajas < 1) {
            Swal.showValidationMessage('La cantidad de cajas debe ser un número mayor o igual a 1.');
            return false;
        }

        return data;
      }
    });

    if (formValues) {
      try {
        const updated = await dispatch(updateUbicacionExpediente({ id: localRecord.id, ubicacionData: formValues })).unwrap();
        setLocalRecord(updated);
        
        Swal.fire({
          icon: 'success',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡UBICACIÓN ACTUALIZADA!</span>',
          text: 'Los metadatos físicos han sido corregidos con éxito en el acervo.',
          iconColor: '#7A152E',
          timer: 2500,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
        
        dispatch(fetchExpedientes({ per_page: -1, fase: 'tramite' }));
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: String(error) });
      }
    }
  };

  const hasSubserie = !!localRecord.subserie;
  const source = hasSubserie ? localRecord.subserie.serie : localRecord.serie;
  const seccion = source?.seccion;
  const fondo = seccion?.fondo;

  const isSubsanacionMode = forceSubsanacionMode || ((localRecord.estado_archivo === 'subsanacion' || localRecord.needs_subsanacion) && user?.role?.slug === 'rat');
  
  // Mostrar banner de protección si no está en modo de subsanación.
  const isProtectedOnly = !isSubsanacionMode && localRecord.is_in_subsanacion;

  const dataFields = [
    { label: 'Folio Institucional', value: localRecord.numero_expediente, icon: Hash, color: 'text-[#7A152E]' },
    { label: 'Título', value: localRecord.titulo, icon: FileText, fullWidth: true },
    { label: 'Fondo', value: fondo?.nombre || 'INSTITUTO DE SALUD DEL ESTADO DE MÉXICO', icon: Building, color: 'text-slate-500' },
    { label: 'Sección', value: seccion ? `${seccion.codigo} - ${seccion.nombre}` : 'NO ESPECIFICADA', icon: List, color: 'text-slate-500' },
    { 
        label: 'Clasificación Archivística', 
        value: hasSubserie 
            ? `${localRecord.subserie.codigo} - ${localRecord.subserie.nombre}` 
            : `${localRecord.serie?.codigo} - ${localRecord.serie?.nombre}`, 
        icon: Archive, 
        color: 'text-[#BC955B]',
        badge: hasSubserie ? 'Subserie' : 'Serie'
    },
    { label: 'Unidad Administrativa', value: localRecord.unidad_administrativa?.nombre, icon: Building },
    { label: 'Año de Apertura', value: localRecord.año_apertura, icon: Calendar },
    { label: 'Fecha de Cierre', value: localRecord.fecha_cierre ? new Date(localRecord.fecha_cierre).toLocaleDateString() : 'N/A', icon: Calendar, color: localRecord.fecha_cierre ? 'text-amber-600' : 'text-slate-300' },
    { label: 'Fase de Archivo', value: localRecord.fase, icon: Clock, className: 'uppercase font-black text-[#7A152E]' },
    { label: 'Volumen Documental (Número de Cajas)', value: `${localRecord.numero_cajas || 0} Caja(s)`, icon: Archive, className: 'text-[#7A152E]' },
    { label: 'Total de Legajos', value: localRecord.num_legajos || 0, icon: Layers, className: 'text-[#7A152E]' },
    { label: 'Total de Fojas', value: localRecord.num_fojas || 0, icon: FileText, className: 'text-[#7A152E]' },
    { label: 'Estatus Disponibilidad', value: localRecord.estatus_disponibilidad?.replace(/_/g, ' '), icon: ShieldCheck, className: 'uppercase font-black text-emerald-600' },
    { label: 'Clasificación', value: localRecord.clasificacion_informacion, icon: ShieldCheck, className: 'uppercase font-black' },
    { label: 'Descripción del Contenido', value: localRecord.observaciones, icon: FileText, className: 'italic text-slate-500', fullWidth: true },
  ];

  return (
    <ModalPortal>
      <div className="overlay-blur-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden relative z-[10000]"
        >
          {/* { header } */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 flex justify-between items-center text-white">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <Archive size={24} className="text-[#BC955B]" />
                DETALLE DE EXPEDIENTE
              </h3>
              <p className="text-white/60 text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5">Metadatos Archivísticos - CGCA</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={18} /></button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* { banner de modo subsanación o protección de transferencia } */}
            {(isSubsanacionMode || localRecord.is_in_subsanacion) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  isSubsanacionMode ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                } border-2 p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 ${
                    isSubsanacionMode ? 'bg-orange-500' : 'bg-blue-500'
                  } rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                    {isSubsanacionMode ? <AlertTriangle size={32} className="animate-pulse" /> : <Clock size={32} />}
                  </div>
                  <div className="text-left">
                    <h4 className={`${
                      isSubsanacionMode ? 'text-orange-900' : 'text-blue-900'
                    } font-black text-xl uppercase tracking-tighter leading-none mb-1`}>
                      {isSubsanacionMode ? 'Modo Subsanación Activo' : 'Expediente Protegido'}
                    </h4>
                    <p className={`${
                      isSubsanacionMode ? 'text-orange-700' : 'text-blue-700'
                    } font-bold text-sm italic`}>
                      {isSubsanacionMode 
                        ? 'Este expediente requiere correcciones técnicas para continuar su proceso.' 
                        : 'Se encuentra vinculado a una transferencia en revisión. Ediciones bloqueadas.'
                      }
                    </p>
                  </div>
                </div>
                
                {isSubsanacionMode && (
                  <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={handleReclasificar}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-2 active:scale-95"
                      >
                        <RefreshCcw size={16} /> Reclasificar
                      </button>
                      <button 
                        onClick={handleEditarUbicacion}
                        className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-2 active:scale-95"
                      >
                        <MapPin size={16} /> Ubicación
                      </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* { grid de datos principales } */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dataFields.map((field, index) => (
                <div key={index} className={`flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 transition-colors hover:bg-gray-100/50 ${field.fullWidth ? 'md:col-span-2' : ''}`}>
                  <div className={`p-2.5 rounded-lg bg-white shadow-sm shrink-0 ${field.color || 'text-slate-400'}`}>
                    <field.icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{field.label}</p>
                        {field.badge && (
                            <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${field.badge === 'Subserie' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                {field.badge}
                            </span>
                        )}
                    </div>
                    <p className={`text-[10px] font-bold text-slate-700 break-words whitespace-pre-wrap ${field.className || ''}`}>{field.value || 'SIN DESCRIPCIÓN'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* { valores documentales y vigencias } */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* { valores } */}
                <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em]">Valores Documentales</h4>
                        <Info size={12} className="text-slate-300" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['administrativo', 'legal', 'fiscal', 'contable'].map((v) => (
                            <span key={v} className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${localRecord.valores_documentales?.[v] ? 'bg-[#7A152E] text-white border-[#7A152E] shadow-sm' : 'bg-white text-gray-300 border-gray-100'}`}>
                                {v}
                            </span>
                        ))}
                    </div>
                </div>

                {/* { vigencias } */}
                <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <h4 className="text-[9px] font-black text-[#BC955B] uppercase tracking-[0.2em]">Tiempos de Conservación</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[7px] text-gray-400 font-black uppercase">Trámite</p>
                            <p className="text-[10px] font-black text-[#7A152E]">{localRecord.vigencias?.tramite || 0}a</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[7px] text-gray-400 font-black uppercase">Conc.</p>
                            <p className="text-[10px] font-black text-[#7A152E]">{localRecord.vigencias?.concentracion || 0}a</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[7px] text-gray-400 font-black uppercase">Hist.</p>
                            <p className="text-[9px] font-black text-[#7A152E] truncate">{localRecord.vigencias?.historico || '--'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* { ubicación topográfica } */}
            <div className="p-5 rounded-2xl bg-[#7A152E]/5 border border-[#7A152E]/10 space-y-4">
               <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#7A152E]" />
                  <h4 className="text-[10px] font-black text-[#7A152E] uppercase tracking-[0.2em]">Ubicación Topográfica</h4>
               </div>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { l: 'Sección', v: localRecord.ubicacion_seccion },
                    { l: 'Batería', v: localRecord.ubicacion_bateria },
                    { l: 'Módulo', v: localRecord.ubicacion_modulo },
                    { l: 'Entrepaño', v: localRecord.ubicacion_entrepaño },
                    { l: 'No. de Caja (identificador)', v: localRecord.ubicacion_caja }
                  ].map((ub, i) => (
                    <div key={i} className={`text-center ${i === 4 ? 'col-span-2 lg:col-span-4 mt-2' : ''}`}>
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">{ub.l}</p>
                        <p className={`text-[10px] font-bold text-slate-700 bg-white py-1.5 rounded-lg border border-gray-100 shadow-sm ${i === 4 ? 'text-[#7A152E] border-[#7A152E]/20' : ''}`}>{ub.v || '--'}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* { listado de documentos integrados } */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#7A152E]/10 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#7A152E] rounded-lg text-white">
                            <Layers size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">Composición Documental</h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        <span className="text-[9px] font-black text-[#7A152E]">{localRecord.documentos?.length || 0}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Docs</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-100">
                                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Folio Sist.</th>
                                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Núm. Oficio</th>
                                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest w-[10%]">Fecha</th>
                                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Asunto</th>
                                <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest w-[20%] text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {localRecord.documentos && localRecord.documentos.length > 0 ? (
                                localRecord.documentos.map((doc, idx) => (
                                <tr 
                                    key={doc.id} 
                                    className="hover:bg-[#7A152E]/5 transition-colors group cursor-pointer"
                                    onClick={() => handleViewDocument(doc)}
                                >
                                        <td className="px-3 py-3">
                                            <span className="text-[9px] font-black text-[#7A152E]">{doc.folio_sistema}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-[9px] font-bold text-slate-700">{doc.num_oficio || 'S/N'}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[9px] font-bold text-slate-600 uppercase">{doc.fecha}</td>
                                        <td className="px-3 py-3 max-w-[200px]">
                                            <p className="text-[9px] text-slate-600 font-bold leading-tight italic uppercase break-words" title={doc.asunto}>
                                                "{doc.asunto}"
                                            </p>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          {isSubsanacionMode ? (
                                            <button 
                                              onClick={(e) => handleExtraerDocumento(e, doc)}
                                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                              title="Extraer por Error de Archivado"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          ) : (
                                            <button className="p-1.5 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                              <Eye size={14} />
                                            </button>
                                          )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-gray-300">
                                        <p className="text-[9px] font-black uppercase tracking-widest">Sin documentos integrados</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-gray-100 transition-all shadow-sm active:scale-95">Cerrar Consulta</button>
          </div>

          <CorrespondenciaView 
            isOpen={isDocViewOpen}
            onClose={() => setIsDocViewOpen(false)}
            record={selectedDoc}
          />
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default ExpedienteView;