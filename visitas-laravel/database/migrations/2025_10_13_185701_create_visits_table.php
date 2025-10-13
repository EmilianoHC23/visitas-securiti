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
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->string('mongo_id')->unique()->nullable();
            $table->string('visitor_name');
            $table->string('visitor_company')->nullable();
            $table->string('visitor_photo')->nullable();
            $table->unsignedBigInteger('host_id');
            $table->string('reason')->nullable();
            $table->string('status')->default('pending');
            $table->string('visit_type')->nullable();
            $table->string('access_code')->nullable();
            $table->unsignedBigInteger('access_id')->nullable();
            $table->dateTime('scheduled_date')->nullable();
            $table->dateTime('check_in_time')->nullable();
            $table->dateTime('check_out_time')->nullable();
            $table->unsignedBigInteger('company_id');
            $table->text('notes')->nullable();
            $table->string('visitor_email')->nullable();
            $table->string('visitor_phone')->nullable();
            $table->timestamps();

            $table->foreign('host_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('access_id')->references('id')->on('accesses')->onDelete('set null');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
