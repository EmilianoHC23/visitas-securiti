<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('role', ['admin', 'reception', 'host']);
            $table->foreignId('invited_by')->constrained('users');
            $table->foreignId('company_id')->constrained('companies');
            $table->string('invitation_token')->unique();
            $table->dateTime('expires_at');
            $table->enum('status', ['pending', 'accepted', 'expired'])->default('pending');
            $table->dateTime('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
