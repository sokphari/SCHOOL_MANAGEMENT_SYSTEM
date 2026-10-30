<?php

namespace App\Http\Controllers\Modules\Student\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Student\Requests\StoreStudentRequest;
use App\Http\Controllers\Modules\Student\Requests\UpdateStudentRequest;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->user()->role === 'teacher') {
            $teacherId = Teacher::where('user_id', $request->user()->id)->value('id');
            abort_unless($teacherId, 403, 'Teacher profile is not linked to this account.');
            $query->whereHas('classes', fn ($classQuery) => $classQuery->where('teacher_id', $teacherId));
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('student_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        return response()->json(
            $query->latest()->paginate(15)
        );
    }

    public function store(StoreStudentRequest $request)
    {
        $this->requireAdmin();
        $student = Student::create($request->validated());

        return response()->json([
            'message' => 'Student created successfully',
            'data' => $student,
        ], 201);
    }

    public function show(Student $student)
    {
        $this->requireStudentAccess($student);
        $teacherId = $this->currentTeacherId();
        $classScope = fn ($query) => $teacherId ? $query->where('teacher_id', $teacherId) : $query;
        $attendanceScope = fn ($query) => $teacherId
            ? $query->whereHas('schoolClass', fn ($classQuery) => $classQuery->where('teacher_id', $teacherId))
            : $query;

        $student->load(['classes' => $classScope])->loadCount([
            'attendances' => $attendanceScope,
            'attendances as attendance_present_count' => fn ($query) => $attendanceScope($query)->where('status', 'present'),
            'attendances as attendance_absent_count' => fn ($query) => $attendanceScope($query)->where('status', 'absent'),
            'attendances as attendance_late_count' => fn ($query) => $attendanceScope($query)->where('status', 'late'),
            'attendances as attendance_excused_count' => fn ($query) => $attendanceScope($query)->where('status', 'excused'),
        ]);

        $totalAttendance = (int) $student->attendances_count;
        $presentAttendance = (int) $student->attendance_present_count;
        $student->setAttribute(
            'attendance_rate',
            $totalAttendance > 0 ? round(($presentAttendance / $totalAttendance) * 100, 1) : null
        );

        return response()->json($student);
    }

    public function attendanceHistory(Student $student)
    {
        $this->requireStudentAccess($student);
        $query = $student->attendances()->with('schoolClass:id,name,section');

        $teacherId = $this->currentTeacherId();
        if ($teacherId) {
            $query->whereHas('schoolClass', fn ($classQuery) => $classQuery->where('teacher_id', $teacherId));
        }

        return response()->json($query->latest('attendance_date')->paginate(10));
    }

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $this->requireAdmin();
        $student->update($request->validated());

        return response()->json([
            'message' => 'Student updated successfully',
            'data' => $student,
        ]);
    }

    public function destroy(Student $student)
    {
        $this->requireAdmin();
        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully',
        ]);
    }

    private function requireAdmin(): void
    {
        abort_unless(request()->user()?->role === 'admin', 403, 'Only admins can modify student records.');
    }

    private function requireStudentAccess(Student $student): void
    {
        $teacherId = $this->currentTeacherId();
        if (! $teacherId) {
            return;
        }

        abort_unless(
            $student->classes()->where('teacher_id', $teacherId)->exists(),
            404
        );
    }

    private function currentTeacherId(): ?int
    {
        $user = request()->user();
        if ($user?->role !== 'teacher') {
            return null;
        }

        $teacherId = Teacher::where('user_id', $user->id)->value('id');
        abort_unless($teacherId, 403, 'Teacher profile is not linked to this account.');

        return (int) $teacherId;
    }
}
