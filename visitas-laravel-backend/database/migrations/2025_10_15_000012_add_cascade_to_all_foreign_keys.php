<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // access_invited_emails -> access_id
        Schema::table('access_invited_emails', function (Blueprint $table) {
            $table->dropForeign(['access_id']);
            $table->foreign('access_id')->references('id')->on('accesses')->onDelete('cascade');
        });
        // visits -> access_id
        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign(['access_id']);
            $table->foreign('access_id')->references('id')->on('accesses')->onDelete('cascade');
        });
        // accesses -> created_by
        Schema::table('accesses', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });
        // blacklists -> added_by
        Schema::table('blacklists', function (Blueprint $table) {
            $table->dropForeign(['added_by']);
            $table->foreign('added_by')->references('id')->on('users')->onDelete('cascade');
        });
        // approvals -> host_id
        Schema::table('approvals', function (Blueprint $table) {
            $table->dropForeign(['host_id']);
            $table->foreign('host_id')->references('id')->on('users')->onDelete('cascade');
        });
        // invitations -> invited_by
        Schema::table('invitations', function (Blueprint $table) {
            $table->dropForeign(['invited_by']);
            $table->foreign('invited_by')->references('id')->on('users')->onDelete('cascade');
        });
        // visits -> host_id
        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign(['host_id']);
            $table->foreign('host_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // access_invited_emails -> access_id
        Schema::table('access_invited_emails', function (Blueprint $table) {
            $table->dropForeign(['access_id']);
            $table->foreign('access_id')->references('id')->on('accesses');
        });
        // visits -> access_id
        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign(['access_id']);
            $table->foreign('access_id')->references('id')->on('accesses');
        });
        // accesses -> created_by
        Schema::table('accesses', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->foreign('created_by')->references('id')->on('users');
        });
        // blacklists -> added_by
        Schema::table('blacklists', function (Blueprint $table) {
            $table->dropForeign(['added_by']);
            $table->foreign('added_by')->references('id')->on('users');
        });
        // approvals -> host_id
        Schema::table('approvals', function (Blueprint $table) {
            $table->dropForeign(['host_id']);
            $table->foreign('host_id')->references('id')->on('users');
        });
        // invitations -> invited_by
        Schema::table('invitations', function (Blueprint $table) {
            $table->dropForeign(['invited_by']);
            $table->foreign('invited_by')->references('id')->on('users');
        });
        // visits -> host_id
        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign(['host_id']);
            $table->foreign('host_id')->references('id')->on('users');
        });
    }
};
