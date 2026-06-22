<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('series_documentales', function (Blueprint $table) {
            $table->dropColumn(['tecnica_eliminacion', 'tecnica_conservacion', 'tecnica_muestreo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('series_documentales', function (Blueprint $table) {
            $table->boolean('tecnica_eliminacion')->default(false);
            $table->boolean('tecnica_conservacion')->default(false);
            $table->boolean('tecnica_muestreo')->default(false);
        });
    }
};
