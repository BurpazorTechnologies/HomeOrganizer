<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('conversation_id')->unique();
            $table->string('code', 32)->unique();
            $table->string('room_type', 20)->default('channel');      // channel|space|support
            $table->string('access', 20)->default('private');         // private|public|role
            $table->string('status', 20)->default('open');            // open|readonly|closed
            $table->unsignedInteger('max_participants')->nullable();
            $table->boolean('requires_approval')->default(false);
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->jsonb('allowed_roles')->default(DB::raw('\'["guest","client","admin"]\'::jsonb'));
            $table->jsonb('options')->nullable();
            $table->timestampTz('opened_at')->useCurrent();
            $table->timestampTz('closed_at')->nullable();
            $table->timestampsTz();

            $table->foreign('conversation_id')
                ->references('id')->on('conversations')
                ->cascadeOnDelete();
            $table->index(['status']);
            $table->index(['access']);
            $table->index(['created_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_rooms');
    }
};

