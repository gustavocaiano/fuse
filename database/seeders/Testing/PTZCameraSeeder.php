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

        // ONVIF Camera
        $onvifCamera = Camera::create([
            'name' => 'ONVIF PTZ Camera',
            'ip_address' => '192.168.1.100',
            'user' => 'admin',
            'password' => 'admin123',
            'port' => '554',
            'path' => '/cam/realmonitor?channel=1&subtype=0',
            'ptz_protocol_id' => PTZProtocol::ONVIF->value,
        ]);

        $this->command->info("✅ Created ONVIF camera: {$onvifCamera->name} (ID: {$onvifCamera->id})");

        // Hikvision Camera
        $hikvisionCamera = Camera::create([
            'name' => 'Hikvision PTZ Camera',
            'ip_address' => '192.168.1.101',
            'user' => 'admin',
            'password' => 'admin123',
            'port' => '554',
            'path' => '/Streaming/Channels/101',
            'ptz_protocol_id' => PTZProtocol::HIKVISION->value,
        ]);

        $this->command->info("✅ Created Hikvision camera: {$hikvisionCamera->name} (ID: {$hikvisionCamera->id})");

        // Regular camera without PTZ (for comparison)
        $regularCamera = Camera::create([
            'name' => 'Regular Camera (No PTZ)',
            'ip_address' => '192.168.1.102',
            'user' => 'admin',
            'password' => 'admin123',
            'port' => '554',
            'path' => '/stream1',
            'ptz_protocol_id' => null, // No PTZ support
        ]);

        $this->command->info("✅ Created regular camera: {$regularCamera->name} (ID: {$regularCamera->id})");

        $this->command->newLine();
        $this->command->info('🎯 Test cameras created successfully!');
        $this->command->info('💡 You can now test PTZ functionality with:');
        $this->command->line("   php artisan ptz:test --camera-id={$onvifCamera->id}");
        $this->command->line("   php artisan ptz:test --camera-id={$hikvisionCamera->id}");
        $this->command->newLine();
        $this->command->warn('⚠️  Note: These are test cameras with placeholder IP addresses.');
        $this->command->warn('   Update the IP addresses to match your real cameras before testing.');
    }
}
