import Swal from 'sweetalert2';

// Servicio de gestión de alertas institucionales.

const baseConfig = {
    background: '#ffffff',
    customClass: {
        popup: 'rounded-[3rem] shadow-2xl border-none',
        title: 'text-2xl py-10',
        confirmButton: 'bg-gradient-to-r from-[#7A152E] to-[#4A0D1C] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all border-none outline-none focus:ring-0',
        cancelButton: 'bg-gray-100 text-gray-400 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all border-none outline-none focus:ring-0',
        actions: 'gap-4 pb-6',
        container: 'z-[20001]' 
    },
    buttonsStyling: false,
    showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
    },
    hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
    }
};

// Traduce mensajes técnicos (como SQLSTATE o red) a mensajes amigables.
const getFriendlyMessage = (text) => {
    if (!text) return 'Ocurrió un error inesperado en el sistema';
    const message = String(text);
    
    // errores de sqlstate específicos (códigos ansi sql)
    if (message.includes('SQLSTATE[22003]')) {
        return 'Uno de los valores numéricos ingresados es demasiado grande para el sistema. Por favor, verifique las cantidades.';
    }
    if (message.includes('SQLSTATE[23000]')) {
        return 'Error de integridad: El registro ya existe o está vinculado a otros datos que impiden esta acción.';
    }
    if (message.includes('SQLSTATE[HY000]')) {
        return 'Error de procesamiento: Los datos no pudieron ser guardados correctamente en la base de datos.';
    }
    if (message.includes('SQLSTATE')) {
        return 'Error técnico de base de datos. Por favor, verifique la información o contacte a soporte.';
    }
    
    // errores de red / servidor
    if (message.includes('Network Error') || message.includes('ECONNREFUSED')) {
        return 'No hay conexión con el servidor. Verifique su acceso a internet.';
    }
    if (message.includes('timeout') || message.includes('exceeded')) {
        return 'El servidor tardó demasiado en responder. Por favor, intente de nuevo.';
    }
    if (message.includes('404')) {
        return 'El recurso solicitado no fue encontrado en el servidor.';
    }
    if (message.includes('403') || message.includes('unauthorized')) {
        return 'No tiene permisos suficientes para realizar esta acción.';
    }

    // Valida y formatea el mensaje de error antes de su visualización.
    return message;
};

export const alerts = {
    getFriendlyMessage, // exportamos para uso directo si es necesario
    
    success: (text, title = '¡ÉXITO!') => {
        return Swal.fire({
            ...baseConfig,
            icon: 'success',
            iconColor: '#7A152E',
            title: `<span class="font-black uppercase text-[#7A152E] tracking-tighter">${title}</span>`,
            text: String(text || '').toUpperCase(),
            timer: 2500,
            showConfirmButton: false,
        });
    },

    error: (text, title = 'ERROR') => {
        const friendlyMessage = getFriendlyMessage(text);
        return Swal.fire({
            ...baseConfig,
            icon: 'error',
            iconColor: '#ef4444',
            title: `<span class="font-black uppercase text-[#ef4444] tracking-tighter">${title}</span>`,
            text: friendlyMessage.toUpperCase(),
            confirmButtonText: 'ENTENDIDO',
            showConfirmButton: true,
        });
    },

    validation: (errors, title = 'ERRORES DE VALIDACIÓN') => {
        const errorList = Array.isArray(errors) 
            ? errors.join('<br/>• ') 
            : (typeof errors === 'object' ? Object.values(errors).flat().join('<br/>• ') : errors);

        return Swal.fire({
            ...baseConfig,
            icon: 'error',
            iconColor: '#7A152E',
            title: `<span class="font-black uppercase text-[#7A152E] tracking-tighter">${title}</span>`,
            html: `<div class="text-left text-[11px] font-bold uppercase text-slate-600 mt-4 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner max-h-[300px] overflow-y-auto">• ${errorList}</div>`,
            confirmButtonText: 'CORREGIR DATOS',
            showConfirmButton: true,
        });
    },

    warning: (text, title = 'ATENCIÓN') => {
        return Swal.fire({
            ...baseConfig,
            icon: 'warning',
            iconColor: '#f59e0b',
            title: `<span class="font-black uppercase text-[#f59e0b] tracking-tighter">${title}</span>`,
            text: String(text || '').toUpperCase(),
            confirmButtonText: 'CONTINUAR',
            showConfirmButton: true,
        });
    },

    confirm: async (text, title = '¿ESTÁ SEGURO?', confirmText = 'SÍ, PROCEDER') => {
        return Swal.fire({
            ...baseConfig,
            icon: 'question',
            iconColor: '#7A152E',
            title: `<span class="font-black uppercase text-[#7A152E] tracking-tighter">${title}</span>`,
            text: String(text || '').toUpperCase(),
            showCancelButton: true,
            confirmButtonText: confirmText.toUpperCase(),
            cancelButtonText: 'CANCELAR',
            reverseButtons: true
        });
    },

    confirmWithInput: async (text, title, inputPlaceholder, confirmText = 'CONFIRMAR') => {
        return Swal.fire({
            ...baseConfig,
            icon: 'warning',
            iconColor: '#7A152E',
            title: `<span class="font-black uppercase text-[#7A152E] tracking-tighter">${title}</span>`,
            text: String(text || '').toUpperCase(),
            input: 'textarea',
            inputPlaceholder: inputPlaceholder.toUpperCase(),
            showCancelButton: true,
            confirmButtonText: confirmText.toUpperCase(),
            cancelButtonText: 'CANCELAR',
            reverseButtons: true,
            inputValidator: (value) => {
                if (!value) return 'EL MOTIVO ES OBLIGATORIO';
                if (value.length < 10) return 'EL MOTIVO DEBE TENER AL MENOS 10 CARACTERES';
            },
            customClass: {
                ...baseConfig.customClass,
                input: 'rounded-[1.5rem] border-2 border-slate-100 focus:border-[#7A152E] outline-none text-sm font-bold uppercase p-4 custom-scrollbar'
            }
        });
    }
};
