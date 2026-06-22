import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check, Info, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchNotifications, markNotificationAsRead } from '../store/notificationSlice';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // formateador de fecha nativo de js (reemplaza date-fns)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    dispatch(fetchNotifications());
    // aumentar intervalo a 60 segundos para evitar error 429 (too many requests)
    const interval = setInterval(() => dispatch(fetchNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check size={14} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'danger': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-white/10 text-white/80 rounded-xl hover:text-white hover:bg-white/20 transition-all relative group border border-white/5"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#BC955B] rounded-full border-2 border-[#7A152E] animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#7A152E]">Notificaciones</h4>
              <span className="bg-[#7A152E]/10 text-[#7A152E] px-2 py-0.5 rounded-lg text-[9px] font-black">{unreadCount} Pendientes</span>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="p-10 flex flex-col items-center gap-3 text-slate-300">
                  <Loader2 className="animate-spin" size={24} />
                  <p className="text-[9px] font-black uppercase">Cargando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Bell className="mx-auto mb-2 opacity-20" size={32} />
                  <p className="text-[10px] font-bold uppercase">Sin notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${!notif.read ? 'bg-[#7A152E]/5' : ''}`}
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg bg-white shadow-sm shrink-0 h-fit`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-black text-slate-800 leading-tight mb-1 truncate">{notif.title}</p>
                          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 italic">"{notif.message}"</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase mt-2">{formatDate(notif.created_at)}</p>
                        </div>
                        {!notif.read && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#BC955B] rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
               <button 
                onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                className="text-[9px] font-black text-[#7A152E] uppercase tracking-widest hover:underline"
               >
                Ver todas
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
