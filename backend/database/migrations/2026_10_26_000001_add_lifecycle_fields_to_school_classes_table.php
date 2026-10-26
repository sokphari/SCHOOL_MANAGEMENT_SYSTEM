<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->date('end_date')->nullable()->after('status');
            $table->timestamp('pre_end_at')->nullable()->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropColumn(['end_date', 'pre_end_at']);
        });
    }
};
