<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->dropColumn([
                'fecha_recepcion',
                'persona_recibe',
                'descripcion_anexos_fisicos',
                'observaciones',
                'cargo_remitente',
                'institucion_remitente'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->datetime('fecha_recepcion')->nullable()->after('fecha');
            $table->string('persona_recibe', 100)->nullable()->after('fecha_limite_respuesta');
            $table->string('descripcion_anexos_fisicos', 255)->nullable()->after('num_fojas');
            $table->string('observaciones', 255)->nullable()->after('prioridad');
        });
    }
};
