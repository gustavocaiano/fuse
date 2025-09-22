<?php

namespace app\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MakeCustomResource extends Command
{
    protected $signature = 'make:custom-resource {name}';

    protected $description = 'Create a new custom resource class';

    public function handle(): void
    {
        $name = $this->argument('name');

        $path = app_path("Filament/Resources/{$name}Resource.php");
        if (File::exists($path)) {
            if ($this->confirm("Resource {$name}Resource already exists. Do you want to overwrite it?")) {
                File::delete($path);
            } else {
                return;
            }
        }

        $stub = File::get(app_path('Console/Commands/stubs/custom-resource.stub'));

        $content = str_replace(['{Name}', '{NamePlural}'], [$name, Str::plural($name)], $stub);

        File::put($path, $content);

        $this->info("Resource {$name}Resource created successfully.");
    }
}
