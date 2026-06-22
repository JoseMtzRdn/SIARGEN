<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;

class VigenciaController extends Controller
{
    use ApiResponseTrait;

    // Obtiene expedientes elegibles para transferencia primaria.
    public function checkVigenciasTransferencias()
    {
        $user = auth()->user();
        
        // solo procesar si el usuario tiene rol operativo (rat)
        if (!$user->isRat()) {
            return $this->successResponse(['count' => 0], 'No autorizado para esta verificación');
        }

        // buscar expedientes en trámite, disponibles y cerrados
        $expedientes = Expediente::with('serie')
            ->where('unidad_administrativa_id', $user->unidad_administrativa_id)
            ->where('fase', Expediente::FASE_TRAMITE)
            ->where('estatus_disponibilidad', Expediente::STATUS_DISPONIBLE)
            ->where('estado_archivo', Expediente::STATE_CERRADO)
            ->whereNotNull('fecha_cierre')
            ->get();

        $now = now();
        $vencidos = [];

        foreach ($expedientes as $exp) {
            // el plazo se obtiene de la serie vinculada
            $plazo = $exp->serie?->vigencia_tramite ?? 0;
            
            $expiration = $exp->fecha_cierre->copy()->addMinutes($plazo ?: 1);

            if ($now->greaterThanOrEqualTo($expiration)) {
                $vencidos[] = [
                    'id' => $exp->id,
                    'numero_expediente' => $exp->numero_expediente,
                    'titulo' => $exp->titulo,
                    'fecha_limite' => $expiration->format('Y-m-d H:i'),
                    'tipo_transferencia' => 'primaria',
                    'vencido' => true
                ];
            }
        }

        return $this->successResponse([
            'vencidos' => $vencidos,
            'count' => count($vencidos),
            'timestamp' => now()->toDateTimeString()
        ], 'Verificación de vigencias de transferencia completada');
    }

    // verificar préstamos vencidos (rac)
    public function checkVigenciasPrestamos()
    {
        $user = auth()->user();

        // solo procesar si el usuario tiene rol rac o admin
        if (!$user->isRac() && !$user->isAdminTi()) {
            return $this->successResponse(['count' => 0], 'No autorizado para esta verificación');
        }

        $prestamosVencidos = \App\Models\Prestamo::where('unidad_administrativa_id', $user->unidad_administrativa_id)
            ->where('estatus', 'prestado')
            ->where('fecha_vencimiento', '<', now())
            ->with(['detalles.expediente'])
            ->get();

        $vencidos = [];
        foreach ($prestamosVencidos as $prestamo) {
            $vencidos[] = [
                'id' => $prestamo->id,
                'folio_prestamo' => $prestamo->folio_prestamo,
                'solicitante' => $prestamo->nombre_completo,
                'fecha_vencimiento' => $prestamo->fecha_vencimiento->format('Y-m-d H:i'),
                'expedientes_count' => $prestamo->detalles->count(),
                'vencido' => true
            ];
        }

        return $this->successResponse([
            'vencidos' => $vencidos,
            'count' => count($vencidos),
            'timestamp' => now()->toDateTimeString()
        ], 'Verificación de préstamos vencidos completada');
    }
}
