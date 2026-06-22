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
            $table->foreignId('seccion_id')->nullable()->after('expediente_id')->constrained('secciones')->onDelete('set null');
            $table->foreignId('subserie_id')->nullable()->after('serie_id')->constrained('subseries')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->dropForeign(['seccion_id']);
            $table->dropColumn('seccion_id');
            $table->dropForeign(['subserie_id']);
            $table->dropColumn('subserie_id');
        });
    }
};
