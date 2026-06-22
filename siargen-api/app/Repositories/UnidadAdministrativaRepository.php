<?php

namespace App\Repositories;

use App\Models\UnidadAdministrativa;

class UnidadAdministrativaRepository extends BaseRepository
{
    public function __construct(UnidadAdministrativa $model)
    {
        parent::__construct($model);
    }
}
