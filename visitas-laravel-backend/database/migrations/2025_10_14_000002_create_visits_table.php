<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->string('visitor_name');
            $table->string('visitor_company')->nullable();
            $table->string('visitor_photo')->nullable();
            $table->foreignId('host_id')->constrained('users');
            $table->string('reason');
            $table->string('destination')->default('SecurITI');
            $table->enum('status', ['pending', 'approved', 'checked-in', 'completed', 'rejected', 'cancelled'])->default('pending');
            $table->enum('visit_type', ['spontaneous', 'pre-registered', 'access-code'])->default('spontaneous');
            $table->string('access_code')->nullable();
            $table->foreignId('access_id')->nullable()->constrained('accesses');
            $table->dateTime('scheduled_date');
            $table->dateTime('check_in_time')->nullable();
            $table->dateTime('check_out_time')->nullable();
            $table->foreignId('company_id')->constrained('companies');
            $table->text('notes')->nullable();
            $table->string('visitor_email')->nullable();
            $table->string('visitor_phone')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
