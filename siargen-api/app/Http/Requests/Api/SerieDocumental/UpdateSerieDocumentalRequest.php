<?php

namespace App\Http\Requests\Api\SerieDocumental;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSerieDocumentalRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        // Obtiene el identificador de la serie desde la ruta.
        $serieId = $this->route('series') ?: $this->route('serie');
        
        // Resuelve el identificador en caso de Route Model Binding.
        if (is_object($serieId)) {
            $serieId = $serieId->id;
        }
        
        $seccionId = $this->input('seccion_id');

        return [
            'seccion_id' => 'required|exists:secciones,id',
            'codigo' => [
                'required',
                'string',
                'max:100',
                Rule::unique('series_documentales')
                    ->where(fn ($query) => $query->where('seccion_id', $seccionId))
                    ->ignore($serieId), // Excluye el registro actual en la validación de unicidad.
                'regex:#^[-a-zA-Z0-9._/]+$#'
            ],
            'nombre' => 'required|string|max:80',
            'descripcion' => 'required|string|max:1000',
            'valor_administrativo' => 'boolean',
            'valor_legal' => 'boolean',
            'valor_fiscal_contable' => 'boolean',
            'vigencia_tramite' => 'required|integer|min:1',
            'vigencia_concentracion' => 'required|integer|min:1',
            'disposicion_final' => ['required', Rule::in(['Baja', 'Historico', 'Muestreo'])],
            'metros_lineales' => 'nullable|numeric|min:0',
            'edificio_sede' => 'nullable|string|max:100',
            'area_resguardo' => 'nullable|string|max:100',
        ];
    }

    public function messages()
    {
        return [
            'seccion_id.required' => 'La sección superior es obligatoria.',
            'seccion_id.exists' => 'La sección seleccionada no es válida.',
            'codigo.required' => 'El código es obligatorio.',
            'codigo.unique' => 'Este código ya existe dentro de la sección seleccionada.',
            'codigo.regex' => 'El código no debe contener acentos ni espacios (solo letras, números, puntos, guiones y guiones bajos).',
            'nombre.required' => 'El nombre de la serie es obligatorio.',
            'vigencia_tramite.required' => 'La vigencia en trámite es obligatoria.',
            'vigencia_tramite.min' => 'La vigencia en trámite debe ser de al menos 1 año.',
            'vigencia_concentracion.required' => 'La vigencia en concentración es obligatoria.',
            'vigencia_concentracion.min' => 'La vigencia en concentración debe ser de al menos 1 año.',
        ];
    }
}
