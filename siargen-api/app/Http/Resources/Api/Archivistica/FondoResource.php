<?php

namespace App\Http\Resources\Api\Archivistica;

use Illuminate\Http\Resources\Json\JsonResource;

class FondoResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'secciones_count' => $this->whenCounted('secciones'),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
