<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('floors', function (Blueprint $table) {
            $table->unsignedSmallInteger('floor_number')->nullable()->after('name');
            $table->unique(['building_id', 'floor_number']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->string('room_type', 50)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('room_type');
        });
        Schema::table('floors', function (Blueprint $table) {
            $table->dropUnique(['building_id', 'floor_number']);
            $table->dropColumn('floor_number');
        });
    }
};
