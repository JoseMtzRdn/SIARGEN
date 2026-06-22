<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class UnidadAdministrativaResource extends JsonResource
{
    public function toArray($request)
    {
        $titular = $this->titular;
        
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'titular_id' => $titular ? $titular->id : null,
            'titular_nombre' => $titular ? "{$titular->nombre} {$titular->apellido_paterno} {$titular->apellido_materno}" : 'NO ASIGNADO',
            'direccion' => $this->direccion,
            'telefono' => $this->telefono,
            'extension' => $this->extension,
            'email' => $this->email,
            'activo' => (bool)$this->activo,
            'personal' => UserResource::collection($this->whenLoaded('users')),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
