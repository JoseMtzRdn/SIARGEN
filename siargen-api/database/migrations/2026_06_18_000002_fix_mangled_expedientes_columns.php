<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up() {
        if (Schema::hasTable('expedientes')) {
            $columns = DB::select("DESCRIBE expedientes");
            foreach ($columns as $c) {
                // renombrar columna ubicacion_entrepano si esta mal codificada
                if (strpos($c->Field, 'ubicacion_entrepa') === 0 && $c->Field !== 'ubicacion_entrepaño') {
                    DB::statement("ALTER TABLE expedientes CHANGE COLUMN `{$c->Field}` `ubicacion_entrepaño` VARCHAR(50) NULL DEFAULT NULL");
                }
            }
        }
    }

    public function down() {
        // no requiere revertirse
    }
};
