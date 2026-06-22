<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transferencia extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'numero_transferencia',
        'tipo',
        'unidad_origen_id',
        'usuario_envia_id',
        'usuario_tua_id',
        'usuario_valida_id',
        'usuario_recibe_id',
        'estatus',
        'fecha_envio',
        'fecha_recepcion',
        'fecha_autorización_tua',
        'fecha_validacion',
        'observaciones',
        'motivo_rechazo',
        'archivo_inventario_path'
    ];

    protected $casts = [
        'fecha_envio' => 'datetime',
        'fecha_recepcion' => 'datetime',
        'fecha_autorización_tua' => 'datetime',
        'fecha_validacion' => 'datetime',
    ];

    public function setTipoAttribute($value)
    {
        $this->attributes['tipo'] = strtolower($value);
    }

    public function unidadOrigen()
    {
        return $this->belongsTo(UnidadAdministrativa::class, 'unidad_origen_id');
    }

    public function usuarioEnvia()
    {
        return $this->belongsTo(User::class, 'usuario_envia_id');
    }

    public function usuarioTua()
    {
        return $this->belongsTo(User::class, 'usuario_tua_id');
    }

    public function usuarioValida()
    {
        return $this->belongsTo(User::class, 'usuario_valida_id');
    }

    public function usuarioRecibe()
    {
        return $this->belongsTo(User::class, 'usuario_recibe_id');
    }

    public function expedientes()
    {
        return $this->belongsToMany(Expediente::class, 'transferencia_detalles', 'transferencia_id', 'expediente_id');
    }
}
