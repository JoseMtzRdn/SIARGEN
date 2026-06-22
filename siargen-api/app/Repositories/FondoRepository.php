<?php

namespace App\Repositories;

use App\Models\Fondo;

class FondoRepository extends BaseRepository
{
    public function __construct(Fondo $model)
    {
        parent::__construct($model);
    }
}
