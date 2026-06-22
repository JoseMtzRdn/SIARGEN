<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        // Expedientes
        Schema::create('expedientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unidad_administrativa_id')->constrained('unidades_administrativas')->onDelete('restrict');
            $table->foreignId('serie_id')->constrained('series_documentales')->onDelete('restrict');
            $table->foreignId('subserie_id')->nullable()->constrained('subseries')->onDelete('restrict');
            $table->foreignId('usuario_creador_id')->nullable()->constrained('users')->onDelete('set null');
            
            $table->string('numero_expediente')->unique();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            
            $table->integer('año_apertura');
            $table->integer('año_cierre')->nullable();
            $table->date('fecha_cierre')->nullable();
            
            $table->tinyInteger('fase')->default(1)->comment('1: Tramite, 2: Concentracion, 3: Historico, 4: Baja');
            $table->tinyInteger('estado_archivo')->default(1)->comment('1: Abierto, 2: Cerrado');
            $table->tinyInteger('estatus_disponibilidad')->default(1)->comment('1: Disponible, 2: Prestado, 3: Reservado, 4: Transferencia');
            
            // Ubicación Topográfica Real (Alineada con el Modelo)
            $table->string('ubicacion_seccion', 50)->nullable();
            $table->string('ubicacion_bateria', 50)->nullable();
            $table->string('ubicacion_modulo', 50)->nullable();
            $table->string('ubicacion_entrepaño', 50)->nullable();
            $table->integer('numero_cajas')->default(1);
            
            $table->enum('clasificacion_informacion', ['publica', 'reservada', 'confidencial'])->default('publica');
            
            $table->timestamps();
            $table->softDeletes();
        });

        // Correspondencia
        Schema::create('correspondencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unidad_administrativa_id')->constrained('unidades_administrativas')->onDelete('restrict');
            $table->foreignId('expediente_id')->nullable()->constrained('expedientes')->onDelete('set null');
            $table->foreignId('serie_id')->nullable()->constrained('series_documentales')->onDelete('set null');
            
            $table->string('folio_interno')->unique();
            $table->string('numero_oficio')->nullable();
            $table->date('fecha_emision');
            $table->date('fecha_recepcion');
            
            $table->string('remitente', 100);
            $table->string('cargo_remitente', 100)->nullable();
            $table->string('institucion_remitente', 150)->nullable();
            
            $table->string('asunto', 255);
            $table->integer('num_fojas')->default(1);
            
            $table->tinyInteger('estatus')->default(1)->comment('1: Pendiente, 2: Archivado');
            $table->timestamps();
            $table->softDeletes();
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->string('link')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamps();
        });

        // Transferencias
        Schema::create('transferencias', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->foreignId('unidad_administrativa_id')->constrained('unidades_administrativas');
            $table->foreignId('enviado_por')->constrained('users');
            $table->timestamp('fecha_envio')->nullable();
            
            $table->enum('tipo', ['Primaria', 'Secundaria'])->default('Primaria');
            $table->enum('estatus', ['Borrador', 'Enviado_TUA', 'Autorizado_TUA', 'Validado_Coordinador', 'Enviado_RAC', 'Recibido_RAC', 'Rechazado'])->default('Borrador');
            
            $table->text('observaciones')->nullable();
            $table->string('archivo_inventario')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('transferencia_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transferencia_id')->constrained('transferencias')->onDelete('cascade');
            $table->foreignId('expediente_id')->constrained('expedientes');
            $table->timestamps();
        });

        // Prestamos
        Schema::create('prestamos', function (Blueprint $table) {
            $table->id();
            $table->string('folio_prestamo')->unique();
            $table->foreignId('unidad_administrativa_id')->nullable()->constrained('unidades_administrativas');
            $table->foreignId('usuario_presta_id')->constrained('users');
            
            $table->string('nombre', 50);
            $table->string('apellido_paterno', 50);
            $table->string('apellido_materno', 50)->nullable();
            $table->string('cargo_solicitante', 100);
            $table->string('unidad_solicitante', 150)->nullable();
            
            $table->datetime('fecha_prestamo');
            $table->datetime('fecha_vencimiento');
            $table->datetime('fecha_devolucion')->nullable();
            
            $table->string('telefono', 20)->nullable();
            $table->string('extension', 10)->nullable();
            
            $table->enum('estatus', ['prestado', 'devuelto', 'vencido'])->default('prestado');
            $table->tinyInteger('fase')->default(1)->comment('1: Tramite, 2: Concentracion');
            $table->text('observaciones')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('prestamo_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestamo_id')->constrained('prestamos')->onDelete('cascade');
            $table->foreignId('expediente_id')->constrained('expedientes');
            $table->string('estado_fisico')->nullable();
            $table->timestamps();
        });

        // Expediente Reaperturas
        Schema::create('expediente_reaperturas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expediente_id')->constrained('expedientes')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->text('motivo');
            $table->timestamp('fecha_reapertura');
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('expediente_reaperturas');
        Schema::dropIfExists('prestamo_detalles');
        Schema::dropIfExists('prestamos');
        Schema::dropIfExists('transferencia_detalles');
        Schema::dropIfExists('transferencias');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('correspondencias');
        Schema::dropIfExists('expedientes');
    }
};
