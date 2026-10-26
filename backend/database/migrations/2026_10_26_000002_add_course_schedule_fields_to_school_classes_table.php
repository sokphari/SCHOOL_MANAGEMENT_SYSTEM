<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->string('course', 100)->nullable()->after('name');
            $table->string('lesson', 150)->nullable()->after('course');
            $table->enum('delivery_mode', ['physical', 'hybrid', 'online'])->nullable()->after('lesson');
            $table->string('building', 100)->nullable()->after('academic_year');
            $table->string('floor', 50)->nullable()->after('building');
            $table->string('term', 100)->nullable()->after('room');
            $table->string('time', 100)->nullable()->after('term');
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropColumn(['course', 'lesson', 'delivery_mode', 'building', 'floor', 'term', 'time']);
        });
    }
};
