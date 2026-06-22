<?php

namespace App\Repositories;

use App\Models\SerieDocumental;

class SerieDocumentalRepository extends BaseRepository
{
    public function __construct(SerieDocumental $model)
    {
        parent::__construct($model);
    }
}
