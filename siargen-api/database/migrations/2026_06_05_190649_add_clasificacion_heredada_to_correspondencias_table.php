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
        Schema::table('correspondencias', function (Blueprint $blueprint) {
            $blueprint->boolean('clasificacion_heredada')->default(false)->after('subserie_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('correspondencias', function (Blueprint $blueprint) {
            $blueprint->dropColumn('clasificacion_heredada');
        });
    }
};
