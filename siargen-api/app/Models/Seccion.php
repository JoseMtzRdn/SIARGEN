<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seccion extends Model
{
    use HasFactory;

    protected $table = 'secciones';
    protected $fillable = ['fondo_id', 'codigo', 'nombre', 'descripcion'];

    public function fondo()
    {
        return $this->belongsTo(Fondo::class, 'fondo_id');
    }

    public function series()
    {
        return $this->hasMany(SerieDocumental::class, 'seccion_id');
    }

    public function setCodigoAttribute($value)
    {
        $this->attributes['codigo'] = mb_strtoupper($value, 'UTF-8');
    }
}
