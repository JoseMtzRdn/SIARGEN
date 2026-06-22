import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../store/authSlice';
import { checkVigencias } from '../store/transferenciaSlice';
import { checkVigenciasPrestamos } from '../store/prestamoSlice';
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Settings,
  Database,
  Users,
  ShieldCheck,
  ChevronDown,
  ArrowRightLeft,
  FileText,
  Archive,
  History,
  Search,
  LayoutDashboard,
  UserCheck,
  Shield,
  AlertCircle,
  Truck,
  FileStack,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from '../components/NotificationDropdown';

// matriz de permisos estricta (según requerimiento)

const MENU_ITEMS = [
  { 
    name: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/', 
    roles: ['admin_ti', 'tua', 'rat', 'coord_archivos', 'rac', 'rah', 'correspondencia', 'consulta'] 
  },
  { 
    name: 'Usuarios', 
    icon: Users, 
    path: '/usuarios', 
    roles: ['admin_ti', 'tua'] 
  },
  {
    name: 'Autorizaciones',
    icon: UserCheck,
    path: '/autorizaciones-tua',
    roles: ['tua']
  },
  { 
    name: 'Unidades Administrativas', 
    icon: Settings, 
    path: '/admin/unidades', 
    roles: ['admin_ti'] 
  },
  { 
    name: 'Configuración Archivística', 
    icon: Database, 
    roles: ['coord_archivos'],
    submenu: [
      { name: 'Fondos', path: '/archivistica/fondos' },
      { name: 'Secciones', path: '/archivistica/secciones' },
      { name: 'Series', path: '/archivistica/series' },
      { name: 'Subseries', path: '/archivistica/subseries' },
    ]
  },
  { 
    name: 'Correspondencia', 
    icon: ArrowRightLeft, 
    path: '/correspondencia', 
    roles: ['correspondencia', 'rat'] 
  },
  { 
    name: 'Archivo de Trámite', 
    icon: FileText, 
    roles: ['rat', 'tua', 'coord_archivos', 'correspondencia'],
    badge: 'transferencias',
    submenu: [
      { name: 'Expedientes', path: '/tramite/expedientes', roles: ['rat', 'tua', 'coord_archivos', 'correspondencia'] },
      { name: 'Transferencias', path: '/tramite/transferencias', roles: ['rat', 'tua', 'coord_archivos'] },
      { name: 'Préstamos (Vales)', path: '/tramite/prestamos', roles: ['rat', 'tua', 'coord_archivos'] },
    ]
  },
  { 
    name: 'Archivo de Concentración', 
    icon: Archive, 
    roles: ['rac', 'tua', 'coord_archivos'],
    badge: 'prestamos',
    submenu: [
      { name: 'Custodia (Acervo)', path: '/concentracion/custodia', roles: ['rac', 'tua', 'coord_archivos'] },
      { name: 'Recepciones / TP', path: '/concentracion/recepciones', roles: ['rac'] },
      { name: 'Préstamos (Vales)', path: '/concentracion/prestamos', roles: ['rac', 'rat', 'tua', 'coord_archivos'] },
    ]
  },
  { 
    name: 'Archivo Histórico', 
    icon: History, 
    path: '/historico/acervo', 
    roles: ['rah', 'tua', 'coord_archivos'] 
  },
  { 
    name: 'Consultas y Préstamos', 
    icon: Search, 
    path: '/consultas', 
    roles: ['consulta', 'rat', 'rah'] 
  },
  { 
    name: 'Auditoría', 
    icon: Shield, 
    path: '/admin/auditoria', 
    roles: ['admin_ti'] 
  },
  {
    name: 'Validación Técnica',
    icon: ShieldCheck,
    path: '/coordinador/revision-transferencias',
    roles: ['coord_archivos']
  },
];

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const { vencidosCount: transferenciasVencidas } = useSelector((state) => state.transferencias);
  const { vencidosCount: prestamosVencidos } = useSelector((state) => state.prestamos);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  const userRole = user?.role?.slug || '';

  // Consulta periódica de alertas pendientes.
  useEffect(() => {
    if (!user) return;

    let timeoutId;

    const runChecks = () => {
      // evitar llamadas superpuestas
      if (userRole === 'rat' || userRole === 'coord_archivos') {
        dispatch(checkVigencias());
      }
      if (userRole === 'rac' || userRole === 'coord_archivos' || userRole === 'admin_ti') {
        dispatch(checkVigenciasPrestamos());
      }
      
      // programar la siguiente llamada a los 30s
      timeoutId = setTimeout(runChecks, 30000); 
    };

    // Retrasa el inicio del ciclo de consultas al montar.
    timeoutId = setTimeout(runChecks, 2000);

    return () => clearTimeout(timeoutId);
  }, [dispatch, userRole]); // Evita re-renderizados ante actualizaciones de estado.

  const initialSubmenu = MENU_ITEMS.find(item => 
    item.submenu?.some(sub => location.pathname === sub.path)
  )?.name || null;

  const [openSubmenu, setOpenSubmenu] = useState(initialSubmenu);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const filteredMenu = useMemo(() => {
    const rawMenu = MENU_ITEMS.filter(item => {
      // filtrar por roles
      if (!item.roles?.includes(userRole)) return false;
      // restricción específica para el rat: no consultas y préstamos
      if (userRole === 'rat' && item.name === 'Consultas y Préstamos') return false;
      return true;
    });
    
    // solo para el rac o rat: aplanar menús específicos
    if (userRole === 'rac' || userRole === 'rat') {
      const flattenedMenu = [];
      rawMenu.forEach(item => {
        // lógica para el rac (archivo de concentración)
        if (userRole === 'rac' && item.name === 'Archivo de Concentración' && item.submenu) {
          item.submenu.forEach(sub => {
            if (!sub.roles || sub.roles.includes('rac')) {
               let Icon = Archive;
               if (sub.name.includes('Custodia')) Icon = Database;
               if (sub.name.includes('Recepciones')) Icon = Truck;
               if (sub.name.includes('Préstamos')) Icon = ArrowRightLeft;

               flattenedMenu.push({
                 name: sub.name,
                 icon: Icon,
                 path: sub.path,
                 roles: ['rac'],
                 badge: sub.path.includes('prestamos') ? 'prestamos' : null
               });
            }
          });
        } 
        // lógica para el rat (archivo de trámite)
        else if (userRole === 'rat' && item.name === 'Archivo de Trámite' && item.submenu) {
          item.submenu.forEach(sub => {
            if (!sub.roles || sub.roles.includes('rat')) {
               let Icon = FileText;
               if (sub.name.includes('Expedientes')) Icon = FileStack;
               if (sub.name.includes('Transferencias')) Icon = Send;
               if (sub.name.includes('Préstamos')) Icon = ArrowRightLeft;

               flattenedMenu.push({
                 name: sub.name,
                 icon: Icon,
                 path: sub.path,
                 roles: ['rat'],
                 badge: sub.path.includes('prestamos') ? 'prestamos' : null
               });
            }
          });
        }
        else {
          flattenedMenu.push(item);
        }
      });
      return flattenedMenu;
    }

    return rawMenu;
  }, [userRole]);

  const toggleSubmenu = (name) => {
    if (openSubmenu === name) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(name);
      if (!isSidebarExpanded) setIsSidebarExpanded(true);
    }
  };

  const getBadgeCount = (badgeType) => {
    if (badgeType === 'transferencias') return transferenciasVencidas;
    if (badgeType === 'prestamos') return prestamosVencidos;
    return 0;
  };

  const getContextLabel = () => {
    switch(userRole) {
      case 'admin_ti': return { label: 'Administración del Sistema', color: 'bg-slate-500' };
      case 'coord_archivos': return { label: 'Coordinación de Archivos', color: 'bg-amber-500' };
      case 'rac': return { label: 'Archivo de Concentración', color: 'bg-indigo-500' };
      case 'rah': return { label: 'Archivo Histórico', color: 'bg-emerald-500' };
      case 'rat': 
      case 'tua': 
      case 'correspondencia': return { label: 'Archivo de Trámite', color: 'bg-[#7A152E]' };
      case 'consulta': return { label: 'Módulo de Consulta', color: 'bg-sky-500' };
      default: return { label: 'Sistema General de Archivo', color: 'bg-gray-400' };
    }
  };

  const context = getContextLabel();

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-inter overflow-hidden">
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarExpanded ? '260px' : '70px' }}
        className="bg-[#7A152E] text-white flex flex-col shadow-2xl z-30 relative border-r border-white/5"
      >
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-24 bg-white text-[#7A152E] rounded-full p-1.5 shadow-lg hover:bg-gray-50 transition-colors z-40 border border-gray-200"
        >
          {isSidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="h-24 flex flex-col items-center justify-center border-b border-white/10 bg-black/20 px-4 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#7A152E] font-black shadow-lg shrink-0 border border-white/20">
              {user?.nombre?.charAt(0) || user?.username?.charAt(0) || '?'}
            </div>
            {isSidebarExpanded && (
              <div className="leading-tight overflow-hidden">
                <p className="text-xs font-black truncate uppercase tracking-tight text-white">
                  {user?.nombre ? `${user.nombre} ${user.apellido_paterno || ''} ${user.apellido_materno || ''}` : (user?.username || 'Usuario')}
                </p>
                <p className="text-[9px] text-[#BC955B] font-bold uppercase tracking-widest truncate mt-0.5">
                  {user?.role?.nombre || 'Perfil'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* { indicador de fase del sistema (sección simplificada) } */}
        {isSidebarExpanded && (
          <div className="px-4 mt-6">
            <div className="flex items-center justify-center gap-3 bg-black/20 py-2.5 rounded-xl border border-white/5 shadow-inner backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.6)]"></div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {context.label}
              </span>
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = !!item.submenu;
            const isSubmenuOpen = openSubmenu === item.name;
            const isActive = location.pathname === item.path || (hasSubmenu && item.submenu.some(s => location.pathname === s.path));
            const badgeCount = getBadgeCount(item.badge);

            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => hasSubmenu ? toggleSubmenu(item.name) : navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-white text-[#7A152E] shadow-xl shadow-black/20' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {isSidebarExpanded && (
                    <span className="text-xs font-bold tracking-wide truncate flex-1 text-left">{item.name}</span>
                  )}
                  
                  {badgeCount > 0 && (
                    <div className={`flex items-center justify-center ${isSidebarExpanded ? 'bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black' : 'absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[#7A152E] animate-pulse'}`}>
                      {isSidebarExpanded ? `${badgeCount} ALERTA` : ''}
                    </div>
                  )}

                  {isSidebarExpanded && hasSubmenu && (
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                <AnimatePresence>
                  {isSidebarExpanded && hasSubmenu && isSubmenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-10 space-y-1 overflow-hidden"
                    >
                      {item.submenu
                        .filter(sub => !sub.roles || sub.roles.includes(userRole))
                        .map((sub) => (
                        <button
                          key={sub.name}
                          onClick={() => navigate(sub.path)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between
                            ${location.pathname === sub.path 
                              ? 'text-white bg-white/10' 
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                          {sub.name}
                          {sub.path === '/tramite/expedientes' && transferenciasVencidas > 0 && (
                            <AlertCircle size={10} className="text-amber-500 animate-pulse" />
                          )}
                          {sub.path === '/concentracion/prestamos' && prestamosVencidos > 0 && (
                            <AlertCircle size={10} className="text-amber-500 animate-pulse" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5 bg-black/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-red-100
              ${!isSidebarExpanded && 'justify-center'}`}
          >
            <LogOut size={18} className="shrink-0" />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-[#7A152E] border-b border-white/10 flex items-center justify-between px-8 z-20 shadow-xl shrink-0">
          <div className="flex items-center gap-6">
            <img src="/assets/logos_isem_dark.png" alt="Logos Institucionales" className="h-12 w-auto drop-shadow-sm" />
          </div>

          <div className="flex items-center gap-6">
            <p className="hidden lg:block text-[15px] font-black text-white tracking-[0.15em] drop-shadow-sm border-r border-white/20 pr-6 mr-2">
              Sistema De Archivo General
            </p>
            
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <button className="p-2.5 bg-white/10 text-white/80 rounded-xl hover:text-white hover:bg-white/20 transition-all border border-white/5">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-[#F9FAFB] custom-scrollbar">
           <div className="max-w-[1600px] mx-auto">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3 }}
             >
                {children}
             </motion.div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
