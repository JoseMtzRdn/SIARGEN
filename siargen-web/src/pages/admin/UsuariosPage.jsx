import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Search, 
  User as UserIcon, 
  Mail, 
  Building, 
  Shield, 
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  ShieldCheck,
  ChevronDown,
  FileText
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import UsuarioForm from '../../components/admin/UsuarioForm';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchUsers, 
  fetchRoles, 
  toggleUserStatus 
} from '../../store/userSlice';
import { fetchUnidadesCatalog, invalidateUnidadesCache, fetchUnidades } from '../../store/unidadSlice';

const UsuariosPage = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { items: users, loading, pagination, roles, rolesLoading, lastFetch } = useSelector((state) => state.users);
  const { catalog: unidades, catalogLoading } = useSelector((state) => state.unidades);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // estados para filtros, ordenamiento
  const [filters, setFilters] = useState({
    role_id: '',
    unidad_administrativa_id: '',
    activo: '',
  });

  const [sort, setSort] = useState({
    by: 'nombre',
    order: 'asc'
  });

  const isTua = currentUser?.role?.slug === 'tua';
  const isAdminTi = currentUser?.role?.slug === 'admin_ti';

  const fetchData = useCallback(async (search = '', activeFilters = filters, activeSort = sort, force = false) => {
    // usamos per_page: -1 para obtener todos los registros
    dispatch(fetchUsers({
      search,
      role_id: activeFilters.role_id,
      unidad_administrativa_id: isTua ? currentUser.unidad_administrativa_id : activeFilters.unidad_administrativa_id,
      activo: activeFilters.activo,
      sort_by: activeSort.by,
      sort_order: activeSort.order,
      per_page: -1
    }));
  }, [dispatch, filters, sort, isTua, currentUser]);

  useEffect(() => {
    if (roles.length === 0) dispatch(fetchRoles());
    
    // cargamos el catálogo de unidades (solo una vez o según lógica de roles)
    if (isTua) {
      if (unidades.length === 0) dispatch(fetchUnidadesCatalog());
    } else if (isAdminTi) {
      dispatch(fetchUnidadesCatalog());
    }
  }, [dispatch, isTua, isAdminTi]);

  useEffect(() => {
    // solo hacemos el primer fetch de usuarios si no hay datos
    if (!lastFetch) {
      fetchData();
    }
  }, [fetchData, lastFetch]);

  // debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(searchTerm, filters, sort);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters, sort, fetchData]);

  const handleEdit = (user) => {
    setEditingUser(user);
    // aseguramos que el catálogo de unidades esté cargado al editar
    if (unidades.length === 0) {
      dispatch(fetchUnidadesCatalog());
    }
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    // aseguramos que el catálogo de unidades esté cargado al crear
    if (unidades.length === 0) {
      dispatch(fetchUnidadesCatalog());
    }
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    const isActivating = !user.activo;
    const result = await Swal.fire({
      title: isActivating ? '¿Reactivar Acceso?' : '¿Revocar Acceso?',
      text: isActivating 
        ? "El usuario podrá ingresar nuevamente al sistema con sus permisos actuales." 
        : "El usuario perderá el acceso inmediato al sistema hasta que sea reactivado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isActivating ? '#BC955B' : '#7A152E',
      confirmButtonText: isActivating ? 'Sí, reactivar' : 'Sí, revocar acceso',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(toggleUserStatus(user.id)).unwrap();
        
        // sincronización proactiva: invalidamos y forzamos recarga de unidades
        dispatch(invalidateUnidadesCache());
        dispatch(fetchUnidades({ per_page: -1 }));
        
        Swal.fire({
          icon: 'success',
          title: `<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡${isActivating ? 'Activado' : 'Revocado'}!</span>`,
          text: isActivating ? 'El usuario ha sido habilitado correctamente.' : 'El acceso ha sido suspendido correctamente.',
          iconColor: '#7A152E',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
          }
        });
      } catch (error) {
        Swal.fire('Error', error || 'Error al procesar el cambio de estado', 'error');
      }
    }
  };

  const clearFilters = () => {
    setFilters({ role_id: '', unidad_administrativa_id: '', activo: '' });
    setSearchTerm('');
  };

  const handleGenerarNombramiento = async (user) => {
    try {
      const roleLabels = {
        'rat': 'Responsable de Archivo de Tramite',
        'correspondencia': 'Responsable de Correspondencia'
      };
      const label = roleLabels[user.role?.slug] || 'Nombramiento';

      Swal.fire({
        title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">Procesando</span>',
        text: `Generando nombramiento de ${label}...`,
        icon: 'info',
        iconColor: '#7A152E',
        allowOutsideClick: false,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-[3rem] shadow-2xl border-none',
          title: 'text-2xl pt-10',
        },
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await api.post(`/usuarios/${user.id}/generar-nombramiento`, {}, { 
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Nombramiento - ${label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">¡Documento Listo!</span>',
        text: 'El nombramiento se ha descargado correctamente.',
        iconColor: '#7A152E',
        timer: 3000,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-[3rem] shadow-2xl border-none',
          title: 'text-2xl py-10',
        }
      });
    } catch (error) {
      console.error('Error al generar nombramiento:', error);
      Swal.fire({
        icon: 'error',
        title: '<span class="font-black tracking-tighter text-red-600 uppercase">Error</span>',
        text: 'No se pudo generar el documento. Verifique los datos del usuario.',
        confirmButtonColor: '#7A152E',
        background: '#ffffff',
        customClass: {
          popup: 'rounded-[3rem] shadow-2xl border-none',
          title: 'text-2xl py-10',
        }
      });
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <ShieldCheck className="text-[#7A152E]" size={40} />
            Gestión de Usuarios
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">
            {isTua ? `Usuarios de la Unidad: ${currentUser?.unidad_administrativa?.nombre}` : 'Control de identidades y privilegios del ISEM'}
          </p>
        </div>
        {isAdminTi && (
          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] hover:shadow-2xl text-white px-10 py-5 rounded-[1.5rem] flex items-center gap-3 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-lg"
          >
            <Plus size={20} /> Nuevo Usuario
          </button>
        )}
      </div>

      {/* { barra de búsqueda y filtros } */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
        {/* { fila de búsqueda } */}
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A152E] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo electrónico..."
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[#7A152E]/20 focus:ring-8 focus:ring-[#7A152E]/5 outline-none transition-all font-bold text-gray-700 text-lg shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* { fila de filtros } */}
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter size={16} className="text-[#BC955B]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por:</span>
           </div>

           <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                className="w-full pl-10 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white focus:border-[#BC955B]/30 transition-all appearance-none cursor-pointer"
                value={filters.role_id}
                onChange={(e) => setFilters({...filters, role_id: e.target.value})}
              >
                <option value="">Todos los Roles</option>
                {roles
                  .filter(r => !isTua || ['rat', 'correspondencia'].includes(r.slug))
                  .map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)
                }
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
           </div>

           {isAdminTi && (
             <div className="relative min-w-[220px] flex-1 sm:flex-none">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  className="w-full pl-10 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white focus:border-[#BC955B]/30 transition-all appearance-none cursor-pointer"
                  value={filters.unidad_administrativa_id}
                  onChange={(e) => setFilters({...filters, unidad_administrativa_id: e.target.value})}
                  disabled={catalogLoading}
                >
                  <option value="">{catalogLoading ? 'Cargando unidades...' : 'Todas las Unidades'}</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
             </div>
           )}

           {!isTua && (
             <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <RefreshCcw className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  className="w-full pl-10 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-xs text-gray-600 outline-none focus:bg-white focus:border-[#BC955B]/30 transition-all appearance-none cursor-pointer"
                  value={filters.activo}
                  onChange={(e) => setFilters({...filters, activo: e.target.value})}
                >
                  <option value="">Todos los Estatus</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
             </div>
           )}

           {(searchTerm || filters.role_id || filters.unidad_administrativa_id || filters.activo) && (
             <button 
               onClick={clearFilters}
               className="flex items-center gap-2 px-6 py-4 text-red-500 font-bold text-xs bg-red-50 hover:bg-red-100 rounded-2xl transition-all active:scale-95 group"
               title="Limpiar Filtros"
             >
               <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
               Limpiar
             </button>
           )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-40 flex flex-col items-center gap-6 text-[#7A152E]">
            <Loader2 className="animate-spin" size={64} />
            <span className="font-black uppercase tracking-[0.3em] text-sm">Sincronizando Usuarios...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[35%]">Identidad</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[20%]">Rol y Sistema</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] w-[30%]">Adscripción</th>
                    <th className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center w-[15%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <UserIcon size={48} className="opacity-20" />
                          <p className="font-black uppercase tracking-widest text-xs">No se encontraron usuarios con estos filtros</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-10 py-8 max-w-0">
                          <div className="flex items-center gap-5">
                            <div className="relative group/avatar shrink-0">
                              <div className="absolute -inset-1 bg-gradient-to-tr from-[#7A152E] to-[#BC955B] rounded-full blur opacity-10 group-hover/avatar:opacity-20 transition duration-500"></div>
                              <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
                                <UserIcon size={24} className="relative z-10 text-[#7A152E]/70" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p 
                                  className="text-base font-black text-slate-800 tracking-tight leading-tight truncate"
                                  title={`${u.nombre} ${u.apellido_paterno} ${u.apellido_materno}`}
                                >
                                  {u.nombre} {u.apellido_paterno} {u.apellido_materno}
                                </p>
                                {!u.activo && (
                                  <span className="bg-red-50 text-red-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-red-100 tracking-widest shrink-0 uppercase">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <p 
                                className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-2 tracking-widest bg-slate-50 w-fit px-2 py-0.5 rounded-md truncate max-w-full"
                                title={u.email}
                              >
                                 <Mail size={11} className="shrink-0 text-[#7A152E]/50" /> 
                                 <span className="truncate">{u.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 max-w-0">
                          <div className="flex flex-col gap-2 min-w-0">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all w-fit max-w-full ${u.activo ? 'bg-[#7A152E]/5 border-[#7A152E]/10' : 'bg-gray-50 border-gray-100'}`}>
                              <Shield size={12} className={u.activo ? 'text-[#7A152E]' : 'text-gray-300'} />
                              <span className={`text-[9px] font-black tracking-wider leading-tight ${u.activo ? 'text-[#7A152E]' : 'text-gray-400'}`}>
                                {u.role?.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-1">
                              <span className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase">
                                ACCESO: <span className="text-[#BC955B] normal-case">{u.username}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 max-w-0">
                          <div className="flex flex-col gap-1 min-w-0">
                             {u.unidad_administrativa ? (
                               <div className="flex items-center gap-2 text-gray-600">
                                  <Building size={14} className={`shrink-0 ${u.activo ? '' : 'text-gray-300'}`} />
                                  <p className={`text-[11px] font-bold truncate ${u.activo ? '' : 'text-gray-400'}`} title={u.unidad_administrativa?.nombre}>
                                    {u.unidad_administrativa?.nombre}
                                  </p>
                               </div>
                             ) : (
                               <div className="flex items-center gap-2">
                                  <span className="bg-amber-50 text-amber-700 text-[8px] font-black px-3 py-1 rounded-full border border-amber-100 tracking-[0.15em] uppercase">
                                    Usuario del sistema
                                  </span>
                               </div>
                             )}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            {isAdminTi && (
                                <>
                                    <button 
                                    disabled={Number(u.id) === Number(currentUser?.id) || !u.activo}
                                    onClick={() => handleEdit(u)} 
                                    className={`p-4 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all ${
                                        Number(u.id) === Number(currentUser?.id) || !u.activo
                                        ? 'opacity-20 cursor-not-allowed grayscale'
                                        : 'text-[#BC955B] hover:bg-[#BC955B] hover:text-white active:scale-90'
                                    }`}
                                    title={
                                        Number(u.id) === Number(currentUser?.id) 
                                        ? 'No puedes editar tu propio perfil desde aquí' 
                                        : !u.activo 
                                            ? 'Debes reactivar al usuario para editarlo' 
                                            : 'Editar Datos'
                                    }
                                    >
                                    <Edit2 size={20} />
                                    </button>
                                    
                                    <button 
                                    disabled={Number(u.id) === Number(currentUser?.id) || (u.unidad_administrativa && !u.unidad_administrativa.activo)}
                                    onClick={() => handleToggleStatus(u)} 
                                    className={`p-4 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all ${
                                        Number(u.id) === Number(currentUser?.id) || (u.unidad_administrativa && !u.unidad_administrativa.activo)
                                        ? 'opacity-20 cursor-not-allowed grayscale' 
                                        : 'active:scale-90 ' + (u.activo ? 'text-red-400 hover:bg-red-500 hover:text-white' : 'text-green-500 hover:bg-green-600 hover:text-white')
                                    }`}
                                    title={
                                        Number(u.id) === Number(currentUser?.id) 
                                        ? 'No puedes desactivar tu propia cuenta' 
                                        : (u.unidad_administrativa && !u.unidad_administrativa.activo)
                                            ? `No se puede operar: la unidad '${u.unidad_administrativa.nombre}' está inactiva.`
                                            : (u.activo ? 'Desactivar Usuario' : 'Activar Usuario')
                                    }
                                    >
                                    {u.activo ? <Trash2 size={20} /> : <RefreshCcw size={20} />}
                                    </button>
                                </>
                            )}
                            {isTua && (u.role?.slug === 'rat' || u.role?.slug === 'correspondencia') && (
                                <button 
                                  disabled={!u.activo}
                                  onClick={() => handleGenerarNombramiento(u)} 
                                  className={`p-4 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all ${
                                    !u.activo 
                                      ? 'opacity-20 cursor-not-allowed grayscale' 
                                      : 'text-[#7A152E] hover:bg-[#7A152E] hover:text-white active:scale-90'
                                  }`}
                                  title={u.activo ? "Generar Nombramiento" : "No se puede generar nombramiento de un usuario inactivo"}
                                >
                                  <FileText size={20} />
                                </button>
                            )}
                            {!isAdminTi && !isTua && (
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Sólo Lectura</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* { footer con total } */}
            <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Total de usuarios: <span className="text-[#7A152E] font-black">{users.length}</span>
              </p>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                <ShieldCheck size={12} className="text-[#BC955B]" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Control de Acceso Centralizado</span>
              </div>
            </div>
          </>
        )}
      </div>

      <UsuarioForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData(searchTerm, filters, sort);
          // sincronización proactiva al crear/editar
          dispatch(invalidateUnidadesCache());
          dispatch(fetchUnidades({ per_page: -1 }));
        }}
        user={editingUser}
        roles={roles}
        unidades={unidades}
        catalogsLoading={rolesLoading || catalogLoading}
      />
    </div>
  );
};

export default UsuariosPage;
