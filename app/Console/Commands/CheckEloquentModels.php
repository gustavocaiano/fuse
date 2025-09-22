<?php

namespace app\Console\Commands;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CheckEloquentModels extends Command
{
    protected $signature = 'check:eloquent-models {files*}';

    protected $description = 'Check if the given PHP files are Eloquent models and run ide-helper:model if necessary';

    /**
     * @throws FileNotFoundException
     * @throws \Throwable
     */
    public function handle(): void
    {
        if (! $this->checkDatabaseConnection()) {
            $this->fail('Default database connection is not working.Please check your environment or make sure you are running this inside your container.');
        }

        $files = $this->argument('files');
        foreach ($files as $file) {
            if (File::exists($file) && File::extension($file) === 'php') {
                $content = File::get($file);

                $fileName = pathinfo($file, PATHINFO_FILENAME);

                preg_match('/namespace\s+([^;]+);/', $content, $namespaceMatches);
                $namespace = $namespaceMatches[1] ?? null;

                if ($namespace) {
                    $fqn = $namespace.'\\'.$fileName;

                    if (class_exists($fqn) && ($this->isModelOrPivot($fqn))) {
                        $this->info("Running ide-helper:models $fqn -W --smart-reset");
                        $this->call('ide-helper:models', [
                            'model' => [$fqn],
                            '--write' => true,
                            '--smart-reset' => true,
                        ]);
                    }
                }
            }
        }
    }

    protected function isModelOrPivot(string $class): bool
    {
        return is_a($class, Model::class, true)
            || is_a($class, Pivot::class, true);
    }

    protected function checkDatabaseConnection(): bool
    {
        try {
            DB::connection()->getPdo();

            return true;
        } catch (Exception) {
            return false;
        }
    }
}
