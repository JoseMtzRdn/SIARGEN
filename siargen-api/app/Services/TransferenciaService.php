<?php

namespace App\Services;

use App\Models\Transferencia;
use App\Models\Expediente;
use App\Repositories\TransferenciaRepository;
use Illuminate\Support\Facades\DB;
use App\Traits\Auditable;

class TransferenciaService extends BaseService
{
    use Auditable;

    public function __construct(TransferenciaRepository $repository)
    {
        parent::__construct($repository);
    }

    // Registra una nueva transferencia documental.
    public function createTransfer(array $data, array $expedienteIds)
    {
        // 0.
        if (!empty($expedienteIds)) {
            $conflictos = Transferencia::whereHas('expedientes', function($q) use ($expedienteIds) {
                $q->whereIn('expedientes.id', $expedienteIds);
            })
            ->whereIn('estatus', ['rechazada_tua', 'rechazada_coordinador', 'rechazada_rac', 'rechazada_rah'])
            ->get();
            
            if ($conflictos->count() > 0) {
                throw new \Exception('No se pueden asignar expedientes que ya pertenecen a una transferencia en proceso de subsanación (Transferencia(s): ' . $conflictos->pluck('numero_transferencia')->implode(', ') . ').');
            }
        }

        return DB::transaction(function () use ($data, $expedienteIds) {
            $user = auth()->user();
            
            
            $primerExpediente = Expediente::findOrFail($expedienteIds[0]);
            
            if ((int)$primerExpediente->fase === Expediente::FASE_TRAMITE) {
                $data['tipo'] = 'primaria';
            } elseif ((int)$primerExpediente->fase === Expediente::FASE_CONCENTRACION) {
                $data['tipo'] = 'secundaria';
            } else {
                // Determina la fase de transferencia según el rol del usuario.
                $data['tipo'] = ($user && $user->isRac()) ? 'secundaria' : ($data['tipo'] ?? 'primaria');
            }

            if ($user) {
                $data['usuario_envia_id'] = $user->id;
                $data['unidad_origen_id'] = $user->unidad_administrativa_id;
            } else {
                $data['usuario_envia_id'] = $data['usuario_envia_id'] ?? 1;
                $data['unidad_origen_id'] = $data['unidad_origen_id'] ?? 1;
            }

            $data['numero_transferencia'] = $this->generateFolio($data['tipo']);
            $data['estatus'] = 'elaboracion';

            $transferencia = $this->repository->create($data);
            $transferencia->expedientes()->attach($expedienteIds);

            // Bloquea los expedientes incluidos en la transferencia.
            Expediente::whereIn('id', $expedienteIds)->update([
                'estatus_disponibilidad' => Expediente::STATUS_EN_TRANSFERENCIA
            ]);

            $this->audit($transferencia, 'transferencia_iniciada', null, $transferencia->toArray());

            return $transferencia;
        });
    }

