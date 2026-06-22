<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\IsolateByUnidad;

class Correspondencia extends Model
{
    use HasFactory, SoftDeletes, IsolateByUnidad;

    protected $table = 'correspondencias';

    protected $fillable = [
        'folio_sistema',
        'tipo',
        'num_oficio',
        'fecha',
        'remitente',
        'destinatario',
        'asunto',
        'prioridad',
        'clase_documento',
        'num_fojas',
        'fecha_limite_respuesta',
        'documento_pdf_path',
        'unidad_administrativa_id',
        'user_id',
        'expediente_id',
        'seccion_id',
        'serie_id',
        'subserie_id',
        'serie_original_id',
        'subserie_original_id',
        'clasificacion_heredada',
        'estatus'
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_limite_respuesta' => 'date',
    ];

    public function unidadAdministrativa()
    {
        return $this->belongsTo(UnidadAdministrativa::class, 'unidad_administrativa_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function expediente()
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function seccion()
    {
        return $this->belongsTo(Seccion::class, 'seccion_id');
    }

    public function serie()
    {
        return $this->belongsTo(SerieDocumental::class, 'serie_id');
    }

    public function subserie()
    {
        return $this->belongsTo(Subserie::class, 'subserie_id');
    }
}
