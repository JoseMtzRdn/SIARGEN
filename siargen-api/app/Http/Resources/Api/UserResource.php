<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'apellido_paterno' => $this->apellido_paterno,
            'apellido_materno' => $this->apellido_materno,
            'nombre_completo' => "{$this->nombre} {$this->apellido_paterno} {$this->apellido_materno}",
            'username' => auth()->user() && auth()->user()->isAdminTi() ? $this->username : '********',
            'email' => $this->email,
            'cargo' => $this->cargo,
            'telefono' => $this->telefono,
            'extension' => $this->extension,
            'activo' => (bool)$this->activo,
            'role' => $this->role ? [
                'id' => $this->role->id,
                'slug' => $this->role->slug,
                'nombre' => $this->role->nombre,
            ] : null,
            'unidad_administrativa' => $this->unidadAdministrativa ? [
                'id' => $this->unidadAdministrativa->id,
                'codigo' => $this->unidadAdministrativa->codigo,
                'nombre' => $this->unidadAdministrativa->nombre,
                'activo' => (bool)$this->unidadAdministrativa->activo,
            ] : null,
            'role_id' => $this->role_id,
            'unidad_administrativa_id' => $this->unidad_administrativa_id,
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
        ];
    }
}
