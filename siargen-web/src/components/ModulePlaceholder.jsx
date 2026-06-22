import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ModulePlaceholder = ({ title, subtitle, icon: Icon }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-8 bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 relative"
      >
        <div className="absolute -top-4 -right-4 bg-[#BC955B] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          En Desarrollo
        </div>
        {Icon && <Icon size={64} className="text-[#7A152E]" />}
      </motion.div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{title}</h2>
        <p className="text-gray-500 font-medium leading-relaxed">
          {subtitle || 'Este módulo está siendo refactorizado para cumplir con los nuevos estándares de gestión documental y seguridad del ISEM.'}
        </p>
      </div>

      <div className="flex items-center gap-3 text-[#7A152E]">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando con el nuevo Core</span>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-12">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              className="h-full bg-gradient-to-r from-[#7A152E] to-[#BC955B]"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModulePlaceholder;
