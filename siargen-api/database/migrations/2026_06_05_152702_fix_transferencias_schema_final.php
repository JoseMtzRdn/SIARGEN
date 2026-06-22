<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Renombrar columnas si existen usando SQL crudo para evitar conflictos con Doctrine DBAL
        if (Schema::hasColumn('transferencias', 'folio')) {
            DB::statement('ALTER TABLE transferencias CHANGE COLUMN folio numero_transferencia VARCHAR(255) NOT NULL');
        }
        
        if (Schema::hasColumn('transferencias', 'unidad_administrativa_id')) {
            DB::statement('ALTER TABLE transferencias CHANGE COLUMN unidad_administrativa_id unidad_origen_id BIGINT UNSIGNED NOT NULL');
        }
        
        if (Schema::hasColumn('transferencias', 'enviado_por')) {
            DB::statement('ALTER TABLE transferencias CHANGE COLUMN enviado_por usuario_envia_id BIGINT UNSIGNED NOT NULL');
        }

        if (Schema::hasColumn('transferencias', 'archivo_inventario')) {
            DB::statement('ALTER TABLE transferencias CHANGE COLUMN archivo_inventario archivo_inventario_path VARCHAR(255) NULL');
        }

        // Añadir columnas faltantes si no existen
        Schema::table('transferencias', function (Blueprint $table) {
            if (!Schema::hasColumn('transferencias', 'usuario_tua_id')) {
                $table->foreignId('usuario_tua_id')->nullable()->constrained('users')->after('usuario_envia_id');
            }
            if (!Schema::hasColumn('transferencias', 'usuario_valida_id')) {
                $table->foreignId('usuario_valida_id')->nullable()->constrained('users')->after('usuario_tua_id');
            }
            if (!Schema::hasColumn('transferencias', 'usuario_recibe_id')) {
                $table->foreignId('usuario_recibe_id')->nullable()->constrained('users')->after('usuario_valida_id');
            }
            if (!Schema::hasColumn('transferencias', 'fecha_recepcion')) {
                $table->timestamp('fecha_recepcion')->nullable()->after('fecha_envio');
            }
            if (!Schema::hasColumn('transferencias', 'fecha_autorización_tua')) {
                $table->timestamp('fecha_autorización_tua')->nullable()->after('fecha_recepcion');
            }
            if (!Schema::hasColumn('transferencias', 'fecha_validacion')) {
                $table->timestamp('fecha_validacion')->nullable()->after('fecha_autorización_tua');
            }
            if (!Schema::hasColumn('transferencias', 'motivo_rechazo')) {
                $table->text('motivo_rechazo')->nullable()->after('observaciones');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('transferencias', function (Blueprint $table) {
            $table->dropForeign(['usuario_tua_id']);
            $table->dropForeign(['usuario_valida_id']);
            $table->dropForeign(['usuario_recibe_id']);
            
            $table->dropColumn([
                'usuario_tua_id', 
                'usuario_valida_id', 
                'usuario_recibe_id',
                'fecha_recepcion',
                'fecha_autorización_tua',
                'fecha_validacion',
                'motivo_rechazo'
            ]);
        });

        DB::statement('ALTER TABLE transferencias CHANGE COLUMN numero_transferencia folio VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE transferencias CHANGE COLUMN unidad_origen_id unidad_administrativa_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE transferencias CHANGE COLUMN usuario_envia_id enviado_por BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE transferencias CHANGE COLUMN archivo_inventario_path archivo_inventario VARCHAR(255) NULL');
    }
};
