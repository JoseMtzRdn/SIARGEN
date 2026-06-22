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
            // Eliminamos columnas con nombres viejos o tipos incorrectos
            $table->dropColumn(['folio_interno', 'numero_oficio', 'fecha_emision', 'estatus']);
        });

        Schema::table('correspondencias', function (Blueprint $table) {
            // Recreamos con nombres correctos y tipos alineados al modelo
            $table->string('folio_sistema')->unique()->after('serie_id');
            $table->enum('tipo', ['ENTRADA', 'SALIDA'])->after('folio_sistema');
            $table->string('num_oficio')->nullable()->after('tipo');
            $table->date('fecha')->after('num_oficio');
            
            $table->string('destinatario', 100)->nullable()->after('remitente');
            $table->enum('prioridad', ['baja', 'media', 'alta', 'urgente'])->default('media')->after('asunto');
            $table->string('observaciones', 255)->nullable()->after('prioridad');
            $table->string('clase_documento', 50)->nullable()->after('observaciones');
            $table->string('descripcion_anexos_fisicos', 255)->nullable()->after('num_fojas');
            $table->date('fecha_limite_respuesta')->nullable()->after('descripcion_anexos_fisicos');
            $table->string('persona_recibe', 100)->nullable()->after('fecha_limite_respuesta');
            $table->string('documento_pdf_path')->nullable()->after('persona_recibe');
            
            $table->foreignId('user_id')->nullable()->after('unidad_administrativa_id')->constrained('users')->onDelete('set null');
            $table->string('estatus', 20)->default('PENDIENTE')->after('subserie_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'folio_sistema', 'tipo', 'num_oficio', 'fecha', 'destinatario', 
                'prioridad', 'observaciones', 'clase_documento', 
                'descripcion_anexos_fisicos', 'fecha_limite_respuesta', 
                'persona_recibe', 'documento_pdf_path', 'user_id', 'estatus'
            ]);
            
            $table->string('folio_interno')->unique();
            $table->string('numero_oficio')->nullable();
            $table->date('fecha_emision');
            $table->tinyInteger('estatus')->default(1);
        });
    }
};
