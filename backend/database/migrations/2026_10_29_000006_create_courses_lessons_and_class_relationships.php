<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 50)->nullable()->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->string('name', 150);
            $table->unsignedSmallInteger('lesson_number')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->unique(['course_id', 'lesson_number']);
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->after('course')->constrained()->restrictOnDelete();
            $table->foreignId('lesson_id')->nullable()->after('lesson')->constrained()->restrictOnDelete();
        });

        $courseIds = [];
        $lessonIds = [];
        foreach (DB::table('school_classes')->orderBy('id')->get(['id', 'course', 'lesson']) as $schoolClass) {
            $courseName = trim((string) $schoolClass->course);
            if ($courseName === '') {
                continue;
            }

            if (! isset($courseIds[$courseName])) {
                $now = now();
                $courseIds[$courseName] = DB::table('courses')->insertGetId([
                    'name' => $courseName,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $lessonName = trim((string) $schoolClass->lesson);
            $lessonId = null;
            if ($lessonName !== '') {
                $lessonKey = $courseName."\0".$lessonName;
                if (! isset($lessonIds[$lessonKey])) {
                    $now = now();
                    $lessonIds[$lessonKey] = DB::table('lessons')->insertGetId([
                        'course_id' => $courseIds[$courseName],
                        'name' => $lessonName,
                        'status' => 'active',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
                $lessonId = $lessonIds[$lessonKey];
            }

            DB::table('school_classes')->where('id', $schoolClass->id)->update([
                'course_id' => $courseIds[$courseName],
                'lesson_id' => $lessonId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->dropForeign(['course_id']);
            $table->dropColumn(['lesson_id', 'course_id']);
        });

        Schema::dropIfExists('lessons');
        Schema::dropIfExists('courses');
    }
};
