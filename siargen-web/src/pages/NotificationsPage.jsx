import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Loader2, 
  Trash2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { fetchNotifications, markNotificationAsRead } from '../store/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: notifications, loading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check size={20} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
      case 'danger': return <AlertCircle size={20} className="text-red-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const handleAction = (notif) => {
    if (!notif.read) {
        dispatch(markNotificationAsRead(notif.id));
    }
    if (notif.link) {
        navigate(notif.link);
    }
  };

  return (
    <div className="space-y-8 font-inter pb-20 max-w-5xl mx-auto px-4">
      {/* { header } */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <Bell className="text-[#7A152E]" size={40} />
            Centro de Notificaciones
          </h2>
          <p className="text-gray-500 font-bold mt-2 text-lg text-[#BC955B] uppercase tracking-wider">Historial de alertas y acciones del sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[600px]">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-40 gap-4 text-[#7A152E]">
            <Loader2 className="animate-spin" size={48} />
            <span className="font-black uppercase tracking-widest text-xs">Cargando historial...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-40 text-gray-300">
            <Bell size={64} className="opacity-10 mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">No tienes notificaciones registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-8 flex items-start gap-6 hover:bg-gray-50/50 transition-all cursor-pointer group relative ${!notif.read ? 'bg-[#7A152E]/5' : ''}`}
                onClick={() => handleAction(notif)}
              >
                <div className={`p-4 rounded-2xl bg-white shadow-md shrink-0 border border-gray-100 ${!notif.read ? 'ring-2 ring-[#7A152E]/20' : ''}`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-lg font-black tracking-tight ${!notif.read ? 'text-[#7A152E]' : 'text-slate-700'}`}>
                        {notif.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold uppercase">{formatDate(notif.created_at)}</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 font-medium italic text-sm leading-relaxed">
                    "{notif.message}"
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    {notif.link && (
                        <span className="flex items-center gap-1.5 text-[#BC955B] text-[10px] font-black uppercase tracking-widest hover:underline">
                            Ir al recurso <ArrowRight size={12} />
                        </span>
                    )}
                    {!notif.read && (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCheck size={12} /> Nueva
                        </span>
                    )}
                  </div>
                </div>

                {!notif.read && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#BC955B] rounded-full shadow-lg shadow-[#BC955B]/40"></div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
