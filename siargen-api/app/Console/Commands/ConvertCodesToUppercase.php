<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ConvertCodesToUppercase extends Command
{
    protected $signature = 'codes:uppercase';
    protected $description = 'Convierte todos los códigos de las tablas archivísticas a mayúsculas';

    public function handle()
    {
        $tables = [
            'fondos',
            'secciones',
            'series_documentales',
            'unidades_administrativas'
        ];

        foreach ($tables as $table) {
            $this->info("Procesando tabla: {$table}...");
            
            DB::table($table)->whereNotNull('codigo')->get()->each(function ($item) use ($table) {
                DB::table($table)
                    ->where('id', $item->id)
                    ->update(['codigo' => strtoupper($item->codigo)]);
            });
        }

        $this->info('¡Conversión completada con éxito!');
        return Command::SUCCESS;
    }
}
