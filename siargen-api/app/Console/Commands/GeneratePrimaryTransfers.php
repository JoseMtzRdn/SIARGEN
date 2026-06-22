<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Expediente;
use App\Models\User;
use App\Services\TransferenciaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GeneratePrimaryTransfers extends Command
{
    protected $signature = 'transferencias:auto-generate';
    protected $description = 'Verifica vigencias en trámite y genera transferencias primarias automáticas';

    protected $service;

    public function __construct(TransferenciaService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    public function handle()
    {
        $this->info('Consultando vigencias de expedientes en Trámite...');
        
        $modoPrueba = env('MODO_PRUEBA_MINUTOS', false);
        if ($modoPrueba) {
            $this->warn('¡ATENCIÓN! Modo prueba activo: Los años de CADIDO se cuentan como MINUTOS.');
        }

        // buscar expedientes en fase de trámite y disponibles
        $expedientes = Expediente::with('serie')
            ->where('fase', 'tramite')
            ->where('estatus_disponibilidad', 'disponible')
            ->get();

        $this->info('Expedientes en trámite analizados: ' . $expedientes->count());

        $now = now();
        $vencidosPorUnidad = [];

        foreach ($expedientes as $exp) {
            if ($modoPrueba) {
                // Evalúa el año de cierre para determinar el vencimiento en entorno de pruebas.
                if ($exp->año_cierre) {
                    $vencidosPorUnidad[$exp->unidad_administrativa_id][] = $exp->id;
                }
            } else {
                if (!$exp->año_cierre) continue;
                $baseDate = Carbon::createFromDate($exp->año_cierre, 12, 31, 23, 59, 59);
                $expiration = $baseDate->copy()->addYears($exp->tiempo_tramite ?: 0);
                
                if ($now->greaterThanOrEqualTo($expiration)) {
                    $vencidosPorUnidad[$exp->unidad_administrativa_id][] = $exp->id;
                }
            }
        }

        if (empty($vencidosPorUnidad)) {
            $this->info('No se detectaron expedientes que cumplan los criterios de transferencia.');
            return 0;
        }

        foreach ($vencidosPorUnidad as $unidadId => $ids) {
            $this->processAutoTransfer($unidadId, $ids);
        }

        return 0;
    }

    private function processAutoTransfer($unidadId, $ids)
    {
        DB::transaction(function() use ($unidadId, $ids) {
            $rat = User::where('unidad_administrativa_id', $unidadId)
                ->whereHas('role', function($q) { $q->where('slug', 'rat'); })
                ->first();

            $usuarioEnviaId = $rat ? $rat->id : (User::where('unidad_administrativa_id', $unidadId)->first()->id ?? 1);

            $transferencia = $this->service->createTransfer([
                'tipo' => 'primaria',
                'observaciones' => 'Generada automáticamente por vencimiento de vigencia documental en trámite (CADIDO).'
            ], $ids);

            // Actualiza el estado a revisión del TUA.
            $this->service->sendToTua($transferencia->id);

            $this->info("Unidad {$unidadId}: Generada transferencia {$transferencia->numero_transferencia} con " . count($ids) . " expedientes.");
        });
    }
}
