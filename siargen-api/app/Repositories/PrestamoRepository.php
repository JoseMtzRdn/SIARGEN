<?php

namespace App\Repositories;

use App\Models\Prestamo;

class PrestamoRepository extends BaseRepository
{
    public function __construct(Prestamo $model)
    {
        parent::__construct($model);
    }
}