    // rat envía a revisión de su tua
    public function sendToTua($id)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia) {
            $transferencia->update(['estatus' => 'revision_tua']);

            // notificar al tua de la unidad
            $tuas = \App\Models\User::where('unidad_administrativa_id', $transferencia->unidad_origen_id)
                ->whereHas('role', function($q) { $q->where('slug', 'tua'); })->get();
            
            foreach ($tuas as $tua) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $tua->id,
                    'Autorización de Transferencia',
                    "El RAT de tu unidad solicita autorización para la transferencia {$transferencia->numero_transferencia}.",
                    'info',
                    "/tua/transferencias/{$transferencia->id}"
                );
            }

            return $transferencia;
        });
    }

    // Registra la autorización del TUA y remite la transferencia al Coordinador.
    public function authorizeByTua($id)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia) {
            $transferencia->update([
                'estatus' => 'revision_coordinador',
                'usuario_tua_id' => auth()->id(),
                'fecha_autorización_tua' => now()
            ]);

            // notificar al coordinador
            $coordinadores = \App\Models\User::whereHas('role', function($q) { $q->where('slug', 'coord_archivos'); })->get();
            foreach ($coordinadores as $coord) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $coord->id,
                    'Nueva Transferencia por Validar',
                    "La unidad {$transferencia->unidadOrigen->nombre} ha enviado la transferencia {$transferencia->numero_transferencia} (Autorizada por TUA).",
                    'info',
                    "/admin/transferencias/{$transferencia->id}"
                );
            }

            return $transferencia;
        });
    }

    // Registra el rechazo de la transferencia por el TUA.
    public function rejectByTua($id, $motivo)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia, $motivo) {
            $transferencia->update([
                'estatus' => 'rechazada_tua',
                'motivo_rechazo' => $motivo,
                'usuario_tua_id' => auth()->id()
            ]);

            // poner expedientes en modo subsanación
            foreach ($transferencia->expedientes as $expediente) {
                $expediente->update([
                    'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE,
                    'estado_archivo' => Expediente::STATE_CERRADO_SUBSANACION
                ]);
            }

            // notificar al rat
            \App\Http\Controllers\Api\NotificationController::push(
                $transferencia->usuario_envia_id,
                'Transferencia Rechazada por TUA',
                "Tu titular ha rechazado la transferencia {$transferencia->numero_transferencia}: {$motivo}",
                'error'
            );

            return $transferencia;
        });
    }

    // Registra la validación y autorización del Coordinador de Archivos.
    public function validateByCoordinator($id)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia) {
            $transferencia->update([
                'estatus' => 'autorizada',
                'usuario_valida_id' => auth()->id(),
                'fecha_validacion' => now()
            ]);

            // notificar al rat
            \App\Http\Controllers\Api\NotificationController::push(
                $transferencia->usuario_envia_id,
                'Transferencia Validada Técnicamente',
                "El Coordinador ha validado la transferencia {$transferencia->numero_transferencia}. Ya puedes enviarla al RAC.",
                'success'
            );

            return $transferencia;
        });
    }

    // Registra el rechazo de la transferencia por el Coordinador.
    public function rejectByCoordinator($id, $motivo)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia, $motivo) {
            $transferencia->update([
                'estatus' => 'rechazada_coordinador',
                'motivo_rechazo' => $motivo,
                'usuario_valida_id' => auth()->id()
            ]);

            // poner expedientes en modo subsanación
            foreach ($transferencia->expedientes as $expediente) {
                $expediente->update([
                    'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE,
                    'estado_archivo' => Expediente::STATE_CERRADO_SUBSANACION
                ]);
            }

            // notificar al rat
            \App\Http\Controllers\Api\NotificationController::push(
                $transferencia->usuario_envia_id,
                'Transferencia Rechazada por Coordinador',
                "La transferencia {$transferencia->numero_transferencia} no cumple con la normatividad: {$motivo}",
                'error'
            );

            return $transferencia;
        });
    }

    // el rat envía físicamente al rac
    public function sendToConcentracion($id)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia) {
            $transferencia->update([
                'estatus' => 'en_transito',
                'fecha_envio' => now()
            ]);

            // notificar a los rac
            $racs = \App\Models\User::whereHas('role', function($q) { $q->where('slug', 'rac'); })->get();
            foreach ($racs as $rac) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $rac->id,
                    'Transferencia en Camino',
                    "La unidad {$transferencia->unidadOrigen->nombre} ha enviado físicamente la transferencia {$transferencia->numero_transferencia}.",
                    'warning',
                    "/concentracion/recepciones"
                );
            }

            return $transferencia;
        });
    }

    public function sendToHistorico($id)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia) {
            $transferencia->update([
                'estatus' => 'en_transito',
                'fecha_envio' => now()
            ]);

            // notificar a los rah (archivo histórico)
            $rahs = \App\Models\User::whereHas('role', function($q) { $q->where('slug', 'rah'); })->get();
            foreach ($rahs as $rah) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $rah->id,
                    'Transferencia Secundaria en Camino',
                    "Se ha enviado físicamente la transferencia secundaria {$transferencia->numero_transferencia}.",
                    'warning',
                    "/historico/recepciones"
                );
            }

            return $transferencia;
        });
    }

    // Registra la recepción física y aceptación por el RAC o RAH.
    public function receiveTransfer($id)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia) {
            $transferencia->update([
                'estatus' => 'recibida',
                'usuario_recibe_id' => auth()->id(),
                'fecha_recepcion' => now()
            ]);

            // Normaliza la capitalización del tipo de fase.
            $tipoNormalizado = strtolower($transferencia->tipo);
            $nuevaFase = $tipoNormalizado === 'primaria' ? Expediente::FASE_CONCENTRACION : Expediente::FASE_HISTORICO;

            // Integra los expedientes al archivo de destino.
            foreach ($transferencia->expedientes as $expediente) {
                $expediente->update([
                    'fase' => $nuevaFase,
                    'estado_archivo' => Expediente::STATE_CERRADO, // resetear estado para evitar que siga en subsanación
                    'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE,
                    'ubicacion_seccion' => null,
                    'ubicacion_bateria' => null,
                    'ubicacion_modulo' => null,
                    'ubicacion_entrepaño' => null
                ]);
            }

            // notificar al emisor
            \App\Http\Controllers\Api\NotificationController::push(
                $transferencia->usuario_envia_id,
                'Transferencia Recibida con Éxito',
                "La transferencia {$transferencia->numero_transferencia} ha sido integrada al Archivo de " . ($tipoNormalizado === 'primaria' ? 'Concentración' : 'Histórico') . ".",
                'success'
            );

            return $transferencia;
        });
    }

    // Registra el rechazo físico de la transferencia por el RAC.
    public function rejectByRac($id, $motivo)
    {
        $transferencia = $this->find($id);
        
        return DB::transaction(function () use ($transferencia, $motivo) {
            $transferencia->update([
                'estatus' => 'rechazada_rac',
                'motivo_rechazo' => $motivo,
                'usuario_recibe_id' => auth()->id()
            ]);

            // poner expedientes en modo subsanación
            foreach ($transferencia->expedientes as $expediente) {
                $expediente->update([
                    'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE,
                    'estado_archivo' => Expediente::STATE_CERRADO_SUBSANACION
                ]);
            }

            // notificar al rat
            \App\Http\Controllers\Api\NotificationController::push(
                $transferencia->usuario_envia_id,
                'Transferencia Rechazada por RAC',
                "La transferencia {$transferencia->numero_transferencia} fue rechazada por el RAC: {$motivo}",
                'error'
            );

            return $transferencia;
        });
    }

    public function updateSubsanacion($id, array $expedienteIds, array $subsanacionIds = [], $observaciones = null)
    {
        $transferencia = $this->find($id);
        
        // 0.
        $idsActuales = $transferencia->expedientes->pluck('id')->toArray();
        $nuevosIds = array_diff($expedienteIds, $idsActuales);

        if (!empty($nuevosIds)) {
            $conflictos = Transferencia::whereHas('expedientes', function($q) use ($nuevosIds) {
                $q->whereIn('expedientes.id', $nuevosIds);
            })
            ->where('id', '!=', $id)
            ->whereIn('estatus', ['rechazada_tua', 'rechazada_coordinador', 'rechazada_rac', 'rechazada_rah'])
            ->get();
            
            if ($conflictos->count() > 0) {
                throw new \Exception('No se pueden asignar expedientes que ya pertenecen a otra transferencia en proceso de subsanación (Transferencia(s): ' . $conflictos->pluck('numero_transferencia')->implode(', ') . ').');
            }
        }

        return DB::transaction(function () use ($transferencia, $expedienteIds, $observaciones, $idsActuales) {
            // 0.
            $idsSubsanablesPrevia = Expediente::whereIn('id', $idsActuales)
                ->where('estado_archivo', Expediente::STATE_CERRADO_SUBSANACION)
                ->pluck('id')
                ->toArray();

            // 1.
            $idsAEliminar = array_diff($idsActuales, $expedienteIds);

            // 2.
            if (!empty($idsAEliminar)) {
                Expediente::whereIn('id', $idsAEliminar)->update([
                    'estado_archivo' => Expediente::STATE_CERRADO,
                    'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE
                ]);
            }

            // 3.
            $transferencia->expedientes()->sync($expedienteIds);

            if (!empty($expedienteIds)) {
                Expediente::whereIn('id', $expedienteIds)->update([
                    'estado_archivo' => Expediente::STATE_CERRADO_SUBSANACION
                ]);
            }
            
            $transferencia->update([
                'observaciones' => $observaciones ?? $transferencia->observaciones
            ]);

            return $transferencia;
        });
    }

    // Reenvía la transferencia tras aplicar subsanación.
    public function resubmitAfterSubsanacion($id, array $expedienteIds = [], array $subsanacionIds = [], $observaciones = null)
    {
        $transferencia = $this->find($id);

        return DB::transaction(function () use ($transferencia, $expedienteIds, $subsanacionIds, $observaciones) {
            // 1.
            if (!empty($expedienteIds)) {
                $this->updateSubsanacion($id, $expedienteIds, $subsanacionIds, $observaciones);
            }

            // 2.
            $actuales = $transferencia->expedientes->pluck('id')->toArray();
            Expediente::whereIn('id', $actuales)->update([
                'estatus_disponibilidad' => Expediente::STATUS_EN_TRANSFERENCIA,
                'estado_archivo' => Expediente::STATE_CERRADO
            ]);

            // 3.
            $transferencia->update([
                'estatus' => 'revision_tua',
                'motivo_rechazo' => null,
                'observaciones' => $observaciones ?? $transferencia->observaciones
            ]);

            // 4.
            $tuas = \App\Models\User::where('unidad_administrativa_id', $transferencia->unidad_origen_id)
                ->whereHas('role', function($q) { $q->where('slug', 'tua'); })->get();
            
            foreach ($tuas as $tua) {
                \App\Http\Controllers\Api\NotificationController::push(
                    $tua->id,
                    'Transferencia Corregida y Re-enviada',
                    "El RAT ha corregido los expedientes de la transferencia {$transferencia->numero_transferencia} y solicita su revisión nuevamente.",
                    'info',
                    "/tua/transferencias/{$transferencia->id}"
                );
            }

            $this->audit($transferencia, 'transferencia_re-enviada_subsanacion', null, [
                'estatus' => 'revision_tua',
                'expedientes_count' => count($actuales)
            ]);

            return $transferencia;
        });
    }

    // lógica común para sincronizar expedientes durante la subsanación
    protected function syncExpedientesSubsanacion($transferencia, array $expedienteIds)
    {
        // 1.
        $idsActuales = $transferencia->expedientes->pluck('id')->toArray();
        $idsAEliminar = array_diff($idsActuales, $expedienteIds);

        // 2.
        if (!empty($idsAEliminar)) {
            Expediente::whereIn('id', $idsAEliminar)->update([
                'estado_archivo' => Expediente::STATE_CERRADO,
                'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE
            ]);
        }

        // 3.
        $transferencia->expedientes()->sync($expedienteIds);

        // 4.
        Expediente::whereIn('id', $expedienteIds)->update([
            'estado_archivo' => Expediente::STATE_CERRADO,
            'estatus_disponibilidad' => Expediente::STATUS_EN_TRANSFERENCIA
        ]);
    }

    private function generateFolio($tipo)
    {
        $tipoLower = strtolower($tipo);
        $prefix = ($tipoLower === 'primaria') ? 'TP' : 'TS';
        $year = date('Y');
        
        $user = auth()->user();
        $unidadId = $user ? $user->unidad_administrativa_id : 1;
        
        $unidad = \App\Models\UnidadAdministrativa::find($unidadId);
        $unidadCodigo = $unidad ? $unidad->codigo : 'GEN';

        $count = Transferencia::whereYear('created_at', $year)
            ->where('tipo', $tipoLower)
            ->where('unidad_origen_id', $unidadId) // aislamiento del contador
            ->count() + 1;
            
        return sprintf('%s-%s-%s-%04d', $prefix, $unidadCodigo, $year, $count);
    }
}
