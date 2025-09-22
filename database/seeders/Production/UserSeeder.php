<?php

namespace Database\Seeders\Production;

use app\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the Database seeds.
     */
    public function run(): void
    {
        if (app()->environment() !== 'local') {
            return;
        }

        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@novaforensic.com',
            'password' => Hash::make('123412341234'),
        ]);

        $user->assignRole(RoleSeeder::sa());
    }
}
