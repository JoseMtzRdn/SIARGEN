<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UnidadAdministrativa;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class EssentialSeeder extends Seeder
{
    public function run()
    {
        // roles indispensables del sistema
        $rolesData = [
            ['nombre' => 'Admin TI', 'slug' => 'admin_ti', 'descripcion' => 'Soporte técnico y gestión de usuarios.'],
            ['nombre' => 'Titular Unidad Administrativa', 'slug' => 'tua', 'descripcion' => 'Autoridad de área que autoriza transferencias.'],
            ['nombre' => 'Responsable de Archivo de Trámite', 'slug' => 'rat', 'descripcion' => 'Crea expedientes y desarrolla el archivo de oficina.'],
            ['nombre' => 'Responsable de Archivo de Concentración', 'slug' => 'rac', 'descripcion' => 'Custodia en almacén y controla préstamos.'],
            ['nombre' => 'Responsable de Archivo Histórico', 'slug' => 'rah', 'descripcion' => 'Preserva documentos con valor permanente.'],
            ['nombre' => 'Coordinador de Archivos', 'slug' => 'coord_archivos', 'descripcion' => 'Rector de la normatividad (CGCA/CADIDO).'],
            ['nombre' => 'Responsable de Correspondencia', 'slug' => 'correspondencia', 'descripcion' => 'Punto de entrada y salida (Oficialía de Partes).'],
            ['nombre' => 'Usuario de Consulta', 'slug' => 'consulta', 'descripcion' => 'Acceso limitado a búsqueda y visualización.'],
        ];

        $roles = [];
        foreach ($rolesData as $r) {
            $roles[$r['slug']] = Role::firstOrCreate(['slug' => $r['slug']], $r);
        }

        // unidad administrativa base
        UnidadAdministrativa::firstOrCreate(['codigo' => 'UA-UTI'], [
            'nombre' => 'Unidad de Tecnologías de la Información',
            'email' => 'uti_siargen@siargen.com',
            'direccion' => 'Toluca, Centro',
            'telefono' => '7221234567',
            'activo' => true
        ]);

        // usuario administrador maestro
        User::firstOrCreate(['username' => 'adminti'], [
            'nombre' => 'Administrador',
            'apellido_paterno' => 'Del Sistema',
            'apellido_materno' => 'ISEM',
            'email' => 'admin@siargen.com',
            'password' => Hash::make(env('ADMIN_DEFAULT_PASSWORD', 'password')),
            'role_id' => $roles['admin_ti']->id,
            'unidad_administrativa_id' => null, // desvinculado de unidad
            'cargo' => 'Soporte Técnico de Nivel Sistema',
            'telefono' => '7220000000',
            'activo' => true
        ]);
    }
}
