<?php

namespace App\Repositories;

use App\Models\Seccion;

class SeccionRepository extends BaseRepository
{
    public function __construct(Seccion $model)
    {
        parent::__construct($model);
    }
}
