<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function before(User $user, $ability)
    {
        // Otorga acceso total al Administrador de TI, restringiendo la automodificación.
        if ($user->isAdminTi()) {
            return null; // Continuar a los métodos específicos
        }
    }

    public function viewAny(User $user)
    {
        return $user->isAdminTi() || $user->isTua();
    }

    public function view(User $user, User $model)
    {
        if ($user->isAdminTi()) return true;
        
        // Aísla la consulta de usuarios por unidad administrativa.
        if ($user->isTua()) {
            return $user->unidad_administrativa_id === $model->unidad_administrativa_id;
        }

        return false;
    }

    public function create(User $user)
    {
        return $user->isAdminTi();
    }

    public function update(User $user, User $model)
    {
        return $user->isAdminTi();
    }

    public function delete(User $user, User $model)
    {
        // No permitir que se elimine/desactive a sí mismo
        return $user->isAdminTi() && $user->id !== $model->id;
    }

    /**
     * Determine whether the user can restore the model.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\User  $model
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function restore(User $user, User $model)
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the model.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\User  $model
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function forceDelete(User $user, User $model)
    {
        //
    }
}
