<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UnidadAdministrativa extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'unidades_administrativas';

    protected $fillable = [
        'codigo',
        'nombre',
        'direccion',
        'telefono',
        'extension',
        'email',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function titular()
    {
        // Define el TUA activo asignado a la unidad.
        return $this->hasOne(User::class, 'unidad_administrativa_id')
            ->where('activo', true)
            ->whereHas('role', function($query) {
                $query->where('slug', 'tua');
            });
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function setCodigoAttribute($value)
    {
        $this->attributes['codigo'] = mb_strtoupper($value, 'UTF-8');
    }
}
