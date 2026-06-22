<?php

namespace App\Http\Requests\Api\Archivistica;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubserieRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'serie_id' => 'required|exists:series_documentales,id',
            'codigo' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subseries')->where(fn ($query) => $query->where('serie_id', $this->serie_id)),
                'regex:#^[-a-zA-Z0-9._/]+$#'
            ],
            'nombre' => 'required|string|max:200',
            'descripcion' => 'required|string',
            'valor_administrativo' => 'nullable|boolean',
            'valor_legal' => 'nullable|boolean',
            'valor_fiscal_contable' => 'nullable|boolean',
            'vigencia_tramite' => 'nullable|integer|min:0',
            'vigencia_concentracion' => 'nullable|integer|min:0',
            'disposicion_final' => 'nullable|string|max:20',
            'metros_lineales' => 'nullable|numeric|min:0',
            'edificio_sede' => 'nullable|string|max:100',
            'area_resguardo' => 'nullable|string|max:100',
        ];
    }
}
