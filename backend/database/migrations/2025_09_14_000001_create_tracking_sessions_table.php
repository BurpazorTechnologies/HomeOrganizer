<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('tracking_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')
                ->constrained('tracking_clients')
                ->cascadeOnDelete();
            $table->uuid('session_uuid')->unique();
            $table->ipAddress('ip_address');
            $table->string('user_agent', 1024)->nullable();
            $table->timestamps();

            $table->index(['client_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_sessions');
    }
};
