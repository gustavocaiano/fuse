<?php

namespace App\Providers;

use app\Helpers\DBHelper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerDatabaseBlueprintHooks();
        $this->preventLazyLoading();
    }

    /**
     * Register the Blueprint macros for common Database columns.
     */
    protected function registerDatabaseBlueprintHooks(): void
    {
        Blueprint::macro('common', function ($withSoftDeletes = false) {
            /** @var Blueprint $this */
            DBHelper::addCommonColumns($this, $withSoftDeletes);
        });

        Blueprint::macro('addUserIds', function ($softDeletes = true, $createsForeignKeys = true, $usersTable = 'users') {
            /** @var Blueprint $this */
            DBHelper::addUserIdsTo($this, $softDeletes, $createsForeignKeys, $usersTable);
        });

        Blueprint::macro('dropUserIds', function ($softDeletes = true, $dropsForeignKeys = true) {
            /** @var Blueprint $this */
            DBHelper::dropUserIdsFrom($this, $softDeletes, $dropsForeignKeys);
        });
    }

    protected function preventLazyLoading(): void
    {
        Model::preventLazyLoading(! app()->isProduction());
    }
}
