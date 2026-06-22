<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials)
    {
        $user = User::where('username', $credentials['username'])
                    ->orWhere('email', $credentials['username'])
                    ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        if (!$user->activo) {
            throw ValidationException::withMessages([
                'username' => ['Esta cuenta se encuentra desactivada.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user->load('role', 'unidadAdministrativa'),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function logout(User $user)
    {
        $user->tokens()->delete();
    }
}
