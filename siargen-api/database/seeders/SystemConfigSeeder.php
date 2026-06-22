<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemConfig;

class SystemConfigSeeder extends Seeder
{
    public function run()
    {
        $configs = [
            [
                'key' => 'system_name',
                'value' => 'Sistema De Archivo General',
                'type' => 'string',
                'group' => 'visual',
                'label' => 'Nombre del Sistema',
            ],
            [
                'key' => 'primary_color',
                'value' => '#225daa',
                'type' => 'color',
                'group' => 'visual',
                'label' => 'Color Primario',
            ],
            [
                'key' => 'accent_color',
                'value' => '#225daa',
                'type' => 'color',
                'group' => 'visual',
                'label' => 'Color de Acento',
            ],
            [
                'key' => 'logo_dark',
                'value' => '/assets/logos_isem_dark.png',
                'type' => 'image',
                'group' => 'visual',
                'label' => 'Logo Versión Oscura',
            ],
            [
                'key' => 'logo_light',
                'value' => '/assets/logos_isem_light.png',
                'type' => 'image',
                'group' => 'visual',
                'label' => 'Logo Versión Clara',
            ],
            [
                'key' => 'footer_text',
                'value' => '© 2026 Instituto de Salud del Estado de México',
                'type' => 'string',
                'group' => 'visual',
                'label' => 'Texto de Pie de Página',
            ],
        ];

        foreach ($configs as $config) {
            SystemConfig::firstOrCreate(['key' => $config['key']], $config);
        }
    }
}
