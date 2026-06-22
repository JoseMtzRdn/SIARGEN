<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CorrespondenciaResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'folio_sistema' => $this->folio_sistema,
            'tipo' => strtolower($this->tipo),
            'num_oficio' => $this->num_oficio,
            'fecha' => $this->fecha->format('Y-m-d'),
            'remitente' => $this->remitente,
            'destinatario' => $this->destinatario,
            'asunto' => $this->asunto,
            'clase_documento' => $this->clase_documento,
            'num_fojas' => $this->num_fojas,
            'fecha_limite_respuesta' => $this->fecha_limite_respuesta ? $this->fecha_limite_respuesta->format('Y-m-d') : null,
            'prioridad' => $this->prioridad,
            'documento_pdf_url' => $this->documento_pdf_path ? Storage::disk('public')->url($this->documento_pdf_path) : null,
            'estatus' => $this->estatus,
            'turnado_a' => $this->unidad_administrativa_id,
            'unidad_administrativa' => new UnidadAdministrativaResource($this->whenLoaded('unidadAdministrativa')),
            'usuario' => new UserResource($this->whenLoaded('usuario')),
            'expediente_id' => $this->expediente_id,
            'expediente' => new ExpedienteResource($this->whenLoaded('expediente')),
            'seccion_id' => $this->seccion_id,
            'seccion' => new Archivistica\SeccionResource($this->whenLoaded('seccion')),
            'serie_id' => $this->serie_id,
            'serie' => new Archivistica\SerieDocumentalResource($this->whenLoaded('serie')),
            'subserie_id' => $this->subserie_id,
            'subserie' => new Archivistica\SubserieResource($this->whenLoaded('subserie')),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
