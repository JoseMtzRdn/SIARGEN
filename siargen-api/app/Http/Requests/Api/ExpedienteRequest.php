<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpedienteRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $user = auth()->user();
        $isRat = $user && $user->isRat();

        return [
            'serie_id' => 'required|exists:series_documentales,id',
            'subserie_id' => 'nullable|exists:subseries,id',
            'titulo' => 'required|string|min:5|max:200',
            'observaciones' => 'nullable|string|max:500',
            'año_apertura' => 'required|integer|min:1900|max:'.date('Y'),
            'ubicacion_seccion' => ($isRat ? 'required' : 'nullable') . '|string|max:50',
            'ubicacion_bateria' => ($isRat ? 'required' : 'nullable') . '|string|max:50',
            'ubicacion_modulo' => ($isRat ? 'required' : 'nullable') . '|string|max:50',
            'ubicacion_entrepaño' => ($isRat ? 'required' : 'nullable') . '|string|max:50',
            'ubicacion_caja' => 'required|string|max:100',
            'numero_cajas' => 'required|integer|min:1',
            'clasificacion_informacion' => 'required|in:publica,reservada,confidencial,Publico,Reservado,Confidencial',
        ];
    }

    public function messages()
    {
        return [
            'titulo.min' => 'El título del expediente debe tener al menos 5 caracteres.',
            'titulo.max' => 'El título es demasiado largo.',
            'año_apertura.max' => 'El año de apertura no puede ser superior al año actual.',
            'clasificacion_informacion.in' => 'La clasificación de información seleccionada no es válida.',
            'ubicacion_seccion.required' => 'La ubicación (Sección) es obligatoria.',
            'ubicacion_bateria.required' => 'La ubicación (Batería) es obligatoria.',
            'ubicacion_modulo.required' => 'La ubicación (Módulo) es obligatoria.',
            'ubicacion_entrepaño.required' => 'La ubicación (Entrepaño) es obligatoria.',
            'numero_cajas.min' => 'El número de cajas debe ser al menos 1.',
            'numero_cajas.required' => 'El número de cajas es obligatorio.',
        ];
    }
}
