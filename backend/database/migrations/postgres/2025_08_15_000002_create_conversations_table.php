<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    protected $connection = 'pgsql';

    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('title')->nullable();
            $table->string('slug')->nullable();
            $table->boolean('is_group')->default(false);
            $table->string('room_type', 20)->default('direct');   // direct|group|room|support
            $table->string('visibility', 20)->default('private'); // private|public|role
            $table->string('status', 20)->default('active');      // active|archived|locked
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->uuid('last_message_id')->nullable();
            $table->string('avatar_url')->nullable();
            $table->text('topic')->nullable();
            $table->jsonb('settings')->nullable();
            $table->timestampTz('archived_at')->nullable();
            $table->timestampTz('locked_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique('slug');
            $table->index(['is_group', 'status']);
            $table->index(['owner_id']);
            $table->index(['visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};

