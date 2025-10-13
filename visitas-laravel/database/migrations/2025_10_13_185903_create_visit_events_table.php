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
        Schema::create('visit_events', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('visit_id');
        $table->string('type');
        $table->json('photos')->nullable();
        $table->dateTime('timestamp');
        $table->timestamps();

        $table->foreign('visit_id')->references('id')->on('visits')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visit_events');
    }
};
