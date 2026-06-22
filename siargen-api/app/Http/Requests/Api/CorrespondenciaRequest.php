<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CorrespondenciaRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'tipo' => 'required|in:ENTRADA,SALIDA',
            'num_oficio' => 'nullable|string|max:50',
            'fecha' => 'required|date|before_or_equal:today',
            'remitente' => 'required_if:tipo,ENTRADA|nullable|string|max:100',
            'destinatario' => 'required_if:tipo,SALIDA|nullable|string|max:100',
            'asunto' => 'required|string|min:10|max:255',
            'clase_documento' => 'required|string|max:50',
            'num_fojas' => 'required|integer|min:1|max:999',
            'prioridad' => 'required|in:baja,media,alta,urgente',
            'turnado_a' => [
                'required',
                'exists:unidades_administrativas,id',
                Rule::exists('unidades_administrativas', 'id')->where('activo', true)
            ],
            'fecha_limite_respuesta' => 'nullable|date|after_or_equal:fecha',
            'seccion_id' => 'nullable|exists:secciones,id',
            'serie_id' => 'nullable|exists:series_documentales,id',
            'subserie_id' => 'nullable|exists:subseries,id',
            'documento_pdf' => 'nullable|file|mimes:pdf|max:10240', // 10MB
            'remover_pdf' => 'nullable|boolean',
        ];
    }

    public function messages()
    {
        return [
            'asunto.min' => 'El asunto debe ser más descriptivo (mínimo 10 caracteres).',
            'asunto.max' => 'El asunto es demasiado largo (máximo 255 caracteres).',
            'num_fojas.integer' => 'El número de fojas debe ser un valor numérico.',
            'fecha.before_or_equal' => 'La fecha no puede ser futura.',
            'fecha_limite_respuesta.after_or_equal' => 'El campo fecha límite respuesta debe ser una fecha posterior o igual a la fecha del documento.',
            'turnado_a.exists' => 'La unidad seleccionada no existe o no está activa.',
            'documento_pdf.mimes' => 'Solo se permiten archivos en formato PDF.',
            'documento_pdf.max' => 'El archivo PDF no debe exceder los 10MB.'
        ];
    }
}
