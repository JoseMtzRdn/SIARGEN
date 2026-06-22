<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnidadAdministrativaRequest extends FormRequest
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
                'max:10',
                'regex:#^[-a-zA-Z0-9._/]+$#', // Permite letras, números, puntos, guiones y barras. Sin Ñ, acentos ni espacios.
                'unique:unidades_administrativas,codigo'
            ],
            'nombre' => 'required|string|max:100|unique:unidades_administrativas,nombre',
            'email' => [
                'required',
                'email:rfc',
                'regex:/^[a-zA-Z0-9._%+-]{6,30}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                'max:100',
                'unique:unidades_administrativas,email'
            ],
            'telefono' => 'required|string|size:10|regex:/^[0-9]+$/',
            'extension' => 'nullable|string|max:10',
            'direccion' => 'nullable|string|max:255',
            'titular_nombre' => 'nullable|string|max:150',
            'activo' => 'boolean'
        ];
    }

    public function messages()
    {
        return [
            'codigo.unique' => 'El código de la unidad ya está en uso.',
            'codigo.regex' => 'El código solo puede contener letras (sin Ñ ni acentos), números, guiones, guiones bajos, puntos y diagonales.',
            'nombre.unique' => 'Ya existe una unidad con este nombre.',
            'email.unique' => 'El correo electrónico ya está registrado para otra unidad.',
            'email.regex' => 'El correo debe tener entre 6 y 30 caracteres y un dominio con extensión válida.',
        ];
    }
}
