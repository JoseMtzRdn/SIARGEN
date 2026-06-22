import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Loader2, ShieldCheck, FileText, PenTool, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const CAROUSEL_IMAGES = [
  "/assets/carousel_1.avif",
  "/assets/carousel_2.avif",
  "/assets/carousel_3.avif",
  "/assets/carousel_4.avif"
];

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#050608] overflow-hidden relative selection:bg-[#BC955B] selection:text-white">
      
      <header className="w-full h-20 bg-[#7A152E] z-[110] flex items-center justify-between px-8 lg:px-14 shadow-2xl border-b border-white/10 shrink-0">
         <div className="flex items-center">
            <img src="/assets/logos_isem_dark.png" alt="Logos Institucionales" className="h-14 w-auto drop-shadow-sm" />
         </div>
         <div className="hidden md:block">
            <p className="text-[18px] font-black text-white tracking-[0.2em] drop-shadow-sm">Sistema de Archivo General</p>
         </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 3 }}
            src="/assets/bg_archivo.jpg" 
            alt="Archivo ISEM" 
            className="w-full h-full object-cover brightness-90 saturate-[0.8]"
          />
          
          <div className="absolute inset-0 bg-gradient-to-tr from-[#7A152E]/40 via-transparent to-[#BC955B]/20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(122,21,46,0.4)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(188,149,91,0.3)_0%,transparent_50%)]"></div>

          <motion.div 
            animate={{ x: [-150, 150, -150], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 left-1/3 w-[2px] h-[150%] bg-gradient-to-b from-transparent via-[#BC955B] to-transparent blur-[80px] rotate-[25deg] pointer-events-none"
          />
          <motion.div 
            animate={{ x: [150, -150, 150], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-1/4 right-1/3 w-[2px] h-[150%] bg-gradient-to-b from-transparent via-[#7A152E] to-transparent blur-[80px] rotate-[-25deg] pointer-events-none"
          />

          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-black"></div>
        </div>

        <div className="absolute inset-0 z-[100] pointer-events-none overflow-visible flex items-center justify-center">
          <div className="relative w-full max-w-[1100px] h-[580px]">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotateY: [0, 360],
                rotateZ: [-5, 5, -5]
              }}
              transition={{ 
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
                rotateZ: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -left-12 bottom-8 hidden xl:block"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-[#BC955B]/20 blur-[80px] rounded-full scale-150 opacity-60"></div>
                
                <div className="relative w-44 h-60 bg-gradient-to-br from-[#BC955B] via-[#A6844A] to-[#7A152E] rounded-tr-[4rem] rounded-bl-2xl rounded-tl-2xl rounded-br-2xl border-4 border-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-10">
                   <FileText className="text-white opacity-95 mb-6 drop-shadow-2xl" size={56} strokeWidth={1} />
                   <div className="w-full space-y-3 opacity-30">
                      <div className="h-1 w-full bg-white rounded-full"></div>
                      <div className="h-1 w-[80%] bg-white rounded-full"></div>
                      <div className="h-1 w-[90%] bg-white rounded-full"></div>
                   </div>
                </div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-50px] pointer-events-none"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-2 border-[#BC955B]/50 transform rotate-12">
                    <PenTool size={20} className="text-[#7A152E]" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 w-full max-w-[1000px] flex h-[580px] bg-white rounded-[3rem] shadow-[0_80px_150px_rgba(0,0,0,0.6)] overflow-hidden mx-6 border border-white/40"
        >
          
          {/* { left: branding & image carousel } */}
          <div className="hidden lg:flex w-[40%] bg-[#0a0a0a] relative flex-col justify-between overflow-hidden border-r border-slate-100">
             <div className="absolute inset-0 z-0">
               <AnimatePresence mode="wait">
                 <motion.img
                   key={currentSlide}
                   initial={{ opacity: 0, scale: 1.1 }}
                   animate={{ opacity: 0.4, scale: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 1.5 }}
                   src={CAROUSEL_IMAGES[currentSlide]}
                   alt="Carousel"
                   className="w-full h-full object-cover"
                 />
               </AnimatePresence>
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
             </div>

             <div className="relative z-10 p-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex gap-2 mb-6">
                     {CAROUSEL_IMAGES.map((_, i) => (
                       <div key={i} className={`h-1 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-[#BC955B]' : 'w-2 bg-white/20'}`}></div>
                     ))}
                  </div>
                  
                  <h1 className="text-[40px] font-black text-white tracking-tighter leading-[1.1] mb-4">
                    Sistema de <br />
                    Archivo <span className="text-[#7A152E]">General</span>
                  </h1>
                  <div className="h-1.5 w-16 bg-[#7A152E] rounded-full mb-6"></div>
                  
                  <p className="text-base font-serif font-medium text-white/95 mt-6 tracking-wide border-l-[3px] border-[#BC955B] pl-5 leading-relaxed drop-shadow-sm">
                    Instituto de Salud <br/> del Estado de México
                  </p>
                </div>
             </div>
          </div>

          {/* { right: form } */}
          <div className="w-full lg:w-[60%] bg-white flex flex-col p-10 lg:p-14 justify-center relative overflow-hidden">

            <div className="relative z-10 max-w-[340px] mx-auto w-full">
               <div className="mb-10 text-left">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Inicio de sesión</h2>
                  <div className="h-1 w-12 bg-[#7A152E] mt-4"></div>
               </div>

               <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                 <div className="space-y-1">
                   {/* { input: usuario } */}
                   <div className="group">
                      <label className="text-xs font-black text-slate-500 tracking-[0.05em] ml-1 transition-colors group-focus-within:text-[#7A152E]">Usuario</label>
                      <div className="relative mt-1">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.username ? 'text-red-500' : 'text-slate-400 group-focus-within:text-[#7A152E]'}`}>
                          <User size={18} strokeWidth={2.5} />
                        </div>
                        <input
                          type="text"
                          {...register('username', { required: "El identificador es obligatorio" })}
                          className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl focus:ring-4 outline-none transition-all text-sm tracking-widest text-slate-800 placeholder:text-slate-300 ${errors.username ? 'border-red-500 focus:ring-red-500/5' : 'border-slate-100 focus:ring-[#7A152E]/5 focus:border-[#7A152E] focus:bg-white'}`}
                          placeholder="Identificador"
                        />
                      </div>
                      <div className="min-h-[18px] mt-0.5 ml-2">
                        {errors.username && (
                          <p className="text-[9px] font-bold text-red-500 tracking-wide flex items-center gap-1">
                             {errors.username.message}
                          </p>
                        )}
                      </div>
                   </div>

                   {/* { input: contraseña } */}
                   <div className="group">
                      <div className="px-1 flex justify-between items-center">
                        <label className="text-xs font-black text-slate-500 tracking-[0.05em] transition-colors group-focus-within:text-[#7A152E]">Contraseña</label>
                      </div>
                      <div className="relative mt-1">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.password ? 'text-red-500' : 'text-slate-400 group-focus-within:text-[#7A152E]'}`}>
                          <Lock size={18} strokeWidth={2.5} />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register('password', { required: "La contraseña es obligatoria" })}
                          className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 rounded-2xl focus:ring-4 outline-none transition-all text-sm tracking-widest text-slate-800 placeholder:text-slate-300 ${errors.password ? 'border-red-500 focus:ring-red-500/5' : 'border-slate-100 focus:ring-[#7A152E]/5 focus:border-[#7A152E] focus:bg-white'}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#7A152E] transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="flex justify-between items-start min-h-[18px] mt-0.5 px-1">
                        <div className="ml-1">
                          {errors.password && (
                            <p className="text-[9px] font-bold text-red-500 tracking-wide flex items-center gap-1">
                               {errors.password.message}
                            </p>
                          )}
                        </div>
                        <button type="button" className="text-[9px] font-black text-[#7A152E] hover:text-[#BC955B] transition-colors tracking-wide shrink-0">
                          ¿Olvidó su contraseña?
                        </button>
                      </div>
                   </div>
                 </div>

                 {/* { mensaje de error del sistema - reducido a 40px } */}
                 <div className="min-h-[40px] flex items-center">
                   <AnimatePresence mode="wait">
                     {error && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.98 }} 
                         animate={{ opacity: 1, scale: 1 }} 
                         exit={{ opacity: 0, scale: 0.98 }}
                         className="bg-red-50 text-red-700 p-2.5 rounded-xl text-[10px] font-black border-l-4 border-red-500 w-full shadow-sm tracking-wide"
                       >
                          <span>{error}</span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#7A152E] hover:bg-[#5E1024] text-white py-[16px] rounded-xl font-black text-sm flex items-center justify-center gap-4 transition-all shadow-[0_15px_40px_rgba(122,21,46,0.3)] transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 tracking-wide group/btn"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : "Ingresar"}
                    </button>
                 </div>
               </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LoginPage;
