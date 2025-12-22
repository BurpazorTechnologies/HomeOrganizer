<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('tracking_clients', function (Blueprint $table) {
            $table->id();
            $table->uuid('client_uuid')->unique();
            $table->string('user_agent', 1024)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_clients');
    }
};

