<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\IsolateByUnidad;

class Prestamo extends Model
{
    use HasFactory, SoftDeletes, IsolateByUnidad;

    protected $fillable = [
        'folio_prestamo',
        'fase',
        'unidad_administrativa_id',
        'usuario_presta_id',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'cargo_solicitante',
        'unidad_solicitante',
        'telefono',
        'extension',
        'fecha_prestamo',
        'fecha_vencimiento',
        'fecha_devolucion',
        'estatus',
        'observaciones'
    ];

    protected $casts = [
        'fecha_prestamo' => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'fecha_devolucion' => 'datetime',
    ];

    // Formateadores de atributos (Title Case).
    public function setNombreAttribute($value) { $this->attributes['nombre'] = mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'); }
    public function setApellidoPaternoAttribute($value) { $this->attributes['apellido_paterno'] = mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'); }
    public function setApellidoMaternoAttribute($value) { $this->attributes['apellido_materno'] = mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'); }
    public function setCargoSolicitanteAttribute($value) { $this->attributes['cargo_solicitante'] = mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'); }
    public function setUnidadSolicitanteAttribute($value) { $this->attributes['unidad_solicitante'] = mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'); }

    // accesores
    public function getNombreCompletoAttribute()
    {
        return trim("{$this->nombre} {$this->apellido_paterno} {$this->apellido_materno}");
    }

    public function detalles()
    {
        return $this->hasMany(PrestamoDetalle::class);
    }

    public function expedientes()
    {
        return $this->belongsToMany(Expediente::class, 'prestamo_detalles');
    }

    public function unidadAdministrativa()
    {
        return $this->belongsTo(UnidadAdministrativa::class);
    }

    public function usuarioPresta()
    {
        return $this->belongsTo(User::class, 'usuario_presta_id');
    }
}
