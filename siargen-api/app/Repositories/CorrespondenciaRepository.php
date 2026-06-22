<?php

namespace App\Repositories;

use App\Models\Correspondencia;

class CorrespondenciaRepository extends BaseRepository
{
    public function __construct(Correspondencia $model)
    {
        parent::__construct($model);
    }
}
