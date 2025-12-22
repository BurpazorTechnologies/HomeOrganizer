<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('conversation_id')
                ->constrained('conversations')
                ->cascadeOnDelete();

            $table->uuid('room_id')->nullable();

            $table->unsignedBigInteger('user_id');
            $table->string('role', 20)->default('client');     // guest|client|admin
            $table->string('status', 20)->default('active');   // active|pending|banned|left
            $table->unsignedBigInteger('invited_by')->nullable();
            $table->timestampTz('joined_at')->nullable();
            $table->timestampTz('left_at')->nullable();
            $table->timestampTz('last_read_at')->nullable();
            $table->uuid('last_read_message_id')->nullable();
            $table->jsonb('prefs')->nullable();
            $table->jsonb('permissions')->nullable();
            $table->boolean('notifications_enabled')->default(true);
            $table->timestampTz('muted_at')->nullable();
            $table->timestampsTz();

            // Constraints / indexes
            $table->unique(['conversation_id', 'user_id']);
            $table->index(['user_id', 'conversation_id']);
            $table->index(['room_id']);
            $table->index(['status']);
            $table->index(['muted_at']);
        });

        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->foreign('room_id')
                ->references('id')->on('chat_rooms')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
    }
};
