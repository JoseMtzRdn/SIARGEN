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
        Schema::table('expedientes', function (Blueprint $table) {
            // Eliminar campos viejos o redundantes si existen
            if (Schema::hasColumn('expedientes', 'numero_cajas')) {
                $table->dropColumn('numero_cajas');
            }

            // Asegurar los 5 campos exactos del Vale de Préstamo
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
            if (!Schema::hasColumn('expedientes', 'ubicacion_caja')) {
                $table->string('ubicacion_caja', 50)->nullable()->after('ubicacion_entrepaño')->comment('No. de Caja del Vale de Préstamo');
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
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropColumn(['ubicacion_caja']);
            $table->integer('numero_cajas')->default(1);
        });
    }
};
