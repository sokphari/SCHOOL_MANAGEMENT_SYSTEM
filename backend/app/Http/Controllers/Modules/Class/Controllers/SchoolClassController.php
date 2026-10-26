<?php

namespace App\Http\Controllers\Modules\Class\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Class\Requests\StoreSchoolClassRequest;
use App\Http\Controllers\Modules\Class\Requests\UpdateSchoolClassRequest;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function scheduleEnd(Request $request, SchoolClass $class)
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can schedule a class end date.'], 403);
        }

        $data = $request->validate([
            'end_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $class->update(['end_date' => $data['end_date']]);

        return response()->json([
            'message' => 'Class end date scheduled successfully.',
            'data' => $class->fresh(),
        ]);
    }

    public function preEnd(SchoolClass $class)
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can pre-end a class.'], 403);
        }

        $class->update(['pre_end_at' => now()]);

        return response()->json([
            'message' => 'Class is in pre-end. Attendance tracking has been stopped.',
            'data' => $class->fresh(),
        ]);
    }

    public function resume(SchoolClass $class)
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can resume a class.'], 403);
        }

        $class->update(['pre_end_at' => null, 'end_date' => null]);

        return response()->json([
            'message' => 'Class resumed and its end date cleared.',
            'data' => $class->fresh(),
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

    public function transferStudent(Request $request, SchoolClass $class, Student $student)
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can transfer students between classes.'], 403);
        }

        $data = $request->validate([
            'target_class_id' => ['required', 'integer', 'exists:school_classes,id'],
        ]);

        $target = SchoolClass::findOrFail($data['target_class_id']);
        if ($target->id === $class->id) {
            return response()->json(['message' => 'Choose a different class to transfer this student.'], 422);
        }

        if (!$class->students()->whereKey($student->id)->exists()) {
            return response()->json(['message' => 'The student is not enrolled in the source class.'], 422);
        }

        if ($target->students()->whereKey($student->id)->exists()) {
            return response()->json(['message' => 'The student is already enrolled in the destination class.'], 422);
        }

        if ($target->status !== 'active' || $target->pre_end_at || ($target->end_date && $target->end_date->lt(Carbon::today()))) {
            return response()->json(['message' => 'Students can only be transferred to an active class that is accepting attendance.'], 422);
        }

        DB::transaction(function () use ($class, $target, $student) {
            $class->students()->detach($student->id);
            $target->students()->syncWithoutDetaching([
                $student->id => ['joined_at' => now()->toDateString(), 'status' => 'active'],
            ]);
        });

        return response()->json([
            'message' => 'Student transferred successfully.',
            'data' => [
                'student_id' => $student->id,
                'source_class_id' => $class->id,
                'target_class_id' => $target->id,
            ],
        ]);
    }

    public function switchTeacher(Request $request, SchoolClass $class)
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can change a class teacher.'], 403);
        }

        $data = $request->validate([
            'teacher_id' => ['required', 'integer', 'exists:teachers,id'],
        ]);

        $class->update(['teacher_id' => $data['teacher_id']]);

        return response()->json([
            'message' => 'Class teacher updated successfully.',
            'data' => $class->fresh()->load('teacher'),
        ]);
    }
}
