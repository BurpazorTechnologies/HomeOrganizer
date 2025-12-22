<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('tracking_sessions')
                ->cascadeOnDelete();
            $table->string('event_name');
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'created_at']);
            $table->index(['event_name', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_events');
    }
};
