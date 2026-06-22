<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Archivistica\SerieDocumentalResource;
use App\Http\Resources\Api\Archivistica\SubserieResource;
use App\Http\Resources\Api\CorrespondenciaResource;
use App\Http\Resources\Api\UnidadAdministrativaResource;
use App\Http\Resources\Api\UserResource;

class ExpedienteResource extends JsonResource
{
    public function toArray($request)
    {
        // Resuelve vigencias y valores documentales heredados.
        $fuente = $this->subserie_id ? $this->subserie : $this->serie;

        return [
            'id' => $this->id,
            'unidad_administrativa_id' => $this->unidad_administrativa_id,
            'numero_expediente' => $this->numero_expediente,
            'titulo' => $this->titulo,
            'observaciones' => $this->observaciones,
            'año_apertura' => $this->año_apertura,
            'año_cierre' => $this->año_cierre,
            'ubicacion_seccion' => $this->ubicacion_seccion,
            'ubicacion_bateria' => $this->ubicacion_bateria,
            'ubicacion_modulo' => $this->ubicacion_modulo,
            'ubicacion_entrepaño' => $this->ubicacion_entrepaño,
            'ubicacion_caja' => $this->ubicacion_caja,
            'numero_cajas' => $this->numero_cajas,
            'fase' => $this->fase_label,
            'estado_archivo' => $this->estado_archivo_label,
            'fecha_cierre' => $this->fecha_cierre ? $this->fecha_cierre->format('Y-m-d H:i:s') : null,
            'estatus_disponibilidad' => $this->estatus_disponibilidad_label,
            'is_in_subsanacion' => $this->is_in_subsanacion,
            // Habilita la subsanación si el expediente se encuentra en dicho estado.
            'needs_subsanacion' => (int)$this->estado_archivo === \App\Models\Expediente::STATE_CERRADO_SUBSANACION,
            
            // Indica si el expediente procede de una transferencia rechazada.
            // 
            'belongs_to_rejected_transfer' => $this->is_in_subsanacion,
            
            'minutos_transcurridos' => $this->fecha_cierre ? (int)now()->diffInMinutes($this->fecha_cierre) : 0,
            'vigencia_cumplida' => $this->fase == 1 && ((int)$this->estado_archivo === 2 || (int)$this->estado_archivo === 3) && $this->fecha_cierre && now()->diffInMinutes($this->fecha_cierre) >= ($fuente?->vigencia_tramite ?? 0),
            'valores_documentales' => [
                'administrativo' => $fuente?->valor_administrativo ?? false,
                'legal' => $fuente?->valor_legal ?? false,
                'fiscal' => $fuente?->valor_fiscal_contable ?? false,
                'contable' => $fuente?->valor_fiscal_contable ?? false,
            ],
            'vigencias' => [
                'tramite' => $fuente?->vigencia_tramite ?? 0,
                'concentracion' => $fuente?->vigencia_concentracion ?? 0,
                'total' => ((int)($fuente?->vigencia_tramite ?? 0) + (int)($fuente?->vigencia_concentracion ?? 0)),
                'historico' => ($fuente?->disposicion_final) ? strtoupper($fuente->disposicion_final) : 'BAJA',
            ],
            'clasificacion_informacion' => $this->clasificacion_informacion,
            'documentos_count' => $this->documentos_count ?? ($this->documentos ? $this->documentos->count() : 0),
            'num_fojas' => $this->num_fojas,
            'num_legajos' => $this->num_legajos,
            'serie' => new SerieDocumentalResource($this->whenLoaded('serie')),
            'subserie' => new SubserieResource($this->whenLoaded('subserie')),
            'documentos' => CorrespondenciaResource::collection($this->whenLoaded('documentos')),
            'unidad_administrativa' => new UnidadAdministrativaResource($this->whenLoaded('unidadAdministrativa')),
            'creador' => new UserResource($this->whenLoaded('creador')),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
