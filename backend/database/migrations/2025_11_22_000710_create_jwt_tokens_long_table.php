<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jwt_tokens_long', function (Blueprint $table) {
            $table->id();
            $table->string('jti', 64)->unique();
            $table->string('linked_short_jti', 64)->nullable()->index('jwt_tokens_long_linked_short_jti_idx');
            $table->string('token_hash', 128)->unique();
            $table->string('family', 64)->nullable()->index('jwt_tokens_long_family_idx');
            $table->string('service', 100);
            $table->string('context', 50)->default('app');
            $table->string('guard', 50)->nullable();
            $table->nullableMorphs('subject');
            $table->string('subject_connection', 32)->nullable();
            $table->json('subject_snapshot')->nullable();
            $table->json('claims')->nullable();
            $table->json('abilities')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoked_reason', 191)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['service', 'context'], 'jwt_tokens_long_service_context_idx');
            $table->index(['subject_type', 'subject_id'], 'jwt_tokens_long_subject_idx');
            $table->index(['expires_at'], 'jwt_tokens_long_exp_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jwt_tokens_long');
    }
};

