<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait IsolateByUnidad
{
    protected static function bootIsolateByUnidad()
    {
        static::addGlobalScope('unidad_administrativa', function (Builder $builder) {
            // no aplicar en consola (artisan, seeds, migrations)
            if (app()->runningInConsole()) return;

            $user = Auth::user();
            if (!$user) return;

            // Determina si el rol es global (exento de aislamiento).
            $isGlobalRole = $user->isAdminTi() || $user->isCoordArchivos() || $user->isRac() || $user->isRah();

            if (!$isGlobalRole) {
                // calificar la columna con el nombre de la tabla para evitar ambigüedades en joins
                $table = $builder->getModel()->getTable();
                $column = $table . '.unidad_administrativa_id';

                if ($user->unidad_administrativa_id) {
                    $builder->where($column, $user->unidad_administrativa_id);
                } else {
                    // si el usuario no tiene unidad asignada y no es global, por seguridad no ve nada
                    $builder->whereRaw('1 = 0');
                }
            }
        });
    }
}
