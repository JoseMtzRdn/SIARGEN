<?php

namespace App\Services;

use App\Repositories\FondoRepository;
use App\Traits\Auditable;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Model;

class FondoService extends BaseService
{
    use Auditable;

    public function __construct(FondoRepository $repository)
    {
        parent::__construct($repository);
    }

    public function update(int $id, array $data): bool
    {
        $fondo = $this->repository->find($id);
        if (!$fondo) return false;

        $oldValues = $fondo->toArray();
        $updated = $this->repository->update($id, $data);

        if ($updated) {
            $fondo->refresh();
            $this->audit($fondo, 'fondo_actualizado', $oldValues, $fondo->toArray());
        }

        return $updated;
    }

    public function delete(int $id): bool
    {
        $fondo = $this->repository->find($id);
        if (!$fondo) return false;

        if ($fondo->secciones()->count() > 0) {
            throw ValidationException::withMessages([
                'delete' => ["No se puede eliminar el Fondo '{$fondo->nombre}' porque tiene Secciones vinculadas. Elimine primero los registros dependientes."]
            ]);
        }

        $oldValues = $fondo->toArray();
        $deleted = $this->repository->delete($id);

        if ($deleted) {
            $this->audit($fondo, 'fondo_eliminado', $oldValues, null);
        }

        return $deleted;
    }
}
