<?php

namespace App\Http\Requests\Api\Archivistica;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubserieRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {

        $subserieId = $this->route('subseries') ?: $this->route('subserie');
        
        // Si el parámetro de ruta es el objeto del modelo, extraemos el id
        if (is_object($subserieId)) {
            $subserieId = $subserieId->id;
        }

        $serieId = $this->input('serie_id');

        return [
            'serie_id' => 'required|exists:series_documentales,id',
            'codigo' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subseries')
                    ->where(fn ($query) => $query->where('serie_id', $serieId))
                    ->ignore($subserieId), // Ignorar el registro actual correctamente
                'regex:#^[-a-zA-Z0-9._/]+$#'
            ],
            'nombre' => 'required|string|max:200',
            'descripcion' => 'required|string',
            'valor_administrativo' => 'nullable|boolean',
            'valor_legal' => 'nullable|boolean',
            'valor_fiscal_contable' => 'nullable|boolean',
            'vigencia_tramite' => 'nullable|integer|min:1',
            'vigencia_concentracion' => 'nullable|integer|min:1',
            'disposicion_final' => 'nullable|string|max:20',
            'metros_lineales' => 'nullable|numeric|min:0',
            'edificio_sede' => 'nullable|string|max:100',
            'area_resguardo' => 'nullable|string|max:100',
        ];
    }
}
