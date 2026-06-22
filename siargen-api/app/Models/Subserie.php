<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subserie extends Model
{
    use HasFactory;

    protected $table = 'subseries';

    protected $fillable = [
        'serie_id',
        'codigo',
        'nombre',
        'descripcion',
        'valor_administrativo',
        'valor_legal',
        'valor_fiscal_contable',
        'vigencia_tramite',
        'vigencia_concentracion',
        'disposicion_final',
        'metros_lineales',
        'edificio_sede',
        'area_resguardo'
    ];

    protected $casts = [
        'valor_administrativo' => 'boolean',
        'valor_legal' => 'boolean',
        'valor_fiscal_contable' => 'boolean',
        'vigencia_tramite' => 'integer',
        'vigencia_concentracion' => 'integer',
        'metros_lineales' => 'float'
    ];

    public function serie()
    {
        return $this->belongsTo(SerieDocumental::class, 'serie_id');
    }

    public function expedientes()
    {
        return $this->hasMany(Expediente::class, 'subserie_id');
    }
}
