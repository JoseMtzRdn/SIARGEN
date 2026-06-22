<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            EssentialSeeder::class,      // solo roles, unidad base y administrador
            SystemConfigSeeder::class,   // configuracion visual del sistema
        ]);
    }
}
