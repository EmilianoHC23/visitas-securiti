<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blacklists', function (Blueprint $table) {
            $table->id();
            $table->enum('identifier_type', ['email', 'document', 'phone'])->default('email');
            $table->string('identifier');
            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->string('reason');
            $table->string('notes')->nullable();
            $table->foreignId('added_by')->constrained('users');
            $table->foreignId('company_id')->constrained('companies');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blacklists');
    }
};
