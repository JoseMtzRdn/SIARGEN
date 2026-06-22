<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $userId = $this->route('usuario') ?: $this->route('user');

        return [
            'nombre' => 'sometimes|string|max:50|regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/u',
            'apellido_paterno' => 'sometimes|string|max:50|regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/u',
            'apellido_materno' => 'nullable|string|max:50|regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/u',
            'username' => [
                'sometimes',
                'string',
                'min:6',
                'max:25',
                'alpha_dash',
                Rule::unique('users', 'username')->ignore($userId)
            ],
            'email' => [
                'sometimes',
                'email:rfc',
                'regex:/^[a-zA-Z0-9._%+-]{6,30}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                'max:100',
                Rule::unique('users', 'email')->ignore($userId)
            ],
            'password' => 'nullable|string|min:8|max:100',
            'role_id' => 'sometimes|exists:roles,id',
            'unidad_administrativa_id' => [
                'sometimes',
                'nullable',
                Rule::requiredIf(function () {
                    $roleId = $this->input('role_id');
                    if ($roleId) {
                        $role = \App\Models\Role::find($roleId);
                        return $role && !in_array($role->slug, ['admin_ti', 'coord_archivos', 'rac', 'rah']);
                    }
                    return false;
                }),
                'exists:unidades_administrativas,id',
                Rule::exists('unidades_administrativas', 'id')->where('activo', true)
            ],
            'cargo' => 'required|string|max:100',
            'telefono' => 'required|string|size:10|regex:/^[0-9]+$/',
            'extension' => 'nullable|string|max:10|regex:/^[0-9]+$/',
            'activo' => 'sometimes|boolean'
        ];
    }

    public function messages()
    {
        return [
            'telefono.required' => 'El número de teléfono institucional es obligatorio.',
            'telefono.size' => 'El teléfono debe ser exactamente de 10 dígitos.',
            'cargo.required' => 'El cargo o puesto oficial es obligatorio para todos los usuarios.',
            'username.unique' => 'El nombre de usuario ya se encuentra registrado.',
            'username.min' => 'El nombre de usuario debe tener al menos 6 caracteres.',
            'email.unique' => 'El correo electrónico ya está en uso.',
            'email.regex' => 'El correo debe tener entre 6 y 30 caracteres antes del @ y un dominio con extensión válida (ej: .com, .gob.mx).',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.'
        ];
    }
}
