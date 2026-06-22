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
        // Evitamos usar ->change() para no depender de Doctrine DBAL v3
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->dropColumn('remitente');
        });

        Schema::table('correspondencias', function (Blueprint $table) {
            $table->string('remitente', 100)->nullable()->after('fecha');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('correspondencias', function (Blueprint $table) {
            $table->dropColumn('remitente');
        });

        Schema::table('correspondencias', function (Blueprint $table) {
            $table->string('remitente', 100)->nullable(false)->after('fecha');
        });
    }
};
