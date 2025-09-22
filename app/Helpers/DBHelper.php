<?php

namespace app\Helpers;

use Closure;
use Illuminate\Database\Schema\Blueprint;

class DBHelper
{
    /**
     * Add common columns to the table.
     */
    public static function addCommonColumns(Blueprint $table, bool $withSoftDeletes = false): void
    {
        $currentColumns = Closure::bind(function () {
            $columns = $this->getColumns();
            foreach ($columns as $column) {
                /** @var string $name */
                $name = $column['name'];
                $this->removeColumn($name);
            }

            return $columns;
        }, $table, Blueprint::class)();

        $table->id();

        Closure::bind(function () use ($currentColumns) {
            foreach ($currentColumns as $column) {
                $this->addColumnDefinition($column);
            }
        }, $table, Blueprint::class)();

        $table->timestamps();
        self::addUserIdsTo($table, $withSoftDeletes);

        if ($withSoftDeletes) {
            $table->softDeletes();
        }
    }

    /**
     * Add user IDs and foreign keys to the table.
     */
    public static function addUserIdsTo(Blueprint $table, bool $softDeletes = true, bool $createsForeignKeys = true, string $usersTable = 'users'): void
    {
        $table->foreignId('created_by')->nullable();
        $table->foreignId('updated_by')->nullable();
        if ($softDeletes) {
            $table->foreignId('deleted_by')->nullable();
        }

        if ($createsForeignKeys) {
            $table->foreign('created_by')->references('id')->on($usersTable);
            $table->foreign('updated_by')->references('id')->on($usersTable);
            if ($softDeletes) {
                $table->foreign('deleted_by')->references('id')->on($usersTable);
            }
        }
    }

    /**
     * Drop user IDs and foreign keys from the table.
     */
    public static function dropUserIdsFrom(Blueprint $table, bool $softDeletes = true, bool $dropsForeignKeys = true): void
    {
        if ($dropsForeignKeys) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            if ($softDeletes) {
                $table->dropForeign(['deleted_by']);
            }
        }

        $table->dropColumn('created_by');
        $table->dropColumn('updated_by');
        if ($softDeletes) {
            $table->dropColumn('deleted_by');
        }
    }
}
