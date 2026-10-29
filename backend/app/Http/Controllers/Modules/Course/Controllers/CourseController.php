<?php

namespace App\Http\Controllers\Modules\Course\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function index()
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }

        return response()->json(Course::with(['lessons' => fn ($query) => $query->orderBy('lesson_number')->orderBy('name')])
            ->withCount(['lessons', 'schoolClasses'])
            ->orderBy('name')
            ->get());
    }

    public function show(Course $course)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }

        return response()->json($course->load(['lessons' => fn ($query) => $query->orderBy('lesson_number')->orderBy('name')])->loadCount(['lessons', 'schoolClasses']));
    }

    public function store(Request $request)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:50', 'unique:courses,code'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        return response()->json(['message' => 'Course created.', 'data' => Course::create($data)], 201);
    }

    public function update(Request $request, Course $course)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('courses', 'code')->ignore($course->id)],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        $course->update($data);

        return response()->json(['message' => 'Course updated.', 'data' => $course->fresh()]);
    }

    public function destroy(Course $course)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        if ($course->lessons()->exists() || $course->schoolClasses()->exists()) {
            return response()->json(['message' => 'This course still has lessons or class assignments. Remove or reassign them before deleting it.'], 409);
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted.']);
    }

    private function adminOnly()
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can manage courses and lessons.'], 403);
        }

        return null;
    }
}
