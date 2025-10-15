<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar la llave foránea actual
        Schema::table('accesses', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });
        // Volver a crear la llave foránea con borrado en cascada
        Schema::table('accesses', function (Blueprint $table) {
            $table->foreign('created_by')
                ->references('id')->on('users')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Eliminar la llave foránea con cascade
        Schema::table('accesses', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });
        // Volver a crear la llave foránea sin cascade
        Schema::table('accesses', function (Blueprint $table) {
            $table->foreign('created_by')
                ->references('id')->on('users');
        });
    }
};
