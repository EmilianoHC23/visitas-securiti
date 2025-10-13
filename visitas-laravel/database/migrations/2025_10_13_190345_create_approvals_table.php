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
        Schema::create('approvals', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('visit_id');
                $table->unsignedBigInteger('host_id');
                $table->string('token')->unique();
                $table->enum('status', ['pending', 'decided'])->default('pending');
                $table->enum('decision', ['approved', 'rejected'])->nullable();
                $table->dateTime('decided_at')->nullable();
                $table->dateTime('expires_at');
                $table->timestamps();

                $table->foreign('visit_id')->references('id')->on('visits')->onDelete('cascade');
                $table->foreign('host_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
