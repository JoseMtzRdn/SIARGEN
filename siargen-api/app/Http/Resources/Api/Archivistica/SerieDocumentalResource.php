<?php

namespace App\Http\Resources\Api\Archivistica;

use Illuminate\Http\Resources\Json\JsonResource;

class SerieDocumentalResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'seccion_id' => $this->seccion_id,
            'seccion' => new SeccionResource($this->whenLoaded('seccion')),
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'valor_administrativo' => (bool)$this->valor_administrativo,
            'valor_legal' => (bool)$this->valor_legal,
            'valor_fiscal_contable' => (bool)$this->valor_fiscal_contable,
            'vigencia_tramite' => $this->vigencia_tramite,
            'vigencia_concentracion' => $this->vigencia_concentracion,
            'disposicion_final' => $this->disposicion_final,
            'metros_lineales' => (float)$this->metros_lineales,
            'edificio_sede' => $this->edificio_sede,
            'area_resguardo' => $this->area_resguardo,
            'subseries_count' => $this->subseries_count ?? 0,
            'expedientes_count' => $this->expedientes_count ?? 0,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
