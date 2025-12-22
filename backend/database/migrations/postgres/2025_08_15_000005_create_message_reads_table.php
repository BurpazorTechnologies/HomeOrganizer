<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('message_reads', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('message_id');
            $table->uuid('conversation_id');
            $table->uuid('room_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->timestampTz('read_at')->useCurrent();
            $table->string('status', 20)->default('seen'); // sent|delivered|seen
            $table->string('read_via', 32)->nullable();    // web|mobile|api
            $table->jsonb('context')->nullable();
            $table->timestampsTz();

            $table->unique(['message_id', 'user_id']);

            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();
            $table->foreign('room_id')->references('id')->on('chat_rooms')->nullOnDelete();

            $table->index(['user_id', 'read_at']);
            $table->index(['conversation_id']);
            $table->index(['room_id']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reads');
    }
};
