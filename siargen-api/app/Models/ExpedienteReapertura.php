<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpedienteReapertura extends Model
{
    protected $fillable = ['expediente_id', 'user_id', 'motivo', 'fecha_reapertura'];

    public function expediente()
    {
        return $this->belongsTo(Expediente::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
