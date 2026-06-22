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
        // Usar raw SQL para evitar problemas de compatibilidad con Doctrine DBAL en este entorno
        DB::statement("ALTER TABLE prestamos MODIFY nombre VARCHAR(100)");
        DB::statement("ALTER TABLE prestamos MODIFY apellido_paterno VARCHAR(100)");
        DB::statement("ALTER TABLE prestamos MODIFY apellido_materno VARCHAR(100) NULL");
        DB::statement("ALTER TABLE prestamos MODIFY cargo_solicitante VARCHAR(255)");

        Schema::table('prestamo_detalles', function (Blueprint $table) {
            // Añadir columnas faltantes
            $table->enum('estatus', ['prestado', 'devuelto'])->default('prestado')->after('expediente_id');
            $table->string('estado_salida')->nullable()->after('estatus');
            $table->string('estado_devolucion')->nullable()->after('estado_salida');
            $table->datetime('fecha_devolucion')->nullable()->after('estado_devolucion');
            $table->text('observaciones_devolucion')->nullable()->after('fecha_devolucion');
        });

        // Migrar datos de estado_fisico a estado_salida si existe y luego borrarla
        if (Schema::hasColumn('prestamo_detalles', 'estado_fisico')) {
            DB::statement("UPDATE prestamo_detalles SET estado_salida = estado_fisico");
            Schema::table('prestamo_detalles', function (Blueprint $table) {
                $table->dropColumn('estado_fisico');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('prestamo_detalles', function (Blueprint $table) {
            $table->string('estado_fisico')->nullable()->after('expediente_id');
        });

        DB::statement("UPDATE prestamo_detalles SET estado_fisico = estado_salida");

        Schema::table('prestamo_detalles', function (Blueprint $table) {
            $table->dropColumn(['estatus', 'estado_salida', 'estado_devolucion', 'fecha_devolucion', 'observaciones_devolucion']);
        });

        DB::statement("ALTER TABLE prestamos MODIFY nombre VARCHAR(50)");
        DB::statement("ALTER TABLE prestamos MODIFY apellido_paterno VARCHAR(50)");
        DB::statement("ALTER TABLE prestamos MODIFY apellido_materno VARCHAR(50) NULL");
        DB::statement("ALTER TABLE prestamos MODIFY cargo_solicitante VARCHAR(100)");
    }
};
