<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnidadAdministrativaRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        // Obtiene el identificador de la unidad desde los parámetros de ruta.
        $unidadId = $this->route('unidades_administrativa') 
                 ?: $this->route('unidad_administrativa') 
                 ?: $this->route('id');
        
        // Si el parámetro es un objeto (Route Model Binding), obtenemos su ID
        if (is_object($unidadId)) {
            $unidadId = $unidadId->id;
        }

        return [
            'codigo' => [
                'sometimes',
                'string',
                'max:10',
                'regex:#^[-a-zA-Z0-9._/]+$#',
                Rule::unique('unidades_administrativas', 'codigo')->ignore($unidadId)
            ],
            'nombre' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('unidades_administrativas', 'nombre')->ignore($unidadId)
            ],
            'email' => [
                'sometimes',
                'email:rfc',
                'regex:/^[a-zA-Z0-9._%+-]{6,30}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                'max:100',
                Rule::unique('unidades_administrativas', 'email')->ignore($unidadId)
            ],
            'telefono' => 'sometimes|string|size:10|regex:/^[0-9]+$/',
            'extension' => 'nullable|string|max:10',
            'direccion' => 'nullable|string|max:255',
            'titular_nombre' => 'nullable|string|max:150',
            'activo' => 'sometimes|boolean'
        ];
    }

    public function messages()
    {
        return [
            'codigo.unique' => 'El código de la unidad ya está en uso.',
            'codigo.regex' => 'El código solo puede contener letras (sin Ñ ni acentos), números, guiones, guiones bajos, puntos y diagonales.',
            'nombre.unique' => 'Ya existe una unidad con este nombre.',
            'email.unique' => 'El correo electrónico ya está registrado.',
            'email.regex' => 'El correo debe tener entre 6 y 30 caracteres y un dominio con extensión válida.',
        ];
    }
}
