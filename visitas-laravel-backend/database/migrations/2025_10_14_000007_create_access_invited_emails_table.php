<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_invited_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_id')->constrained('accesses');
            $table->string('email');
            $table->dateTime('sent_at')->nullable();
            $table->enum('status', ['sent', 'opened', 'redeemed'])->default('sent');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_invited_emails');
    }
};
