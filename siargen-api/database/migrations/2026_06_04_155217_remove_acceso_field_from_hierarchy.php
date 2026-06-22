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
            if (Schema::hasColumn('series_documentales', 'acceso')) {
                $table->dropColumn('acceso');
            }
        });

        Schema::table('subseries', function (Blueprint $table) {
            if (Schema::hasColumn('subseries', 'acceso')) {
                $table->dropColumn('acceso');
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
            $table->enum('acceso', ['Publico', 'Confidencial', 'Reservado'])->default('Publico');
        });

        Schema::table('subseries', function (Blueprint $table) {
            $table->enum('acceso', ['Publico', 'Confidencial', 'Reservado'])->default('Publico');
        });
    }
};
