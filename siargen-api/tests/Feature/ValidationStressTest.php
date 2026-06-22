<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UnidadAdministrativa;
use Tests\TestCase;

class ValidationStressTest extends TestCase
{
    public function test_user_and_unit_validation_stress()
    {
        $admin = User::where('username', 'adminti')->first();
        $this->actingAs($admin);

        echo "\n--- INICIANDO TEST DE ESTRÉS DE VALIDACIONES ---\n";

        // validacion de correo electronico largo
        echo "⏳ Caso 1: Probando correo electrónico de 300 caracteres...\n";
        $longEmail = str_repeat('a', 290) . '@isem.gob.mx';
        $response = $this->postJson('/api/users', [
            'nombre' => 'Test',
            'apellido_paterno' => 'Validation',
            'username' => 'stress_user',
            'email' => $longEmail,
            'password' => 'password123',
            'role_id' => 1,
            'unidad_administrativa_id' => 1
        ]);
        
        if ($response->status() === 422) {
            echo "✅ Éxito: El sistema rechazó el correo excesivo.\n";
        } else {
            echo "❌ Fallo: El sistema permitió un correo de > 255 caracteres.\n";
        }

        // Valida el comportamiento ante caracteres especiales.
        echo "⏳ Caso 2: Probando código de unidad con Ñ y acentos (Diseño vs Realidad)...\n";
        $response = $this->postJson('/api/unidades-administrativas', [
            'codigo' => 'UNIDÁÑ',
            'nombre' => 'Unidad de Prueba Estrés',
            'email' => 'estres@isem.gob.mx',
            'telefono' => '1234567890'
        ]);

        if ($response->status() === 422) {
            echo "✅ Éxito: El sistema rechazó caracteres no permitidos en el código.\n";
        } else {
            echo "⚠️ Advertencia: El sistema permitió Ñ/acentos en el código (puede causar errores en folios).\n";
        }

        // validacion de tipo de dato de fojas
        echo "⏳ Caso 3: Probando fojas como texto en correspondencia...\n";
        $response = $this->postJson('/api/correspondencia', [
            'tipo' => 'ENTRADA',
            'fecha' => '2026-05-20',
            'asunto' => 'Asunto de prueba para validación de fojas',
            'num_fojas' => 'CIEN FOJAS', // Texto en lugar de número
            'persona_recibe' => 'Prueba',
            'turnado_a' => 1
        ]);

        if ($response->status() === 422) {
            echo "✅ Éxito: El sistema rechazó fojas en formato texto.\n";
        } else {
            echo "❌ Fallo: El sistema aceptó texto en un campo numérico.\n";
        }

        // validacion de duplicidad de nombre de usuario
        echo "⏳ Caso 4: Probando duplicidad de username...\n";
        $response = $this->postJson('/api/users', [
            'nombre' => 'Admin2',
            'apellido_paterno' => 'Sistema',
            'username' => 'admin', // Ya existe
            'email' => 'admin2@siargen.com',
            'password' => 'password',
            'role_id' => 1,
            'unidad_administrativa_id' => 1
        ]);

        if ($response->status() === 422) {
            echo "✅ Éxito: El sistema impidió duplicar el nombre de usuario.\n";
        } else {
            echo "❌ Fallo: El sistema permitió registrar un username duplicado.\n";
        }

        echo "--- TEST DE ESTRÉS FINALIZADO ---\n";
    }
}
