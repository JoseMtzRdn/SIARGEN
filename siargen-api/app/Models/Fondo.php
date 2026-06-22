<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fondo extends Model
{
    use HasFactory;

    protected $table = 'fondos';
    protected $fillable = ['codigo', 'nombre'];

    public function secciones()
    {
        return $this->hasMany(Seccion::class);
    }

    public function setCodigoAttribute($value)
    {
        $this->attributes['codigo'] = mb_strtoupper($value, 'UTF-8');
    }
}
