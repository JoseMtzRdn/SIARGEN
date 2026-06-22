<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrestamoDetalle extends Model
{
    use HasFactory;

    protected $table = 'prestamo_detalles';

    protected $fillable = [
        'prestamo_id',
        'expediente_id',
        'estatus',
        'estado_salida',
        'estado_devolucion',
        'fecha_devolucion',
        'observaciones_devolucion'
    ];

    protected $casts = [
        'fecha_devolucion' => 'datetime'
    ];

    public function prestamo()
    {
        return $this->belongsTo(Prestamo::class);
    }

    public function expediente()
    {
        return $this->belongsTo(Expediente::class);
    }
}
