<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('message_reactions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('message_id');
            $table->uuid('conversation_id');
            $table->uuid('room_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->string('emoji', 64); // store unicode or shortcode
            $table->string('skin_tone', 16)->nullable();
            $table->jsonb('context')->nullable();
            $table->timestampsTz();

            $table->unique(['message_id', 'user_id', 'emoji']);

            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();
            $table->foreign('room_id')->references('id')->on('chat_rooms')->nullOnDelete();

            $table->index(['emoji']);
            $table->index(['conversation_id']);
            $table->index(['room_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reactions');
    }
};
