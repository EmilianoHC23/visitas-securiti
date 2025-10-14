<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accesses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('company_id')->constrained('companies');
            $table->string('access_code')->unique();
            $table->string('qr_code')->unique();
            $table->boolean('auto_approval')->default(true);
            $table->integer('max_uses')->default(1);
            $table->boolean('allow_guests')->default(false);
            $table->boolean('require_approval')->default(false);
            $table->date('schedule_start_date');
            $table->date('schedule_end_date');
            $table->string('schedule_start_time');
            $table->string('schedule_end_time');
            $table->enum('schedule_recurrence', ['none', 'daily', 'weekly', 'monthly'])->default('none');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->integer('usage_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accesses');
    }
};
