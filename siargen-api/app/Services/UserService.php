<?php

namespace App\Services;

use App\Models\User;
use App\Traits\Auditable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserService
{
    use Auditable;

    public function getAll(array $filters = [])
    {
        $query = User::with(['role', 'unidadAdministrativa']);

        // búsqueda textual
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('apellido_paterno', 'LIKE', "%{$search}%")
                  ->orWhere('apellido_materno', 'LIKE', "%{$search}%")
                  ->orWhere('username', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        // filtro por rol
        if (isset($filters['role_id']) && !empty($filters['role_id'])) {
            $query->where('role_id', $filters['role_id']);
        }

        // filtro por unidad administrativa
        if (isset($filters['unidad_administrativa_id']) && !empty($filters['unidad_administrativa_id'])) {
            $query->where('unidad_administrativa_id', $filters['unidad_administrativa_id']);
        }

        // filtro por estatus
        if (isset($filters['activo']) && $filters['activo'] !== '') {
            $query->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        $authUser = auth()->user();
        if ($authUser && $authUser->isTua()) {
            $query->where('id', '!=', $authUser->id)
                  ->where('activo', true);
        }

        // ordenamiento dinámico
        $sortBy = $filters['sort_by'] ?? 'nombre';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        
        $allowedSorts = ['nombre', 'username', 'email', 'created_at', 'role_id'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('nombre', 'asc');
        }

        $perPage = $filters['per_page'] ?? 10;
        
        if ($perPage == -1) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    public function getById($id)
    {
        return User::with(['role', 'unidadAdministrativa'])->findOrFail($id);
    }

    public function create(array $data)
    {
        $data['password'] = Hash::make($data['password']);
        $data['activo'] = true;
        
        $role = isset($data['role_id']) ? \App\Models\Role::find($data['role_id']) : null;
        $rolesGlobales = ['admin_ti', 'coord_archivos', 'rac', 'rah', 'consulta'];

        // si el rol es global, forzamos unidad_administrativa_id a null
        if ($role && in_array($role->slug, $rolesGlobales)) {
            $data['unidad_administrativa_id'] = null;
        }

        // validación de seguridad: roles operativos deben tener unidad
        if ($role && !in_array($role->slug, $rolesGlobales) && empty($data['unidad_administrativa_id'])) {
            throw ValidationException::withMessages([
                'unidad_administrativa_id' => ["El rol {$role->nombre} requiere la asignación de una unidad administrativa."]
            ]);
        }

        // 1.
        $rolesUnicosGlobales = ['coord_archivos', 'rac', 'rah'];
        if ($role && in_array($role->slug, $rolesUnicosGlobales)) {
            $existsGlobal = User::where('role_id', $data['role_id'])->where('activo', true)->exists();
            if ($existsGlobal) {
                throw ValidationException::withMessages([
                    'role_id' => ["Ya existe un {$role->nombre} activo en el sistema. Solo se permite uno a nivel institucional."]
                ]);
            }
        }

        // 2.
        if ($role && $role->slug === 'correspondencia' && isset($data['unidad_administrativa_id'])) {
            $countRdc = User::where('role_id', $data['role_id'])
                ->where('unidad_administrativa_id', $data['unidad_administrativa_id'])
                ->where('activo', true)
                ->count();
            
            if ($countRdc >= 2) {
                throw ValidationException::withMessages([
                    'role_id' => ["Esta unidad administrativa ya cuenta con el máximo permitido (2) de Responsables de Correspondencia activos."]
                ]);
            }
        }

        // 3.
        if ($role && !in_array($role->slug, $rolesGlobales) && $role->slug !== 'correspondencia' && isset($data['unidad_administrativa_id'])) {
            $exists = User::where('role_id', $data['role_id'])
                ->where('unidad_administrativa_id', $data['unidad_administrativa_id'])
                ->where('activo', true)
                ->exists();
            
            if ($exists) {
                throw ValidationException::withMessages([
                    'role_id' => ["Esta unidad administrativa ya cuenta con un usuario activo con el rol de {$role->nombre}."]
                ]);
            }
        }

        $user = User::create($data);

        $this->audit($user, 'usuario_creado', null, $user->toArray());

        return $user;
    }

    public function update($id, array $data, User $actor)
    {
        $user = $this->getById($id);
        $oldValues = $user->getRawOriginal();
        
        // protección: no permitir que un usuario se cambie su propio rol o estado
        if ($user->id === $actor->id) {
            if (isset($data['role_id']) && $data['role_id'] != $user->role_id) {
                throw new \Exception('No puedes cambiar tu propio rol institucional.');
            }
            if (isset($data['activo']) && $data['activo'] != $user->activo) {
                throw new \Exception('No puedes cambiar tu propio estado de acceso.');
            }
        }

        $newRoleId = $data['role_id'] ?? $user->role_id;
        $role = \App\Models\Role::find($newRoleId);
        $rolesGlobales = ['admin_ti', 'coord_archivos', 'rac', 'rah', 'consulta'];

        // si el rol es global, forzamos unidad_administrativa_id a null
        if ($role && in_array($role->slug, $rolesGlobales)) {
            $data['unidad_administrativa_id'] = null;
        }

        // validación de seguridad: roles operativos deben tener unidad
        if ($role && !in_array($role->slug, $rolesGlobales) && empty($data['unidad_administrativa_id'])) {
            throw ValidationException::withMessages([
                'unidad_administrativa_id' => ["El rol {$role->nombre} requiere la asignación de una unidad administrativa."]
            ]);
        }

        $newUnidadId = $data['unidad_administrativa_id'] ?? $user->unidad_administrativa_id;

        // 1.
        $rolesUnicosGlobales = ['coord_archivos', 'rac', 'rah'];
        if ($role && in_array($role->slug, $rolesUnicosGlobales)) {
            $existsGlobal = User::where('role_id', $newRoleId)
                ->where('activo', true)
                ->where('id', '!=', $user->id)
                ->exists();
            if ($existsGlobal) {
                throw ValidationException::withMessages([
                    'role_id' => ["Ya existe otro {$role->nombre} activo en el sistema."]
                ]);
            }
        }

        // 2.
        if ($role && $role->slug === 'correspondencia' && $newUnidadId) {
            $countRdc = User::where('role_id', $newRoleId)
                ->where('unidad_administrativa_id', $newUnidadId)
                ->where('activo', true)
                ->where('id', '!=', $user->id)
                ->count();
            
            if ($countRdc >= 2) {
                throw ValidationException::withMessages([
                    'role_id' => ["La unidad seleccionada ya tiene el máximo (2) de Responsables de Correspondencia."]
                ]);
            }
        }

        // 3.
        if ($role && !in_array($role->slug, $rolesGlobales) && $role->slug !== 'correspondencia' && $newUnidadId) {
            $exists = User::where('role_id', $newRoleId)
                ->where('unidad_administrativa_id', $newUnidadId)
                ->where('activo', true)
                ->where('id', '!=', $user->id)
                ->exists();
            
            if ($exists) {
                throw ValidationException::withMessages([
                    'role_id' => ["No se puede asignar: la unidad seleccionada ya tiene un {$role->nombre} activo."]
                ]);
            }
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        $this->audit($user, 'usuario_actualizado', $oldValues, $user->getChanges());

        return $user;
    }

    public function toggleStatus($id, User $actor)
    {
        $user = $this->getById($id);
        $oldStatus = $user->activo;
        
        if ($user->id === $actor->id) {
            throw new \Exception('No puedes cambiar tu propio estado de acceso.');
        }

        $user->activo = !$user->activo;

        // punto 1: bloquear reactivación manual si la unidad está inactiva
        if ($user->activo && $user->unidad_administrativa_id) {
            $unidad = \App\Models\UnidadAdministrativa::find($user->unidad_administrativa_id);
            if ($unidad && !$unidad->activo) {
                throw ValidationException::withMessages([
                    'activo' => ["No se puede reactivar al usuario: la unidad administrativa '{$unidad->nombre}' está inactiva. Primero debe reactivar la unidad."]
                ]);
            }
        }

        // punto 2: validación al reactivar
        if ($user->activo) {
            $role = $user->role;
            $rolesGlobales = ['admin_ti', 'coord_archivos', 'rac', 'rah', 'consulta'];

            // roles únicos globales
            $rolesUnicosGlobales = ['coord_archivos', 'rac', 'rah'];
            if ($role && in_array($role->slug, $rolesUnicosGlobales)) {
                $existsGlobal = User::where('role_id', $user->role_id)
                    ->where('activo', true)
                    ->where('id', '!=', $user->id)
                    ->exists();
                if ($existsGlobal) {
                    throw ValidationException::withMessages([
                        'activo' => ["No se puede reactivar: ya existe un {$role->nombre} activo en el sistema."]
                    ]);
                }
            }

            // correspondencia
            if ($role && $role->slug === 'correspondencia') {
                $countRdc = User::where('role_id', $user->role_id)
                    ->where('unidad_administrativa_id', $user->unidad_administrativa_id)
                    ->where('activo', true)
                    ->where('id', '!=', $user->id)
                    ->count();
                if ($countRdc >= 2) {
                    throw ValidationException::withMessages([
                        'activo' => ["No se puede reactivar: la unidad ya tiene 2 Responsables de Correspondencia activos."]
                    ]);
                }
            }

            // roles únicos por unidad
            if ($role && !in_array($role->slug, $rolesGlobales) && $role->slug !== 'correspondencia') {
                $exists = User::where('role_id', $user->role_id)
                    ->where('unidad_administrativa_id', $user->unidad_administrativa_id)
                    ->where('activo', true)
                    ->where('id', '!=', $user->id)
                    ->exists();
                
                if ($exists) {
                    throw ValidationException::withMessages([
                        'activo' => ["No se puede reactivar: el puesto de {$role->nombre} ya está ocupado por otro usuario activo en esta unidad."]
                    ]);
                }
            }
        }

        $user->save();

        $this->audit(
            $user, 
            $user->activo ? 'usuario_activado' : 'usuario_desactivado',
            ['activo' => $oldStatus],
            ['activo' => $user->activo]
        );

        return $user;
    }

    public function delete($id, User $actor)
    {
        $user = $this->getById($id);

        if ($user->id === $actor->id) {
            throw new \Exception('No puedes eliminar tu propia cuenta.');
        }

        $oldValues = $user->toArray();
        $deleted = $user->delete();

        if ($deleted) {
            $this->audit($user, 'usuario_eliminado', $oldValues, null);
        }

        return $deleted;
    }
}
