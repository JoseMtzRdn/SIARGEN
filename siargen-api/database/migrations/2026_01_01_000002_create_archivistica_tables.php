<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('fondos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
            $table->timestamps();
        });

        Schema::create('secciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fondo_id')->constrained('fondos')->onDelete('cascade');
            $table->string('codigo');
            $table->string('nombre');
            $table->timestamps();
            $table->unique(['fondo_id', 'codigo']);
        });

        Schema::create('series_documentales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seccion_id')->constrained('secciones')->onDelete('cascade');
            $table->string('codigo'); 
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            
            $table->boolean('valor_administrativo')->default(false);
            $table->boolean('valor_legal')->default(false);
            $table->boolean('valor_fiscal_contable')->default(false);
            
            $table->integer('vigencia_tramite')->default(0); 
            $table->integer('vigencia_concentracion')->default(0); 
            
            $table->boolean('tecnica_eliminacion')->default(false);
            $table->boolean('tecnica_conservacion')->default(false);
            $table->boolean('tecnica_muestreo')->default(false);
            
            $table->enum('acceso', ['Publico', 'Confidencial', 'Reservado'])->default('Publico');
            $table->string('disposicion_final', 20)->default('Baja');
            
            $table->timestamps();
            $table->unique(['seccion_id', 'codigo']);
        });

        Schema::create('subseries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('serie_id')->constrained('series_documentales')->onDelete('cascade');
            $table->string('codigo');
            $table->string('nombre');
            $table->text('descripcion')->nullable();

            $table->boolean('valor_administrativo')->default(false);
            $table->boolean('valor_legal')->default(false);
            $table->boolean('valor_fiscal_contable')->default(false);

            $table->integer('vigencia_tramite')->default(0);
            $table->integer('vigencia_concentracion')->default(0);

            $table->string('disposicion_final', 20)->default('Baja');
            $table->enum('acceso', ['Publico', 'Confidencial', 'Reservado'])->default('Publico');

            $table->timestamps();
            $table->unique(['serie_id', 'codigo']);
        });
    }

    public function down() {
        Schema::dropIfExists('subseries');
        Schema::dropIfExists('series_documentales');
        Schema::dropIfExists('secciones');
        Schema::dropIfExists('fondos');
    }
};
