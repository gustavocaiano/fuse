<?php

namespace Database\Seeders;

use Database\Seeders\Testing\PTZCameraSeeder;
use Database\Seeders\Testing\UserSeeder;
use Illuminate\Database\Seeder;

class DatabaseTestingSeeder extends Seeder
{
    /**
     * Seed the application's Database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,

            PTZCameraSeeder::class,
        ]);
    }
}
