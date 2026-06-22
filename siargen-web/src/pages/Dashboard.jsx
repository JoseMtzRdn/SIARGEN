import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Archive, 
  History, 
  Settings, 
  Database,
  ArrowRightLeft,
  Search,
  Users,
  UserCheck,
  Truck,
  FileStack,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = rawUser?.data || rawUser;
  const navigate = useNavigate();

  const getWelcomeMessage = () => {
    const role = user?.role?.slug;
    switch(role) {
      case 'admin_ti': return 'Panel de Control Técnico';
      case 'tua': return 'Gestión de Unidad Administrativa';
      case 'rat': return 'Archivo de Trámite';
      case 'coord_archivos': return 'Control de Instrumentos Normativos';
      case 'rac': return 'Archivo de Concentración';
      case 'rah': return 'Archivo Histórico';
      case 'correspondencia': return 'Control de Correspondencia';
      default: return 'Sistema General de Archivo';
    }
  };

  const getDashboardItems = () => {
    const role = user?.role?.slug;

    // solo para el rac: ordenado como sidebar
    if (role === 'rac') {
      return [
        { title: 'Custodia (Acervo)', desc: 'Gestión física del archivo', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/concentracion/custodia' },
        { title: 'Recepciones / TP', desc: 'Ingreso de nuevos expedientes', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50', path: '/concentracion/recepciones' },
        { title: 'Préstamos (Vales)', desc: 'Control de salidas físicas', icon: ArrowRightLeft, color: 'text-[#7A152E]', bg: 'bg-[#7A152E]/5', path: '/concentracion/prestamos' },
      ];
    }

    // Menú de navegación del Responsable de Archivo de Trámite (RAT).
    if (role === 'rat') {
      return [
        { title: 'Correspondencia', desc: 'Control de entrada y salida', icon: ArrowRightLeft, color: 'text-cyan-600', bg: 'bg-cyan-50', path: '/correspondencia' },
        { title: 'Gestión de Expedientes', desc: 'Apertura y foliado de acervo', icon: FileStack, color: 'text-[#7A152E]', bg: 'bg-[#7A152E]/5', path: '/tramite/expedientes' },
        { title: 'Transferencias', desc: 'Envíos a Concentración', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/tramite/transferencias' },
        { title: 'Préstamos (Vales)', desc: 'Control de salidas en oficina', icon: ArrowRightLeft, color: 'text-[#BC955B]', bg: 'bg-[#BC955B]/5', path: '/tramite/prestamos' },
      ];
    }

    // Coordinador: ordenado como sidebar.
    if (role === 'coord_archivos') {
      return [
        { title: 'Instrumentos de Control', desc: 'Gestión de Jerarquía', icon: Database, color: 'text-amber-600', bg: 'bg-amber-50', path: '/archivistica/series' },
        { title: 'Archivo de Trámite', desc: 'Supervisión de expedientes', icon: FileText, color: 'text-[#7A152E]', bg: 'bg-[#7A152E]/5', path: '/tramite/expedientes' },
        { title: 'Archivo de Concentración', desc: 'Supervisión de acervo', icon: Archive, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/concentracion/custodia' },
        { title: 'Archivo Histórico', desc: 'Supervisión de memoria', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/historico/acervo' },
        { title: 'Validación Técnica', desc: 'Revisiones Normativas', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', path: '/coordinador/revision-transferencias' },
      ];
    }

    const items = [];

    // 1.
    if (role === 'admin_ti') {
      items.push(
        { title: 'Usuarios', desc: 'Gestionar acceso al sistema', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/usuarios' },
        { title: 'Unidades Administrativas', desc: 'Estructura organizacional', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50', path: '/admin/unidades' },
        { title: 'Auditoría', desc: 'Ver traza de actividad', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin/auditoria' }
      );
    }

    if (role === 'tua') {
      items.push(
        { title: 'Usuarios', desc: 'Gestionar acceso al sistema', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/usuarios' },
        { title: 'Autorizaciones TUA', desc: 'Visto Bueno y Firma de Envíos', icon: UserCheck, color: 'text-[#7A152E]', bg: 'bg-[#7A152E]/5', path: '/autorizaciones-tua' },
        { title: 'Archivo de Trámite', desc: 'Consulta de acervo', icon: FileText, color: 'text-[#7A152E]', bg: 'bg-[#7A152E]/5', path: '/tramite/expedientes' },
        { title: 'Archivo de Concentración', desc: 'Supervisión de acervo', icon: Archive, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/concentracion/custodia' },
        { title: 'Archivo Histórico', desc: 'Supervisión de memoria', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/historico/acervo' }
      );
    }

    // Navegación simplificada para perfiles de consulta o correspondencia.
    if (role === 'correspondencia') {
        items.push(
            { title: 'Correspondencia', desc: 'Control de entrada y salida', icon: ArrowRightLeft, color: 'text-cyan-600', bg: 'bg-cyan-50', path: '/correspondencia' },
            { title: 'Archivo de Trámite', desc: 'Consulta de expedientes', icon: FileText, color: 'text-[#7A152E]', bg: 'bg-[#7A152E]/5', path: '/tramite/expedientes' }
        );
    }

    return items;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Bienvenido, <span className="text-[#7A152E]">{user?.nombre || user?.username}</span>
          </h1>
          <p className="text-lg text-[#BC955B] font-bold mt-1 uppercase tracking-wide">
            {getWelcomeMessage()}
          </p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-[1.2rem] shadow-md border border-gray-100 flex items-center gap-3">
           <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
           <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {user?.role?.slug === 'rac' ? 'Ámbito de Custodia' : (user?.role?.slug === 'admin_ti' ? 'Ámbito de Gestión' : (user?.role?.slug === 'coord_archivos' ? 'Ámbito Normativo' : 'Unidad Administrativa'))}
              </p>
              <p className="text-[11px] font-bold text-gray-700 uppercase">
                {user?.role?.slug === 'rac' 
                  ? 'ARCHIVO DE CONCENTRACIÓN' 
                  : (user?.role?.slug === 'admin_ti' 
                      ? 'SOPORTE TÉCNICO Y SISTEMAS' 
                      : (user?.role?.slug === 'coord_archivos' ? 'ÓRGANO RECTOR DE ARCHIVOS' : (user?.unidad_administrativa?.nombre || 'SISTEMA CENTRAL')))
                }
              </p>
           </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      >
        {getDashboardItems().map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              variants={itemAnim}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => navigate(item.path)}
              className="bg-white p-6 rounded-[2rem] shadow-lg shadow-gray-200/40 border border-gray-100 flex flex-col items-start gap-5 group cursor-pointer transition-all"
            >
              <div className={`p-3.5 rounded-xl ${item.bg} ${item.color} group-hover:scale-105 transition-transform`}>
                <Icon size={28} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase leading-tight">{item.title}</h3>
              </div>
              <div className="w-full h-px bg-gray-50 mt-1"></div>
              <div className="flex items-center text-[9px] font-black text-[#7A152E] uppercase tracking-widest gap-2">
                Acceder <ArrowRightLeft size={10} className="rotate-[-45deg]" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {}
      <div className="bg-gradient-to-br from-[#7A152E] to-[#4A0D1C] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
         <div className="relative z-10 max-w-xl">
            <h2 className="text-xl font-black tracking-tight">Ciclo de Vida Documental</h2>
            <p className="mt-2 text-xs text-white/70 font-medium leading-relaxed">
              Recuerde que cada documento registrado debe cumplir con los plazos de conservación establecidos en el CADIDO institucional.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
