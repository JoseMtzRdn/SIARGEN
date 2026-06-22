<?php

namespace App\Services;

use App\Models\Prestamo;
use App\Models\PrestamoDetalle;
use App\Models\Expediente;
use App\Repositories\PrestamoRepository;
use Illuminate\Support\Facades\DB;
use App\Traits\Auditable;

class PrestamoService extends BaseService
{
    use Auditable;

    public function __construct(PrestamoRepository $repository)
    {
        parent::__construct($repository);
    }

    public function createLoan(array $data)
    {
        return DB::transaction(function () use ($data) {
            $expedientesIds = $data['expedientes_ids'] ?? [];
            if (empty($expedientesIds)) {
                throw new \Exception("Debe seleccionar al menos un expediente.");
            }

            $expedientes = Expediente::whereIn('id', $expedientesIds)->get();
            
            // normalizar fase
            $faseInput = $data['fase'] ?? 'concentracion';
            if ($faseInput === 'tramite' || $faseInput == Expediente::FASE_TRAMITE) {
                $faseId = Expediente::FASE_TRAMITE;
                $faseNombre = 'tramite';
            } else {
                $faseId = Expediente::FASE_CONCENTRACION;
                $faseNombre = 'concentracion';
            }

            // validar disponibilidad de todos
            foreach ($expedientes as $exp) {
                if ($exp->estatus_disponibilidad !== Expediente::STATUS_DISPONIBLE) {
                    throw new \Exception("El expediente {$exp->numero_expediente} no está disponible.");
                }

                if ($exp->fase !== $faseId) {
                    throw new \Exception("El expediente {$exp->numero_expediente} no pertenece al Archivo de " . ucfirst($faseNombre) . ".");
                }

                if ($exp->estado_archivo === Expediente::STATE_CERRADO_SUBSANACION) {
                    throw new \Exception("El expediente {$exp->numero_expediente} se encuentra en proceso de subsanación y no puede ser prestado.");
                }
            }

            $user = auth()->user();
            
            if (empty($data['unidad_administrativa_id'])) {
                throw new \Exception("Debe seleccionar la unidad administrativa responsable del préstamo.");
            }

            $now = now();
            // Homologa la hora de vencimiento con la del préstamo.
            $fechaVencimiento = \Carbon\Carbon::parse($data['fecha_vencimiento'])
                ->setTime($now->hour, $now->minute, $now->second);

            $header = [
                'usuario_presta_id' => $user->id,
                'unidad_administrativa_id' => $data['unidad_administrativa_id'],
                'fase' => $faseId,
                'folio_prestamo' => $this->generateFolio($data['unidad_administrativa_id'], $faseNombre),
                'nombre' => $data['nombre'],
                'apellido_paterno' => $data['apellido_paterno'],
                'apellido_materno' => $data['apellido_materno'],
                'cargo_solicitante' => $data['cargo_solicitante'],
                'unidad_solicitante' => $data['unidad_solicitante'] ?? null,
                'telefono' => $data['telefono'],
                'extension' => $data['extension'] ?? null,
                'fecha_prestamo' => $now,
                'fecha_vencimiento' => $fechaVencimiento,
                'estatus' => 'prestado',
                'observaciones' => $data['observaciones'] ?? null
            ];

            $prestamo = $this->repository->create($header);

            $estadoSalida = $data['estado_salida'] ?? 'bueno';

            // crear detalles y bloquear expedientes
            foreach ($expedientes as $exp) {
                PrestamoDetalle::create([
                    'prestamo_id' => $prestamo->id,
                    'expediente_id' => $exp->id,
                    'estatus' => 'prestado',
                    'estado_salida' => $estadoSalida
                ]);

                $exp->update(['estatus_disponibilidad' => Expediente::STATUS_PRESTADO]);
            }

            $this->audit($prestamo, 'prestamo_creado_multiple', null, [
                'folio' => $prestamo->folio_prestamo,
                'cantidad' => count($expedientesIds)
            ]);

            return $prestamo->load(['detalles.expediente', 'usuarioPresta', 'unidadAdministrativa']);
        });
    }

    public function returnExpediente($detalleId, array $data = [])
    {
        return DB::transaction(function () use ($detalleId, $data) {
            $detalle = PrestamoDetalle::with('prestamo', 'expediente')->findOrFail($detalleId);
            
            if ($detalle->estatus === 'devuelto') {
                throw new \Exception("Este expediente ya fue devuelto.");
            }

            $detalle->update([
                'estatus' => 'devuelto',
                'fecha_devolucion' => now(),
                'estado_devolucion' => $data['estado_devolucion'] ?? 'bueno',
                'observaciones_devolucion' => $data['observaciones'] ?? null
            ]);

            $detalle->expediente->update([
                'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE
            ]);

            // verificar si todo el vale ya se completó
            $prestamo = $detalle->prestamo;
            $pendientes = $prestamo->detalles()->where('estatus', 'prestado')->count();

            if ($pendientes === 0) {
                $prestamo->update([
                    'estatus' => 'devuelto',
                    'fecha_devolucion' => now()
                ]);
            }

            return $prestamo->load('detalles.expediente');
        });
    }

    private function generateFolio($unidadId, $fase = 'concentracion')
    {
        $year = date('Y');
        
        $unidad = \App\Models\UnidadAdministrativa::find($unidadId);
        $unidadCodigo = $unidad ? $unidad->codigo : 'GEN';

        $isTramite = ($fase === 'tramite' || $fase == Expediente::FASE_TRAMITE);
        $tipo = $isTramite ? 'VT' : 'VC';
        $faseId = $isTramite ? Expediente::FASE_TRAMITE : Expediente::FASE_CONCENTRACION;
        
        $prefix = sprintf('%s-%s-%s', $tipo, $unidadCodigo, $year);

        $count = Prestamo::whereYear('created_at', $year)
            ->where('unidad_administrativa_id', $unidadId)
            ->where('fase', $faseId)
            ->count() + 1;

        $folio = sprintf('%s-%04d', $prefix, $count);

        // bucle de seguridad anti-colisiones (considerando soft deletes)
        while (Prestamo::withTrashed()->where('folio_prestamo', $folio)->exists()) {
            $count++;
            $folio = sprintf('%s-%04d', $prefix, $count);
        }

        return $folio;
    }
}
