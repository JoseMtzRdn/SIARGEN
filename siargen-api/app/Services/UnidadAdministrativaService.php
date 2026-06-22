<?php

namespace App\Services;

use App\Models\UnidadAdministrativa;
use App\Traits\Auditable;

class UnidadAdministrativaService
{
    use Auditable;

    public function getAll(array $filters = [])
    {
        $query = UnidadAdministrativa::with(['titular' => function($query) {
            $query->with('role');
        }]);

        // búsqueda textual
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('codigo', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('direccion', 'LIKE', "%{$search}%");
            });
        }

        // filtro por estatus
        if (isset($filters['activo']) && $filters['activo'] !== '') {
            $query->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        // ordenamiento
        $query->orderBy('nombre', 'asc');

        $perPage = $filters['per_page'] ?? 10;
        
        if ($perPage == -1) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    public function getById($id)
    {
        return UnidadAdministrativa::with(['users.role', 'titular'])->findOrFail($id);
    }

    public function create(array $data)
    {
        $unidad = UnidadAdministrativa::create($data);
        $this->audit($unidad, 'unidad_creada', null, $unidad->toArray());
        return $unidad;
    }

    public function update($id, array $data)
    {
        $unidad = $this->getById($id);
        $oldValues = $unidad->getRawOriginal();
        
        $unidad->update($data);
        
        if ($unidad->wasChanged()) {
            $this->audit($unidad, 'unidad_actualizada', $oldValues, $unidad->getChanges());
        }
        
        return $unidad;
    }

    public function delete($id)
    {
        $unidad = $this->getById($id);
        
        $oldValues = $unidad->toArray();
        $deleted = $unidad->delete();

        if ($deleted) {
            $this->audit($unidad, 'unidad_eliminada', $oldValues, null);
        }

        return $deleted;
    }

    public function toggleStatus($id)
    {
        $unidad = $this->getById($id);
        $oldStatus = $unidad->activo;

        $unidad->activo = !$unidad->activo;
        $unidad->save();

        $affectedUserIds = [];

        // punto 1: cascada inteligente
        if (!$unidad->activo) {
            // al desactivar: guardamos solo los que están activos actualmente
            $affectedUserIds = $unidad->users()->where('activo', true)->pluck('id')->toArray();
            if (!empty($affectedUserIds)) {
                \App\Models\User::whereIn('id', $affectedUserIds)->update(['activo' => false]);
            }
        } else {
            // Restaura los usuarios activos asociados históricamente a la unidad.
            $lastLog = \App\Models\AuditLog::where('auditable_type', get_class($unidad))
                ->where('auditable_id', $unidad->id)
                ->where('event', 'unidad_desactivada')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastLog && isset($lastLog->new_values['affected_users'])) {
                $affectedUserIds = $lastLog->new_values['affected_users'];
                \App\Models\User::whereIn('id', $affectedUserIds)->update(['activo' => true]);
            }
        }

        $this->audit(
            $unidad, 
            $unidad->activo ? 'unidad_activada' : 'unidad_desactivada',
            ['activo' => $oldStatus],
            ['activo' => $unidad->activo, 'affected_users' => $affectedUserIds]
        );

        return $unidad;
    }
}
