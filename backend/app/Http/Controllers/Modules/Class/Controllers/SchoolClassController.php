<?php

namespace App\Http\Controllers\Modules\Class\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Class\Requests\StoreSchoolClassRequest;
use App\Http\Controllers\Modules\Class\Requests\UpdateSchoolClassRequest;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{

    public function index(Request $request)
    {
        $user = auth()->user();

        $query = SchoolClass::with('teacher')->withCount('students');

        if ($user->role === 'teacher') {
            $teacher = Teacher::where('user_id', $user->id)->first();

            if (!$teacher) {
                return response()->json([
                    'message' => 'Teacher profile is not linked to this user.'
                ], 404);
            }

            $query->where('teacher_id', $teacher->id);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('section', 'like', "%{$search}%")
                    ->orWhere('academic_year', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreSchoolClassRequest $request)
    {
        $schoolClass = SchoolClass::create($request->validated());

        return response()->json([
            'message' => 'Class created successfully',
            'data' => $schoolClass
        ], 201);
    }

    public function show(SchoolClass $class)
    {
        return response()->json(
            $class->load(['teacher', 'students'])
        );
    }

    public function update(UpdateSchoolClassRequest $request, SchoolClass $class)
    {
        $class->update($request->validated());

        return response()->json([
            'message' => 'Class updated successfully',
            'data' => $class
        ]);
    }

    public function destroy(SchoolClass $class)
    {
        $class->delete();

        return response()->json([
            'message' => 'Class deleted successfully'
        ]);
    }

    public function assignStudent($classId, $studentId)
    {
        $class = SchoolClass::findOrFail($classId);
        $student = Student::findOrFail($studentId);

        $class->students()->syncWithoutDetaching([
            $student->id => [
                'joined_at' => now()->toDateString(),
                'status' => 'active',
            ]
        ]);

        return response()->json([
            'message' => 'Student assigned to class successfully'
        ]);
    }

    public function removeStudent($classId, $studentId)
    {
        $class = SchoolClass::findOrFail($classId);
        $student = Student::findOrFail($studentId);

        $class->students()->detach($student->id);

        return response()->json([
            'message' => 'Student removed from class successfully'
        ]);
    }
}
