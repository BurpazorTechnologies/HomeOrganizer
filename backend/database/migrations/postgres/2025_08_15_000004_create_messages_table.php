<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->uuid('conversation_id');
            $table->uuid('room_id')->nullable();
            $table->unsignedBigInteger('user_id');           // sender
            $table->unsignedBigInteger('recipient_id')->nullable();
            $table->uuid('parent_id')->nullable();           // for threads/replies

            $table->text('content')->nullable();             // message text
            $table->jsonb('meta')->nullable();               // type, mentions, custom payloads
            $table->jsonb('mentions')->nullable();           // cached mentions for quick lookup
            $table->jsonb('context')->nullable();            // conversation specific payloads
            $table->string('type', 32)->default('text');     // text|image|file|system|...
            $table->string('state', 20)->default('sent');    // sent|delivered|seen|failed
            $table->string('client_reference', 64)->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_flagged')->default(false);
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampTz('seen_at')->nullable();
            $table->timestampTz('edited_at')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->foreign('conversation_id')
                ->references('id')->on('conversations')
                ->cascadeOnDelete();

            $table->foreign('room_id')
                ->references('id')->on('chat_rooms')
                ->nullOnDelete();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['room_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['recipient_id', 'created_at']);
            $table->index(['type']);
            $table->index(['state']);
            $table->unique(['conversation_id', 'client_reference']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->foreign('parent_id')
                ->references('id')->on('messages')
                ->nullOnDelete();
        });

        DB::connection($this->connection)->statement("
            ALTER TABLE messages
            ADD COLUMN content_tsv tsvector
            GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED
        ");
        DB::connection($this->connection)->statement("CREATE INDEX messages_content_tsv_gin ON messages USING GIN (content_tsv)");
        DB::connection($this->connection)->statement("CREATE INDEX messages_content_trgm ON messages USING GIN (content gin_trgm_ops)");
        DB::connection($this->connection)->statement("CREATE INDEX messages_meta_gin ON messages USING GIN (meta)");
        DB::connection($this->connection)->statement("CREATE INDEX messages_mentions_gin ON messages USING GIN (mentions)");

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreign('last_message_id')
                ->references('id')->on('messages')
                ->nullOnDelete();
        });

        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->foreign('last_read_message_id')
                ->references('id')->on('messages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->dropForeign(['last_read_message_id']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['last_message_id']);
        });

        Schema::dropIfExists('messages');
    }
};
