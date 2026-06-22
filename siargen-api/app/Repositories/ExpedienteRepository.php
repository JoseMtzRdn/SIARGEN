<?php

namespace App\Repositories;

use App\Models\Expediente;

class ExpedienteRepository extends BaseRepository
{
    public function __construct(Expediente $model)
    {
        parent::__construct($model);
    }
}
