<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\UnidadAdministrativaResource;
use App\Http\Resources\Api\UserResource;
use App\Http\Resources\Api\PrestamoDetalleResource;
use App\Http\Resources\Api\ExpedienteResource;

class PrestamoResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'folio_prestamo' => $this->folio_prestamo,
            'fase' => $this->fase,
            'unidad_administrativa' => new UnidadAdministrativaResource($this->whenLoaded('unidadAdministrativa')),
            'usuario_presta' => new UserResource($this->whenLoaded('usuarioPresta')),
            'nombre' => $this->nombre,
            'apellido_paterno' => $this->apellido_paterno,
            'apellido_materno' => $this->apellido_materno,
            'nombre_completo' => $this->nombre_completo,
            'cargo_solicitante' => $this->cargo_solicitante,
            'unidad_solicitante' => $this->unidad_solicitante,
            'telefono' => $this->telefono,
            'extension' => $this->extension,
            'fecha_prestamo' => $this->fecha_prestamo?->format('Y-m-d H:i'),
            'fecha_vencimiento' => $this->fecha_vencimiento?->format('Y-m-d H:i'),
            'fecha_devolucion' => $this->fecha_devolucion?->format('Y-m-d H:i'),
            'estatus' => $this->estatus,
            'observaciones' => $this->observaciones,
            'vencido' => $this->estatus === 'prestado' && now()->isAfter($this->fecha_vencimiento),
            'detalles' => PrestamoDetalleResource::collection($this->whenLoaded('detalles')),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
