<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('portfolio_contact_mail', function (Blueprint $table) {
            $table->id();
            $table->string('sender_email');
            $table->string('receiver_email');
            $table->string('sender_name');
            $table->string('subject');
            $table->text('message');
            $table->json('additional_details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_contact_mail');
    }
};
