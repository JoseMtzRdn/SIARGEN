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
            if (!Schema::hasColumn('expedientes', 'numero_cajas')) {
                $table->integer('numero_cajas')->default(1)->after('ubicacion_caja')->comment('Total de cajas que componen el expediente');
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
            $table->dropColumn('numero_cajas');
        });
    }
};
