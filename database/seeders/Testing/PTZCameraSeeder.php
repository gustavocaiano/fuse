<?php

namespace Database\Seeders\Testing;

use app\Enums\PTZProtocol;
use app\Models\Camera;
use Illuminate\Database\Seeder;

class PTZCameraSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🎥 Creating PTZ test cameras...');

        Camera::create([
            'name' => 'ONVIF PTZ Camera',
            'ip_address' => '192.168.16.100',
            'user' => 'admin',
            'password' => 'guifoes2025!',
            'ptz' => PTZProtocol::HIKVISION->value,
            'port' => '554',
            'path' => '/h264',
        ]);

    }
}
