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
        Schema::table('series_documentales', function (Blueprint $table) {
            $table->decimal('metros_lineales', 8, 2)->default(0)->after('disposicion_final');
            $table->string('ubicacion_fisica', 150)->nullable()->after('metros_lineales');
        });

        Schema::table('subseries', function (Blueprint $table) {
            $table->decimal('metros_lineales', 8, 2)->default(0)->after('disposicion_final');
            $table->string('ubicacion_fisica', 150)->nullable()->after('metros_lineales');
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
            $table->dropColumn(['metros_lineales', 'ubicacion_fisica']);
        });

        Schema::table('subseries', function (Blueprint $table) {
            $table->dropColumn(['metros_lineales', 'ubicacion_fisica']);
        });
    }
};
