<?php

namespace App\Repositories;

use App\Models\Transferencia;

class TransferenciaRepository extends BaseRepository
{
    public function __construct(Transferencia $model)
    {
        parent::__construct($model);
    }
}
