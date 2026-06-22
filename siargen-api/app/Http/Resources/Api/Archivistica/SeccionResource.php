<?php

namespace App\Http\Resources\Api\Archivistica;

use Illuminate\Http\Resources\Json\JsonResource;

class SeccionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'fondo_id' => $this->fondo_id,
            'fondo' => new FondoResource($this->whenLoaded('fondo')),
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'series_count' => $this->whenCounted('series'),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
