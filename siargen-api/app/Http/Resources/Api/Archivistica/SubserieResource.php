<?php

namespace App\Http\Resources\Api\Archivistica;

use Illuminate\Http\Resources\Json\JsonResource;

class SubserieResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'serie_id' => $this->serie_id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'valor_administrativo' => (bool)$this->valor_administrativo,
            'valor_legal' => (bool)$this->valor_legal,
            'valor_fiscal_contable' => (bool)$this->valor_fiscal_contable,
            'vigencia_tramite' => (int)$this->vigencia_tramite,
            'vigencia_concentracion' => (int)$this->vigencia_concentracion,
            'disposicion_final' => $this->disposicion_final,
            'metros_lineales' => (float)$this->metros_lineales,
            'edificio_sede' => $this->edificio_sede,
            'area_resguardo' => $this->area_resguardo,
            'expedientes_count' => $this->expedientes_count ?? 0,
            'serie' => new SerieDocumentalResource($this->whenLoaded('serie')),
        ];
    }
}
