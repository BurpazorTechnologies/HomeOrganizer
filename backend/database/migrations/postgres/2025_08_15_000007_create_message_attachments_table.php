<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('message_id');
            $table->uuid('conversation_id');
            $table->uuid('room_id')->nullable();
            $table->string('name')->nullable();
            $table->string('storage_disk')->default('public'); // s3, local, etc.
            $table->string('path');                            // storage path or URL
            $table->string('mime_type')->nullable();
            $table->bigInteger('size_bytes')->nullable();
            $table->string('hash')->nullable();
            $table->jsonb('meta')->nullable();                 // width/height/duration, etc.
            $table->string('visibility', 20)->default('room'); // room|private|public
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();

            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();
            $table->foreign('room_id')->references('id')->on('chat_rooms')->nullOnDelete();

            $table->index(['message_id']);
            $table->index(['conversation_id']);
            $table->index(['room_id']);
            $table->index(['visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};
