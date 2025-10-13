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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_id')->unique();
            $table->string('name');
            $table->string('logo')->nullable();
            $table->boolean('auto_approval')->default(false);
            $table->boolean('require_photo')->default(false);
            $table->boolean('enable_self_register')->default(false);
            $table->string('notification_email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('qr_code')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
