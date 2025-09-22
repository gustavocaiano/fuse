<?php

namespace app\Console\Commands;

use Illuminate\Console\Command;

class SeedDatabaseForTesting extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:seed-testing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed the Database with fake data for testing purposes.';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        if (app()->environment('production')) {
            $this->warn('This command cannot be run in the production environment.');

            return;
        }

        $this->call('db:seed', ['--class' => 'DatabaseTestingSeeder']);
    }
}
