<?php

namespace App\Http\Requests\Api\Seccion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSeccionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'fondo_id' => 'required|exists:fondos,id',
            'codigo' => [
                'required',
                'string',
                'max:100',
                Rule::unique('secciones')->where(fn ($query) => $query->where('fondo_id', $this->fondo_id)),
                'regex:#^[-a-zA-Z0-9._/]+$#'
            ],
            'nombre' => 'required|string|max:80',
        ];
    }

    public function messages()
    {
        return [
            'fondo_id.required' => 'El fondo superior es obligatorio.',
            'fondo_id.exists' => 'El fondo seleccionado no es válido.',
            'codigo.required' => 'El código es obligatorio.',
            'codigo.unique' => 'Este código ya existe dentro del fondo seleccionado.',
            'codigo.regex' => 'El código no debe contener acentos ni espacios (solo letras, números, puntos, guiones y guiones bajos).',
            'nombre.required' => 'El nombre es obligatorio.',
        ];
    }
}
