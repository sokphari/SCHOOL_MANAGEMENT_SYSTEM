<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
            $table->unique(['school_class_id', 'name']);
        });

        Schema::create('term_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grading_term_id')->constrained('grading_terms')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('activity_score', 5, 2)->nullable();
            $table->decimal('exam_score', 5, 2)->nullable();
            $table->timestamps();
            $table->unique(['grading_term_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('term_scores');
        Schema::dropIfExists('grading_terms');
    }
};
