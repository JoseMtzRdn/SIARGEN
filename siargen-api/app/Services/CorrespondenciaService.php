<?php

namespace App\Services;

use App\Models\Correspondencia;
use App\Models\Expediente;
use App\Repositories\CorrespondenciaRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Traits\Auditable;

class CorrespondenciaService extends BaseService
{
    use Auditable;

    public function __construct(CorrespondenciaRepository $repository)
    {
        parent::__construct($repository);
    }

    // Almacena un registro de correspondencia.
    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $user = auth()->user();
            
            // generación de folio institucional con bloqueo de tabla para evitar duplicados
            $data['folio_sistema'] = $this->generateFolio($data['tipo']);
            
            $data['user_id'] = $user->id;
            $data['estatus'] = 'PENDIENTE';
            
            // si el usuario es resp.
            if (!$user->isAdminTi() && !$user->isRespCorrespondencia()) {
                $data['unidad_administrativa_id'] = $user->unidad_administrativa_id;
            } else {
                $data['unidad_administrativa_id'] = $data['turnado_a'];
            }
            
            if (isset($data['documento_pdf'])) {
                // deshabilitar guardado fisico local para produccion
                $data['documento_pdf_path'] = null;
            }

            // Registra la clasificación archivística inicial del documento.
            $data['serie_original_id'] = $data['serie_id'] ?? null;
            $data['subserie_original_id'] = $data['subserie_id'] ?? null;

            $correspondencia = $this->repository->create($data);

            // notificar al responsable de archivo de trámite (rat) de la unidad de destino
            $receptores = \App\Models\User::where('unidad_administrativa_id', $correspondencia->unidad_administrativa_id)
                ->whereHas('role', function($q) { $q->where('slug', 'rat'); })
                ->get();

