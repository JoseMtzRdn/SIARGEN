<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nombre' => 'required|string|max:50|regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/u',
            'apellido_paterno' => 'required|string|max:50|regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/u',
            'apellido_materno' => 'nullable|string|max:50|regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/u',
            'username' => [
                'required',
                'string',
                'min:6',
                'max:25',
                'alpha_dash',
                'unique:users,username'
            ],
            'email' => [
                'required',
                'email:rfc',
                'regex:/^[a-zA-Z0-9._%+-]{6,30}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                'max:100',
                'unique:users,email'
            ],
            'password' => 'required|string|min:8|max:100',
            'role_id' => 'required|exists:roles,id',
            'unidad_administrativa_id' => [
                'nullable',
                Rule::requiredIf(function () {
                    $roleId = $this->input('role_id');
                    if (!$roleId) return false;
                    $role = \App\Models\Role::find($roleId);
                    // Requiere unidad administrativa si el rol no es global.
                    return $role && !in_array($role->slug, ['admin_ti', 'coord_archivos', 'rac', 'rah']);
                }),
                'exists:unidades_administrativas,id',
                Rule::exists('unidades_administrativas', 'id')->where('activo', true)
            ],
            'cargo' => 'required|string|max:100',
            'telefono' => 'required|string|size:10|regex:/^[0-9]+$/',
            'extension' => 'nullable|string|max:10|regex:/^[0-9]+$/',
        ];
    }

    public function messages()
    {
        return [
            'telefono.required' => 'El número de teléfono institucional es obligatorio.',
            'telefono.size' => 'El teléfono debe ser exactamente de 10 dígitos.',
            'telefono.regex' => 'El teléfono solo puede contener números.',
            'cargo.required' => 'El cargo o puesto oficial es obligatorio para todos los usuarios.',
            'username.unique' => 'El nombre de usuario ya se encuentra registrado.',
            'username.min' => 'El nombre de usuario debe tener al menos 6 caracteres.',
            'username.alpha_dash' => 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.',
            'email.unique' => 'El correo electrónico ya está en uso.',
            'email.regex' => 'El correo debe tener entre 6 y 30 caracteres antes del @ y un dominio con extensión válida (ej: .com, .gob.mx).',
            'email.max' => 'El correo no puede exceder los 100 caracteres.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'unidad_administrativa_id.exists' => 'La unidad seleccionada no existe o no está activa.'
        ];
    }
}
