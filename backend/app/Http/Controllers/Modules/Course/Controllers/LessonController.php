<?php

namespace App\Http\Controllers\Modules\Course\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LessonController extends Controller
{
    public function store(Request $request, Course $course)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'lesson_number' => ['nullable', 'integer', 'min:1', 'max:65535', Rule::unique('lessons', 'lesson_number')->where('course_id', $course->id)],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);
        $lesson = $course->lessons()->create($data);

        return response()->json(['message' => 'Lesson created.', 'data' => $lesson->load('course')], 201);
    }

    public function update(Request $request, Lesson $lesson)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'lesson_number' => ['nullable', 'integer', 'min:1', 'max:65535', Rule::unique('lessons', 'lesson_number')->where('course_id', $lesson->course_id)->ignore($lesson->id)],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        $lesson->update($data);

        return response()->json(['message' => 'Lesson updated.', 'data' => $lesson->fresh()->load('course')]);
    }

    public function destroy(Lesson $lesson)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        if ($lesson->schoolClasses()->exists()) {
            return response()->json(['message' => 'This lesson is assigned to a class. Reassign that class before deleting the lesson.'], 409);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted.']);
    }

    private function adminOnly()
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can manage courses and lessons.'], 403);
        }

        return null;
    }
}
