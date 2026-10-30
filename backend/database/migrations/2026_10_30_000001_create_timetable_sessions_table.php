<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timetable_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // ISO-8601: Monday = 1, Sunday = 7
            $table->time('starts_at');
            $table->time('ends_at');
            $table->timestamps();
            $table->index(['day_of_week', 'starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_sessions');
    }
};
