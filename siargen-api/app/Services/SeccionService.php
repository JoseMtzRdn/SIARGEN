<?php

namespace App\Services;

use App\Repositories\SeccionRepository;
use App\Traits\Auditable;
use Illuminate\Validation\ValidationException;

class SeccionService extends BaseService
{
    use Auditable;

    public function __construct(SeccionRepository $repository)
    {
        parent::__construct($repository);
    }

    public function update(int $id, array $data): bool
    {
        $seccion = $this->repository->find($id);
        if (!$seccion) return false;

        $oldValues = $seccion->toArray();
        $updated = $this->repository->update($id, $data);

        if ($updated) {
            $seccion->refresh();
            $this->audit($seccion, 'seccion_actualizado', $oldValues, $seccion->toArray());
        }

        return $updated;
    }

    public function delete(int $id): bool
    {
        $seccion = $this->repository->find($id);
        if (!$seccion) return false;

        if ($seccion->series()->count() > 0) {
            throw ValidationException::withMessages([
                'delete' => ["No se puede eliminar la Sección '{$seccion->nombre}' porque tiene Series Documentales vinculadas. Elimine primero los registros dependientes."]
            ]);
        }

        $oldValues = $seccion->toArray();
        $deleted = $this->repository->delete($id);

        if ($deleted) {
            $this->audit($seccion, 'seccion_eliminado', $oldValues, null);
        }

        return $deleted;
    }
}
