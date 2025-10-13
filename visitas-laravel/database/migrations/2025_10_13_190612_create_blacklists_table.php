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
        Schema::create('blacklists', function (Blueprint $table) {
            $table->id();
            $table->enum('identifier_type', ['email', 'document', 'phone'])->default('email');
            $table->string('identifier');
            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->string('reason');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('added_by');
            $table->unsignedBigInteger('company_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['identifier', 'company_id']);
            $table->unique(['email', 'company_id']);
            $table->foreign('added_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blacklists');
    }
};
