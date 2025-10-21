<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar la llave foránea actual
        Schema::table('access_invited_emails', function (Blueprint $table) {
            $table->dropForeign(['access_id']);
        });
        // Volver a crear la llave foránea con borrado en cascada
        Schema::table('access_invited_emails', function (Blueprint $table) {
            $table->foreign('access_id')
                ->references('id')->on('accesses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Eliminar la llave foránea con cascade
        Schema::table('access_invited_emails', function (Blueprint $table) {
            $table->dropForeign(['access_id']);
        });
        // Volver a crear la llave foránea sin cascade
        Schema::table('access_invited_emails', function (Blueprint $table) {
            $table->foreign('access_id')
                ->references('id')->on('accesses');
        });
    }
};
