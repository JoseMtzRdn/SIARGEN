<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up() {
        if (Schema::hasTable('transferencias')) {
            $columns = DB::select("DESCRIBE transferencias");
            foreach ($columns as $c) {
                // renombrar columna fecha_autorizacion si esta mal codificada
                if (strpos($c->Field, 'fecha_autorizaci') === 0 && $c->Field !== 'fecha_autorización_tua') {
                    DB::statement("ALTER TABLE transferencias CHANGE COLUMN `{$c->Field}` `fecha_autorización_tua` TIMESTAMP NULL DEFAULT NULL");
                }
            }
        }
    }

    public function down() {
        // no requiere revertirse
    }
};
