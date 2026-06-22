<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Expediente;
use App\Models\Correspondencia;
use App\Models\UnidadAdministrativa;
use Tests\TestCase;

class CorrespondenceIntegrityAuditTest extends TestCase
{
    public function test_correspondence_integrity_and_security()
    {
        echo "\n--- INICIANDO AUDITORIA DE CORRESPONDENCIA E INTEGRIDAD ---\n";

        // login como fernandarat
        $rat = User::where('username', 'fernandarat')->first();
        $this->actingAs($rat);

        // seguridad de aislamiento
        echo "⏳ Paso 1: Probando seguridad de aislamiento (BOLA/FALA)...\n";
        $unidadAjena = UnidadAdministrativa::where('codigo', '!=', 'DG')->first();
        $expedienteAjeno = Expediente::where('unidad_administrativa_id', $unidadAjena->id)->first();
        $documentoDG = Correspondencia::where('unidad_administrativa_id', $rat->unidad_administrativa_id)->first();

        if ($expedienteAjeno && $documentoDG) {
            $response = $this->postJson("/api/correspondencia/{$documentoDG->id}/archivar", [
                'expediente_id' => $expedienteAjeno->id
            ]);
            
            if ($response->status() === 422 || $response->status() === 403) {
                echo "✅ Seguridad: Bloqueo de cruce de unidades exitoso.\n";
            } else {
                echo "❌ Error: El sistema permitió archivar un documento en una unidad ajena.\n";
            }
        }

        // re-archivado y recalculo
        echo "⏳ Paso 2: Probando re-archivado y recálculo de fojas...\n";
        $expedientes = Expediente::where('unidad_administrativa_id', $rat->unidad_administrativa_id)->limit(2)->get();
        if ($expedientes->count() == 2) {
            $expA = $expedientes[0];
            $expB = $expedientes[1];
            $expA->update(['estado_archivo' => Expediente::STATE_ABIERTO, 'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE, 'fase' => Expediente::FASE_TRAMITE]);
            $expB->update(['estado_archivo' => Expediente::STATE_ABIERTO, 'estatus_disponibilidad' => Expediente::STATUS_DISPONIBLE, 'fase' => Expediente::FASE_TRAMITE]);
            $documento = Correspondencia::where('unidad_administrativa_id', $rat->unidad_administrativa_id)->first();
            $documento->update(['num_fojas' => 10, 'expediente_id' => null, 'estatus' => 'PENDIENTE']);
            
            // Archivar en A
            $resA = $this->postJson("/api/correspondencia/{$documento->id}/archivar", ['expediente_id' => $expA->id]);
            if ($resA->status() !== 200) {
                echo "❌ Archivar A Error: " . json_encode($resA->json(), JSON_PRETTY_PRINT) . "\n";
            }
            $fojasA_antes = Expediente::find($expA->id)->num_fojas;
            
            // Mover a B
            $resB = $this->postJson("/api/correspondencia/{$documento->id}/cambiar-expediente", [
                'nuevo_expediente_id' => $expB->id,
                'motivo' => 'Corrección por auditoría automatizada'
            ]);
            if ($resB->status() !== 200) {
                echo "❌ Cambiar Exp Error: " . json_encode($resB->json(), JSON_PRETTY_PRINT) . "\n";
            }
            
            $fojasA_despues = Expediente::find($expA->id)->num_fojas;
            if ($fojasA_despues < $fojasA_antes) {
                echo "✅ Integridad: Recálculo de fojas (Decremento) exitoso.\n";
            } else {
                echo "❌ Error: Las fojas no se restaron del expediente origen.\n";
            }
        }

        // bloqueo de eliminacion
        echo "⏳ Paso 3: Probando bloqueo de eliminación para archivados...\n";
        $docArchivado = Correspondencia::where('estatus', 'ARCHIVADO')->first();
        if ($docArchivado) {
            $response = $this->deleteJson("/api/correspondencia/{$docArchivado->id}", [
                'motivo' => 'Intento de eliminación prohibida'
            ]);
            
            if ($response->status() === 422) {
                echo "✅ Seguridad: Bloqueo de eliminación de documento archivado exitoso.\n";
            } else {
                echo "❌ Error: El sistema permitió eliminar un documento archivado.\n";
            }
        }

        echo "--- AUDITORIA DE CORRESPONDENCIA FINALIZADA ---\n";
    }
}
