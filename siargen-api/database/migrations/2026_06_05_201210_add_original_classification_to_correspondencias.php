<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->unsignedBigInteger('serie_original_id')->nullable()->after('subserie_id');
            $table->unsignedBigInteger('subserie_original_id')->nullable()->after('serie_original_id');

            $table->foreign('serie_original_id')->references('id')->on('series_documentales')->onDelete('set null');
            $table->foreign('subserie_original_id')->references('id')->on('subseries')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->dropForeign(['serie_original_id']);
            $table->dropForeign(['subserie_original_id']);
            $table->dropColumn(['serie_original_id', 'subserie_original_id']);
        });
    }
};
