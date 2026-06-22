<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Ajustar Series Documentales
        Schema::table('series_documentales', function (Blueprint $table) {
            // Reemplazar ubicacion_fisica por Sede y Área
            $table->dropColumn('ubicacion_fisica');
            $table->string('edificio_sede', 100)->nullable()->after('disposicion_final')->comment('Ej. Almacén Central');
            $table->string('area_resguardo', 100)->nullable()->after('edificio_sede')->comment('Ej. Nave A, Bóveda 1');
        });

        // 2. Ajustar Subseries
        Schema::table('subseries', function (Blueprint $table) {
            $table->dropColumn('ubicacion_fisica');
            $table->string('edificio_sede', 100)->nullable()->after('disposicion_final')->comment('Ej. Almacén Central');
            $table->string('area_resguardo', 100)->nullable()->after('edificio_sede')->comment('Ej. Nave A, Bóveda 1');
        });

        // 3. Verificar y Consolidar Expedientes
        // Nota: En la migración 0003 ya se crearon ubicacion_seccion, etc. 
        // pero aseguramos que el esquema sea el definitivo.
        Schema::table('expedientes', function (Blueprint $table) {
            // Aseguramos nombres exactos del sistema
            if (!Schema::hasColumn('expedientes', 'ubicacion_seccion')) {
                $table->string('ubicacion_seccion', 50)->nullable()->after('año_cierre');
            }
            if (!Schema::hasColumn('expedientes', 'ubicacion_bateria')) {
                $table->string('ubicacion_bateria', 50)->nullable()->after('ubicacion_seccion');
            }
            if (!Schema::hasColumn('expedientes', 'ubicacion_modulo')) {
                $table->string('ubicacion_modulo', 50)->nullable()->after('ubicacion_bateria');
            }
            if (!Schema::hasColumn('expedientes', 'ubicacion_entrepaño')) {
                $table->string('ubicacion_entrepaño', 50)->nullable()->after('ubicacion_modulo');
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
        Schema::table('series_documentales', function (Blueprint $table) {
            $table->dropColumn(['edificio_sede', 'area_resguardo']);
            $table->string('ubicacion_fisica', 150)->nullable();
        });

        Schema::table('subseries', function (Blueprint $table) {
            $table->dropColumn(['edificio_sede', 'area_resguardo']);
            $table->string('ubicacion_fisica', 150)->nullable();
        });
    }
};
