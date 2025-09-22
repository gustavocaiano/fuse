<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cameras', function (Blueprint $table) {
            $table->common();
            $table->string('name');
            $table->string('user')->default('admin');
            $table->string('password')->nullable();
            $table->string('path')->nullable();
            $table->string('port')->default(config('cameras.rtsp_port'));
            $table->string('ptz')->nullable();
            $table->string('ip_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cameras');
    }
};
