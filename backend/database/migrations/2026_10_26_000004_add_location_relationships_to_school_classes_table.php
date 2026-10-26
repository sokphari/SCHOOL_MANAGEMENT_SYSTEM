<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->foreignId('building_id')->nullable()->after('academic_year')->constrained()->nullOnDelete();
            $table->foreignId('floor_id')->nullable()->after('building_id')->constrained()->nullOnDelete();
            $table->foreignId('room_id')->nullable()->after('floor_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('room_id');
            $table->dropConstrainedForeignId('floor_id');
            $table->dropConstrainedForeignId('building_id');
        });
    }
};
