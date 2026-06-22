<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Usamos SQL puro para evitar la dependencia de doctrine/dbal que está causando conflictos de versiones
        DB::statement('ALTER TABLE expedientes RENAME COLUMN descripcion TO observaciones');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE expedientes RENAME COLUMN observaciones TO descripcion');
    }
};
