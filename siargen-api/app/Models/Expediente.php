<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\IsolateByUnidad;

class Expediente extends Model
{
    use HasFactory, IsolateByUnidad, SoftDeletes;

    // constantes de fase
    const FASE_TRAMITE = 1;
    const FASE_CONCENTRACION = 2;
    const FASE_HISTORICO = 3;
    const FASE_BAJA = 4;

    // constantes de disponibilidad
    const STATUS_DISPONIBLE = 1;
    const STATUS_PRESTADO = 2;
    const STATUS_RESERVADO = 3;
    const STATUS_EN_TRANSFERENCIA = 4;

    // constantes de estado de archivo
    const STATE_ABIERTO = 1;
    const STATE_CERRADO = 2;
    const STATE_CERRADO_SUBSANACION = 3;

    protected $fillable = [
        'unidad_administrativa_id',
        'serie_id',
        'subserie_id',
        'usuario_creador_id',
        'numero_expediente',
        'titulo',
        'observaciones',
        'año_apertura',
        'año_cierre',
        'ubicacion_seccion',
        'ubicacion_bateria',
        'ubicacion_modulo',
        'ubicacion_entrepaño',
        'ubicacion_caja',
        'numero_cajas',
        'fase',
        'estado_archivo',
        'fecha_cierre',
        'estatus_disponibilidad',
        'clasificacion_informacion'
    ];

    protected $casts = [
        'fecha_cierre' => 'datetime',
        'fase' => 'integer',
        'estatus_disponibilidad' => 'integer',
        'estado_archivo' => 'integer',
    ];

    // accessors

    public function getEstadoArchivoLabelAttribute()
    {
        return match ((int)$this->estado_archivo) {
            self::STATE_ABIERTO => 'abierto',
            self::STATE_CERRADO => 'cerrado',
            self::STATE_CERRADO_SUBSANACION => 'subsanacion',
            default => 'abierto'
        };
    }

    public function getFaseLabelAttribute()
    {
        return match ((int)$this->fase) {
            self::FASE_TRAMITE => 'tramite',
            self::FASE_CONCENTRACION => 'concentracion',
            self::FASE_HISTORICO => 'historico',
            self::FASE_BAJA => 'baja',
            default => 'tramite'
        };
    }

    public function getEstatusDisponibilidadLabelAttribute()
    {
        return match ((int)$this->estatus_disponibilidad) {
            self::STATUS_DISPONIBLE => 'disponible',
            self::STATUS_PRESTADO => 'prestado',
            self::STATUS_RESERVADO => 'reservado',
            self::STATUS_EN_TRANSFERENCIA => 'en transferencia',
            default => 'disponible'
        };
    }

    // Calcula plazos de conservación y vigencia documental.

    public function getNumFojasAttribute()
    {
        return (int) $this->documentos()->sum('num_fojas');
    }

    public function getNumLegajosAttribute()
    {
        $fojas = $this->num_fojas;
        if ($fojas === 0) return 0;
        
        return (int) ceil($fojas / 200);
    }


    public function serie()
    {
        return $this->belongsTo(SerieDocumental::class, 'serie_id');
    }

    public function subserie()
    {
        return $this->belongsTo(Subserie::class, 'subserie_id');
    }

    public function unidadAdministrativa()
    {
        return $this->belongsTo(UnidadAdministrativa::class, 'unidad_administrativa_id');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'usuario_creador_id');
    }

    public function documentos()
    {
        return $this->hasMany(Correspondencia::class, 'expediente_id');
    }

    public function prestamos()
    {
        return $this->hasMany(Prestamo::class, 'expediente_id');
    }

    public function transferencias()
    {
        return $this->belongsToMany(Transferencia::class, 'transferencia_detalles', 'expediente_id', 'transferencia_id');
    }

    // Determina si el expediente está asociado a una transferencia rechazada.
    public function getIsInSubsanacionAttribute()
    {
        return $this->transferencias()
            ->where('estatus', 'LIKE', 'rechazada_%')
            ->exists();
    }
}
