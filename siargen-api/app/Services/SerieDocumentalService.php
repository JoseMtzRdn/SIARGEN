<?php

namespace App\Services;

use App\Repositories\SerieDocumentalRepository;
use App\Traits\Auditable;
use Illuminate\Validation\ValidationException;

class SerieDocumentalService extends BaseService
{
    use Auditable;

    public function __construct(SerieDocumentalRepository $repository)
    {
        parent::__construct($repository);
    }

    public function update(int $id, array $data): bool
    {
        $serie = $this->repository->find($id);
        if (!$serie) return false;

        $oldValues = $serie->toArray();
        $updated = $this->repository->update($id, $data);

        if ($updated) {
            $serie->refresh();
            $this->audit($serie, 'serie_actualizado', $oldValues, $serie->toArray());
        }

        return $updated;
    }

    public function delete(int $id): bool
    {
        $serie = $this->repository->find($id);
        if (!$serie) return false;

        if ($serie->expedientes()->count() > 0) {
            throw ValidationException::withMessages([
                'delete' => ["No se puede eliminar la Serie '{$serie->nombre}' porque tiene Expedientes vinculados. Elimine o transfiera primero los registros dependientes."]
            ]);
        }

        $oldValues = $serie->toArray();
        $deleted = $this->repository->delete($id);

        if ($deleted) {
            $this->audit($serie, 'serie_eliminado', $oldValues, null);
        }

        return $deleted;
    }
}
