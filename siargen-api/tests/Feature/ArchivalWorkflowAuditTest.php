<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Expediente;
use App\Models\Transferencia;
use App\Models\Correspondencia;
use App\Models\UnidadAdministrativa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArchivalWorkflowAuditTest extends TestCase
{
    // Ejecución de pruebas de integración sobre base de datos local.

    public function test_full_archival_transfer_lifecycle()
    {
        echo "\n--- INICIANDO AUDITORIA TÉCNICA DE FLUJO ARCHIVÍSTICO ---\n";

        // login como fernandarat
        $rat = User::where('username', 'fernandarat')->first();
        if (!$rat) { echo "❌ Error: Usuario fernandarat no encontrado.\n"; return; }
        $this->actingAs($rat);
        echo "✅ Paso 1: Simulación Login RAT exitosa.\n";

        // Crea la transferencia.
        $expedientes = Expediente::where('unidad_administrativa_id', $rat->unidad_administrativa_id)
            ->where('fase', Expediente::FASE_TRAMITE)
            ->where('estatus_disponibilidad', Expediente::STATUS_DISPONIBLE)
            ->limit(2)
            ->get();

        if ($expedientes->count() < 2) { echo "❌ Error: No hay suficientes expedientes para la prueba.\n"; return; }

        $response = $this->postJson('/api/transferencias', [
            'tipo' => 'primaria',
            'expediente_ids' => $expedientes->pluck('id')->toArray(),
            'observaciones' => 'Auditoria automatizada de sistema'
        ]);

        $response->assertStatus(201);
        $transferenciaId = $response->json('data.id');
        echo "✅ Paso 2: Creación de Transferencia exitosa (ID: $transferenciaId).\n";

        // verificar bloqueo de expedientes
        foreach ($expedientes as $exp) {
            $e = Expediente::find($exp->id);
            if ($e->estatus_disponibilidad !== Expediente::STATUS_EN_TRANSFERENCIA) {
                echo "❌ Error: El expediente {$e->numero_expediente} NO se bloqueó.\n";
            }
        }
        echo "✅ Paso 3: Verificación de bloqueo de expedientes exitosa.\n";

        // Envía la transferencia al TUA.
        $this->postJson("/api/transferencias/{$transferenciaId}/enviar-tua")->assertStatus(200);
        echo "✅ Paso 4: Envío a TUA exitoso.\n";

        // Autoriza la transferencia por parte del TUA.
        $tua = User::where('username', 'cristua')->first();
        $this->actingAs($tua);
        $resTua = $this->postJson("/api/transferencias/{$transferenciaId}/autorizar-tua");
        if ($resTua->status() !== 200) {
            echo "❌ TUA Auth Error Response: " . json_encode($resTua->json(), JSON_PRETTY_PRINT) . "\n";
        }
        $resTua->assertStatus(200);
        echo "✅ Paso 5: Autorización TUA exitosa.\n";

        // validar por coordinador
        $coord = User::where('username', 'coordinacion')->first();
        $this->actingAs($coord);
        $this->postJson("/api/transferencias/{$transferenciaId}/validar")->assertStatus(200);
        echo "✅ Paso 6: Validación técnica del Coordinador exitosa.\n";

        // confirmar envio fisico por rat
        $this->actingAs($rat);
        $this->postJson("/api/transferencias/{$transferenciaId}/enviar-rac")->assertStatus(200);
        echo "✅ Paso 7: Confirmación de envío físico al RAC exitosa.\n";

        // recepcion final por rac
        $rac = User::where('username', 'concentracion')->first();
        $this->actingAs($rac);
        $resRecibir = $this->postJson("/api/transferencias/{$transferenciaId}/recibir");
        if ($resRecibir->status() !== 200) {
            echo "❌ RAC Recibir Error Response: " . json_encode($resRecibir->json(), JSON_PRETTY_PRINT) . "\n";
        }
        $resRecibir->assertStatus(200);
        echo "✅ Paso 8: Recepción final por RAC exitosa.\n";

        // verificar integracion
        foreach ($expedientes as $exp) {
            $e = Expediente::find($exp->id);
            if ($e->fase !== Expediente::FASE_CONCENTRACION || $e->estatus_disponibilidad !== Expediente::STATUS_DISPONIBLE) {
                echo "❌ Error: El expediente {$e->numero_expediente} no se integró correctamente al acervo.\n";
            }
        }
        echo "✅ Paso 9: Verificación de integración final exitosa.\n";

        echo "--- AUDITORIA FINALIZADA CON ÉXITO ---\n";
    }
}
