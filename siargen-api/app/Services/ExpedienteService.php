<?php

namespace App\Services;

use App\Models\Expediente;
use App\Repositories\ExpedienteRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use App\Traits\Auditable;

class ExpedienteService extends BaseService
{
    use Auditable;

    public function __construct(ExpedienteRepository $repository)
    {
        parent::__construct($repository);
    }

    // Crea un expediente asignando metadatos y folio institucional.
    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $user = auth()->user();
            
            // forzar unidad administrativa del usuario (aislamiento)
            if (!$user->isAdminTi()) {
                $data['unidad_administrativa_id'] = $user->unidad_administrativa_id;
            }

            $data['usuario_creador_id'] = $user->id;
            $data['fase'] = Expediente::FASE_TRAMITE;
            $data['estatus_disponibilidad'] = Expediente::STATUS_DISPONIBLE;
            $data['estado_archivo'] = Expediente::STATE_ABIERTO;
            
            // generar folio considerando subserie
            $data['numero_expediente'] = $this->generateFolio($data);

            $expediente = $this->repository->create($data);

            // Envía notificación de apertura al administrador.
            if ($user->isAdminTi()) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $user->id,
                    'Nuevo Expediente Creado (Admin)',
                    "Has aperturado el expediente {$expediente->numero_expediente} con éxito.",
                    'success',
                    "/tramite/expedientes?search={$expediente->numero_expediente}"
                );
            }

            $this->audit($expediente, 'expediente_creado', null, $expediente->toArray());

            return $expediente;
        });
    }

    // actualizar un registro existente.
    public function updateRecord($id, array $data): Model
    {
        $expediente = $this->find($id);
        $oldValues = $expediente->getRawOriginal();

        $hasDocuments = $expediente->documentos()->exists();
        
        if ($hasDocuments) {
            $serieChanged = isset($data['serie_id']) && (int)$data['serie_id'] !== (int)$expediente->serie_id;
            $subserieChanged = isset($data['subserie_id']) && (int)$data['subserie_id'] !== (int)$expediente->subserie_id;

            if ($serieChanged || $subserieChanged) {
                throw new \Exception("No es posible cambiar la clasificación (Serie/Subserie) de un expediente que ya tiene documentos integrados. Esto violaría la integridad del ciclo de vida documental.");
            }
        }

        return DB::transaction(function () use ($expediente, $data, $oldValues) {
            $expediente->update($data);

            // regenerar folio si cambió la clasificación
            $serieChanged = isset($data['serie_id']) && (int)$data['serie_id'] !== (int)$oldValues['serie_id'];
            $subserieChanged = array_key_exists('subserie_id', $data) && (int)($data['subserie_id'] ?? 0) !== (int)($oldValues['subserie_id'] ?? 0);

            if ($serieChanged || $subserieChanged) {
                $nuevoFolio = $this->generateFolio([
                    'unidad_administrativa_id' => $expediente->unidad_administrativa_id,
                    'serie_id' => $expediente->serie_id,
                    'subserie_id' => $expediente->subserie_id,
                    'created_at' => $expediente->created_at // mantener año original
                ]);
                $expediente->update(['numero_expediente' => $nuevoFolio]);
            }
            
            // auditoría de cambios
            $this->audit($expediente, 'expediente_actualizado', $oldValues, $expediente->getChanges());

            return $expediente;
        });
    }

    // cerrar un expediente.
    public function close($id): Model
    {
        $expediente = $this->find($id);

        if ($expediente->estado_archivo === Expediente::STATE_CERRADO) {
            throw new \Exception('El expediente ya se encuentra cerrado.');
        }

        return DB::transaction(function () use ($expediente) {
            $oldValues = $expediente->getRawOriginal();
            
            $expediente->update([
                'estado_archivo' => Expediente::STATE_CERRADO,
                'fecha_cierre' => now(),
                'año_cierre' => now()->year
            ]);

            $this->audit($expediente, 'expediente_cerrado', $oldValues, $expediente->getChanges());

            return $expediente;
        });
    }

    // reabrir un expediente.
    public function reopen($id): Model
    {
        $expediente = $this->find($id);

        if ($expediente->estado_archivo === Expediente::STATE_ABIERTO) {
            throw new \Exception('El expediente ya se encuentra abierto.');
        }

        if ($expediente->estado_archivo === Expediente::STATE_CERRADO_SUBSANACION) {
            throw new \Exception("No se puede reabrir un expediente en modo subsanación. Utilice las herramientas de corrección o complete el proceso de transferencia.");
        }

        // Restringe la reapertura si la vigencia en trámite ha expirado.
        if ($expediente->vigencia_cumplida) {
            throw new \Exception('No se puede reabrir un expediente cuya vigencia en trámite ha concluido.');
        }

        return DB::transaction(function () use ($expediente) {
            $oldValues = $expediente->getRawOriginal();

            $expediente->update([
                'estado_archivo' => Expediente::STATE_ABIERTO,
                'fecha_cierre' => null,
                'año_cierre' => null
            ]);

            $this->audit($expediente, 'expediente_reabierto', $oldValues, $expediente->getChanges());

            return $expediente;
        });
    }

    // reclasificar un expediente en modo subsanación (cascada).
    public function reclasificarSubsanacion($id, array $data): Model
    {
        $expediente = $this->find($id);

        if ($expediente->estado_archivo !== Expediente::STATE_CERRADO_SUBSANACION) {
            throw new \Exception("Esta acción solo es permitida para expedientes en modo subsanación.");
        }

        return DB::transaction(function () use ($expediente, $data) {
            $oldValues = $expediente->getRawOriginal();

            // actualizar expediente
            $expediente->update([
                'serie_id' => $data['serie_id'],
                'subserie_id' => $data['subserie_id'] ?? null
            ]);

            // Actualiza la clasificación de los documentos vinculados en cascada.
            \App\Models\Correspondencia::where('expediente_id', $expediente->id)
                ->update([
                    'serie_id' => $data['serie_id'],
                    'subserie_id' => $data['subserie_id'] ?? null
                ]);

            // Actualiza el folio institucional del expediente.
            $nuevoFolio = $this->generateFolio([
                'unidad_administrativa_id' => $expediente->unidad_administrativa_id,
                'serie_id' => $data['serie_id'],
                'subserie_id' => $data['subserie_id'] ?? null,
                'created_at' => $expediente->created_at // Preserva el año de apertura original.
            ]);
            
            $expediente->update(['numero_expediente' => $nuevoFolio]);

            $this->audit($expediente, 'expediente_reclasificado_subsanacion', $oldValues, $expediente->getChanges());

            return $expediente->load([
                'serie.seccion.fondo', 
                'subserie.serie.seccion.fondo', 
                'unidadAdministrativa',
                'documentos.unidadAdministrativa',
                'documentos.usuario',
                'documentos.serie.seccion.fondo', // Preserva las relaciones jerárquicas de la correspondencia vinculada.
                'documentos.subserie.serie.seccion.fondo' // Preserva las relaciones jerárquicas de la correspondencia vinculada.
            ]);
        });
    }

    // actualizar ubicación topográfica en modo subsanación.
    public function updateUbicacionSubsanacion($id, array $data): Model
    {
        $expediente = $this->find($id);

        if ($expediente->estado_archivo !== Expediente::STATE_CERRADO_SUBSANACION) {
            throw new \Exception("Esta acción solo es permitida para expedientes en modo subsanación.");
        }

        return DB::transaction(function () use ($expediente, $data) {
            $oldValues = $expediente->getRawOriginal();

            $expediente->update([
                'ubicacion_seccion' => $data['ubicacion_seccion'] ?? $expediente->ubicacion_seccion,
                'ubicacion_bateria' => $data['ubicacion_bateria'] ?? $expediente->ubicacion_bateria,
                'ubicacion_modulo' => $data['ubicacion_modulo'] ?? $expediente->ubicacion_modulo,
                'ubicacion_entrepaño' => $data['ubicacion_entrepaño'] ?? $expediente->ubicacion_entrepaño,
                'ubicacion_caja' => $data['ubicacion_caja'] ?? $expediente->ubicacion_caja,
                'numero_cajas' => $data['numero_cajas'] ?? $expediente->numero_cajas,
            ]);

            $this->audit($expediente, 'expediente_ubicacion_corregida_subsanacion', $oldValues, $expediente->getChanges());

            return $expediente->load([
                'serie.seccion.fondo', 
                'subserie.serie.seccion.fondo', 
                'unidadAdministrativa',
                'documentos.unidadAdministrativa'
            ]);
        });
    }

    // Formato del folio institucional: [unidad]/[serie/subserie]/[año]/[secuencial].
    private function generateFolio(array $data)
    {
        $unidad = \App\Models\UnidadAdministrativa::findOrFail($data['unidad_administrativa_id']);
        
        // Determinar el año: usar el original o el año actual.
        $dateSource = isset($data['created_at']) ? \Carbon\Carbon::parse($data['created_at']) : now();
        $year = $dateSource->year;
        
        $fuenteId = null;
        $fuenteCodigo = '';
        $campoFk = '';

        // prioridad 1: subserie
        if (!empty($data['subserie_id'])) {
            $subserie = \App\Models\Subserie::findOrFail($data['subserie_id']);
            $fuenteId = $subserie->id;
            $fuenteCodigo = $subserie->codigo;
            $campoFk = 'subserie_id';
        } 
        // prioridad 2: serie (si no hay subserie)
        else {
            $serie = \App\Models\SerieDocumental::findOrFail($data['serie_id']);
            $fuenteId = $serie->id;
            $fuenteCodigo = $serie->codigo;
            $campoFk = 'serie_id';
        }

        $prefix = sprintf('%s/%s/%s', $unidad->codigo, $fuenteCodigo, $year);
        
        // el contador es específico por unidad + clasificación + año
        $count = $this->repository->getModel()
            ->withTrashed()
            ->where('unidad_administrativa_id', $data['unidad_administrativa_id'])
            ->where($campoFk, $fuenteId)
            ->whereYear('created_at', $year)
            ->count();

        $nextNumber = $count + 1;
        $folio = sprintf('%s/%04d', $prefix, $nextNumber);

        // bucle de seguridad para garantizar unicidad absoluta
        while ($this->repository->getModel()->withTrashed()->where('numero_expediente', $folio)->exists()) {
            $nextNumber++;
            $folio = sprintf('%s/%04d', $prefix, $nextNumber);
        }

        return $folio;
    }
}
