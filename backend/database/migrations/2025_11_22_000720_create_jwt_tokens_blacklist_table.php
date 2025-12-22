<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jwt_tokens_blacklist', function (Blueprint $table) {
            $table->id();
            $table->string('token_type', 20);
            $table->string('jti', 64);
            $table->string('token_hash', 128)->index('jwt_tokens_blacklist_hash_idx');
            $table->string('service', 100)->nullable();
            $table->string('context', 50)->default('app');
            $table->string('guard', 50)->nullable();
            $table->nullableMorphs('subject');
            $table->string('subject_connection', 32)->nullable();
            $table->string('reason', 191)->nullable();
            $table->timestamp('blacklisted_at');
            $table->timestamp('expires_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['token_type', 'jti'], 'jwt_tokens_blacklist_token_unique');
            $table->index(['context'], 'jwt_tokens_blacklist_context_idx');
            $table->index(['subject_type', 'subject_id'], 'jwt_tokens_blacklist_subject_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jwt_tokens_blacklist');
    }
};

