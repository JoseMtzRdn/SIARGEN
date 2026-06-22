<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\ExpedienteResource;

class PrestamoDetalleResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'expediente' => new ExpedienteResource($this->whenLoaded('expediente')),
            'estatus' => $this->estatus,
            'estado_salida' => $this->estado_salida,
            'estado_devolucion' => $this->estado_devolucion,
            'fecha_devolucion' => $this->fecha_devolucion?->format('Y-m-d H:i'),
            'observaciones_devolucion' => $this->observaciones_devolucion,
        ];
    }
}
