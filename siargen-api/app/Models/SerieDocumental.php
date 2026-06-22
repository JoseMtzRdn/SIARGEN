<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SerieDocumental extends Model
{
    use HasFactory;

    protected $table = 'series_documentales';

    protected $fillable = [
        'seccion_id',
        'codigo',
        'nombre',
        'descripcion',
        'valor_administrativo',
        'valor_legal',
        'valor_fiscal_contable',
        'vigencia_tramite',
        'vigencia_concentracion',
        'disposicion_final',
        'acceso',
        'metros_lineales',
        'edificio_sede',
        'area_resguardo'
    ];

    protected $casts = [
        'valor_administrativo' => 'boolean',
        'valor_legal' => 'boolean',
        'valor_fiscal_contable' => 'boolean',
        'metros_lineales' => 'float'
    ];

    public function seccion()
    {
        return $this->belongsTo(Seccion::class, 'seccion_id');
    }

    public function subseries()
    {
        return $this->hasMany(Subserie::class, 'serie_id');
    }

    public function expedientes()
    {
        return $this->hasMany(Expediente::class, 'serie_id');
    }

    public function setCodigoAttribute($value)
    {
        $this->attributes['codigo'] = mb_strtoupper($value, 'UTF-8');
    }
}
