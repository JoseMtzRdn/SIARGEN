<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class TransferenciaResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'numero_transferencia' => $this->numero_transferencia,
            'tipo' => $this->tipo,
            'unidad_origen_id' => $this->unidad_origen_id,
            'unidad_origen' => [
                'id' => $this->unidadOrigen?->id,
                'codigo' => $this->unidadOrigen?->codigo ?? 'N/A',
                'nombre' => $this->unidadOrigen?->nombre ?? 'Unidad No Encontrada',
            ],
            'usuario_envia_id' => $this->usuario_envia_id,
            'usuario_envia' => $this->usuarioEnvia ? [
                'id' => $this->usuarioEnvia->id,
                'nombre' => $this->usuarioEnvia->nombre,
                'apellido_paterno' => $this->usuarioEnvia->apellido_paterno,
                'apellido_materno' => $this->usuarioEnvia->apellido_materno,
            ] : null,
            'usuario_recibe_id' => $this->usuario_recibe_id,
            'usuario_recibe' => $this->usuarioRecibe ? [
                'id' => $this->usuarioRecibe->id,
                'nombre' => $this->usuarioRecibe->nombre,
                'apellido_paterno' => $this->usuarioRecibe->apellido_paterno,
                'apellido_materno' => $this->usuarioRecibe->apellido_materno,
            ] : null,
            'estatus' => $this->estatus,
            'fecha_envio' => $this->fecha_envio,
            'fecha_recepcion' => $this->fecha_recepcion,
            'fecha_autorización_tua' => $this->fecha_autorización_tua,
            'fecha_validacion' => $this->fecha_validacion,
            'usuario_tua_id' => $this->usuario_tua_id,
            'usuario_valida_id' => $this->usuario_valida_id,
            'observaciones' => $this->observaciones,
            'motivo_rechazo' => $this->motivo_rechazo,
            'expedientes' => ExpedienteResource::collection($this->whenLoaded('expedientes')),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
