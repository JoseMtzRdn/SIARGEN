<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Usar SQL crudo para evitar problemas con Doctrine DBAL y ENUMs
        DB::statement('ALTER TABLE transferencias MODIFY COLUMN estatus VARCHAR(50) DEFAULT "elaboracion"');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement("ALTER TABLE transferencias MODIFY COLUMN estatus ENUM('Borrador', 'Enviado_TUA', 'Autorizado_TUA', 'Validado_Coordinador', 'Enviado_RAC', 'Recibido_RAC', 'Rechazado') DEFAULT 'Borrador'");
    }
};