            foreach ($receptores as $receptor) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $receptor->id,
                    'Nueva Correspondencia Recibida',
                    "Se ha turnado el folio {$correspondencia->folio_sistema} a su unidad.",
                    'info',
                    "/correspondencia?search={$correspondencia->folio_sistema}"
                );
            }

            // Envía notificación de control al administrador del sistema.
            if ($user->isAdminTi()) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $user->id,
                    'Correspondencia Registrada (Admin)',
                    "Has registrado el folio {$correspondencia->folio_sistema} exitosamente.",
                    'success',
                    "/correspondencia?search={$correspondencia->folio_sistema}"
                );
            }

            // auditoría
            $this->audit($correspondencia, 'correspondencia_creada', null, $correspondencia->toArray());

            return $correspondencia;
        });
    }

    // actualizar un registro existente.
    public function updateRecord($id, array $data): Model
    {
        $correspondencia = $this->find($id);
        $oldValues = $correspondencia->getRawOriginal();

        return DB::transaction(function () use ($correspondencia, $data, $oldValues) {
            if (isset($data['turnado_a'])) {
                $data['unidad_administrativa_id'] = $data['turnado_a'];
            }

            // deshabilitar almacenamiento fisico local para produccion
            if (isset($data['documento_pdf'])) {
                if ($correspondencia->documento_pdf_path) {
                    Storage::disk('public')->delete($correspondencia->documento_pdf_path);
                }
                $data['documento_pdf_path'] = null;
            } elseif (isset($data['remover_pdf']) && $data['remover_pdf'] == '1') {
                if ($correspondencia->documento_pdf_path) {
                    Storage::disk('public')->delete($correspondencia->documento_pdf_path);
                }
                $data['documento_pdf_path'] = null;
            }

            // quitar banderas que no pertenecen al modelo
            unset($data['remover_pdf']);

            // si el documento sigue pendiente, permitimos actualizar su clasificación original
            if ($correspondencia->estatus === 'PENDIENTE') {
                if (array_key_exists('serie_id', $data)) $data['serie_original_id'] = $data['serie_id'];
                if (array_key_exists('subserie_id', $data)) $data['subserie_original_id'] = $data['subserie_id'];
            }

            $correspondencia->update($data);
            
            // auditoría de cambios
            $this->audit($correspondencia, 'correspondencia_actualizada', $oldValues, $correspondencia->getChanges());

            return $correspondencia;
        });
    }

    // Asocia el documento a un expediente y actualiza su estado.
    public function archivar($id, $expedienteId)
    {
        return DB::transaction(function () use ($id, $expedienteId) {
            $correspondencia = $this->find($id);
            $expediente = Expediente::findOrFail($expedienteId);
            $oldEstatus = $correspondencia->estatus;

            // validación de integridad de unidad
            if ((int)$correspondencia->unidad_administrativa_id !== (int)$expediente->unidad_administrativa_id) {
                throw new \Exception("Conflicto de Integridad: El documento pertenece a una unidad diferente a la del expediente.");
            }
            
            // Validación de estado: el expediente debe estar abierto o en subsanación.
            if ((int)$expediente->estado_archivo !== Expediente::STATE_ABIERTO && (int)$expediente->estado_archivo !== Expediente::STATE_CERRADO_SUBSANACION) {
                throw new \Exception("No se pueden archivar documentos en un expediente que se encuentra cerrado y no está en modo subsanación.");
            }

            // validación cronológica (solo si el expediente está cerrado/en subsanación)
            if ((int)$expediente->estado_archivo === Expediente::STATE_CERRADO_SUBSANACION) {
                $fechaDocumento = \Carbon\Carbon::parse($correspondencia->fecha);
                if ($expediente->fecha_cierre && $fechaDocumento->gt($expediente->fecha_cierre)) {
                    throw new \Exception("Seguridad Archivística: No se puede archivar un documento con fecha posterior al cierre del expediente (" . $expediente->fecha_cierre->format('d/m/Y') . ").");
                }
            }

            // Valida si el expediente se encuentra en proceso de transferencia.
            if ((int)$expediente->estatus_disponibilidad === Expediente::STATUS_EN_TRANSFERENCIA) {
                throw new \Exception("No se pueden archivar documentos en un expediente que se encuentra en proceso de transferencia.");
            }

            // Hereda clasificación: si el documento no tiene serie, hereda la del expediente.
            $hereda = empty($correspondencia->serie_id);

            $correspondencia->update([
                'estatus' => 'ARCHIVADO',
                'expediente_id' => $expedienteId,
                'serie_id' => $hereda ? $expediente->serie_id : $correspondencia->serie_id,
                'subserie_id' => $hereda ? $expediente->subserie_id : $correspondencia->subserie_id,
                'clasificacion_heredada' => $hereda
            ]);
            
            // Envío de notificaciones.
            $this->notifyArchived($correspondencia, $expediente);

            $this->audit($correspondencia, 'correspondencia_archivada', 
                ['estatus' => $oldEstatus, 'expediente_id' => null], 
                ['estatus' => 'ARCHIVADO', 'expediente_id' => $expedienteId]
            );
            
            return $correspondencia;
        });
    }

    // mover documento de un expediente a otro (re-archivado)
    public function cambiarExpediente($id, $nuevoExpedienteId, $motivo)
    {
        return DB::transaction(function () use ($id, $nuevoExpedienteId, $motivo) {
            $correspondencia = $this->find($id);
            $expedienteAnterior = $correspondencia->expediente;
            $nuevoExpediente = Expediente::findOrFail($nuevoExpedienteId);

            if (!$expedienteAnterior) {
                throw new \Exception("El documento no está archivado actualmente.");
            }

            if ($expedienteAnterior->id === (int)$nuevoExpedienteId) {
                throw new \Exception("El documento ya se encuentra en el expediente seleccionado.");
            }

            // validaciones de integridad (usando constantes numéricas)
            if ((int)$nuevoExpediente->fase !== Expediente::FASE_TRAMITE || (int)$nuevoExpediente->estatus_disponibilidad !== Expediente::STATUS_DISPONIBLE) {
                throw new \Exception("El expediente destino no está disponible para nuevos documentos.");
            }

            if ((int)$correspondencia->unidad_administrativa_id !== (int)$nuevoExpediente->unidad_administrativa_id) {
                throw new \Exception("El expediente destino pertenece a una unidad administrativa diferente.");
            }

            $oldExpId = $correspondencia->expediente_id;
            $correspondencia->update(['expediente_id' => $nuevoExpedienteId]);

            // auditoría con motivo
            $this->audit($correspondencia, 'cambio_expediente', 
                ['expediente_id' => $oldExpId, 'motivo' => 'Error al archivar'], 
                ['expediente_id' => $nuevoExpedienteId, 'motivo_cambio' => $motivo]
            );

            return $correspondencia;
        });
    }

    // desarchivar un documento (regresar a pendiente)
    public function desarchivar($id, $motivo)
    {
        return DB::transaction(function () use ($id, $motivo) {
            $correspondencia = $this->find($id);
            $expediente = $correspondencia->expediente;

            if (!$expediente) {
                throw new \Exception("El documento no está archivado.");
            }

            $oldExpId = $correspondencia->expediente_id;
            
            $updateData = [
                'estatus' => 'PENDIENTE',
                'expediente_id' => null,
                // Restablece la clasificación archivística inicial.
                'serie_id' => $correspondencia->serie_original_id,
                'subserie_id' => $correspondencia->subserie_original_id,
                'clasificacion_heredada' => false
            ];

            $correspondencia->update($updateData);

            $this->audit($correspondencia, 'documento_desarchivado', 
                ['estatus' => 'ARCHIVADO', 'expediente_id' => $oldExpId], 
                ['estatus' => 'PENDIENTE', 'expediente_id' => null, 'motivo' => $motivo]
            );

            return $correspondencia;
        });
    }

    private function notifyArchived($correspondencia, $expediente)
    {
        \App\Http\Controllers\Api\NotificationController::push(
            auth()->id(),
            'Documento Archivado',
            "El folio {$correspondencia->folio_sistema} ha sido vinculado al expediente {$expediente->numero_expediente}.",
            'success'
        );

        $receptoresRat = \App\Models\User::where('unidad_administrativa_id', $expediente->unidad_administrativa_id)
            ->whereHas('role', function($q) { $q->where('slug', 'rat'); })
            ->get();

        foreach ($receptoresRat as $rat) {
            if ($rat->id !== auth()->id()) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $rat->id,
                    'Nuevo Documento en Expediente',
                    "Se ha integrado el folio {$correspondencia->folio_sistema} al expediente {$expediente->numero_expediente}.",
                    'info',
                    "/tramite/expedientes?search={$expediente->numero_expediente}"
                );
            }
        }
    }

    // eliminar registro y su archivo físico (auditado).
    public function deleteWithReason($id, $motivo): bool
    {
        $correspondencia = $this->find($id);
        
        if ($correspondencia->estatus === 'ARCHIVADO' || $correspondencia->expediente_id !== null) {
            throw new \Exception("No se puede eliminar un documento que ya se encuentra archivado en un expediente.");
        }
        
        return DB::transaction(function () use ($correspondencia, $motivo) {
            if ($correspondencia->documento_pdf_path) {
                Storage::disk('public')->delete($correspondencia->documento_pdf_path);
            }
            
            $oldValues = $correspondencia->toArray();
            $oldValues['motivo_eliminacion'] = $motivo; // registrar el motivo en los datos antiguos

            $deleted = $correspondencia->delete();
            
            if ($deleted) {
                $this->audit($correspondencia, 'correspondencia_eliminada', $oldValues, ['motivo' => $motivo]);
            }
            
            return $deleted;
        });
    }

    // generar folio único basado en el año y tipo.
    private function generateFolio($tipo)
    {
        $prefix = ($tipo === 'ENTRADA') ? 'COR-ENT' : 'COR-SAL';
        $year = date('Y');
        
        $user = auth()->user();
        $unidadId = $user ? $user->unidad_administrativa_id : 1;
        $unidad = \App\Models\UnidadAdministrativa::find($unidadId);
        $unidadCodigo = $unidad ? $unidad->codigo : 'GEN';
        
        // conteo aislado por unidad y año, incluyendo los borrados lógicos
        $count = $this->repository->getModel()
            ->withTrashed()
            ->whereYear('created_at', $year)
            ->where('tipo', $tipo)
            ->where('unidad_administrativa_id', $unidadId) // aislamiento clave
            ->count();
            
        $nextNumber = $count + 1;
        
        // el folio ahora incluye el código de la unidad (ej.
        $folio = sprintf('%s-%s-%s-%04d', $prefix, $unidadCodigo, $year, $nextNumber);
        
        // bucle de seguridad por colisión
        while ($this->repository->getModel()->withTrashed()->where('folio_sistema', $folio)->exists()) {
            $nextNumber++;
            $folio = sprintf('%s-%s-%s-%04d', $prefix, $unidadCodigo, $year, $nextNumber);
        }
        
        return $folio;
    }
}
