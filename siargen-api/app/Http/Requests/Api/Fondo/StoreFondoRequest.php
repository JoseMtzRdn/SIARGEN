<?php

namespace App\Http\Requests\Api\Fondo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFondoRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'codigo' => [
                'required',
                'string',
                'max:100',
                'unique:fondos,codigo',
                'regex:#^[-a-zA-Z0-9._/]+$#'
            ],
            'nombre' => 'required|string|max:80',
        ];
    }

    public function messages()
    {
        return [
            'codigo.required' => 'El código del fondo es obligatorio.',
            'codigo.unique' => 'Este código de fondo ya se encuentra registrado.',
            'codigo.regex' => 'El código no debe contener acentos ni espacios (solo letras, números, puntos, guiones y guiones bajos).',
            'nombre.required' => 'El nombre del fondo es obligatorio.',
        ];
    }
}
