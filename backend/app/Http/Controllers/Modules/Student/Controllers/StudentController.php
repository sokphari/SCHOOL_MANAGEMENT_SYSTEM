<?php

namespace App\Http\Controllers\Modules\Student\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Student\Requests\StoreStudentRequest;
use App\Http\Controllers\Modules\Student\Requests\UpdateStudentRequest;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Student::query();

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
        $student = Student::create($request->validated());

        return response()->json([
            'message' => 'Student created successfully',
            'data' => $student
        ], 201);
    }

    public function show(Student $student)
    {
        $student->load('classes')->loadCount('attendances')->loadCount([
            'attendances as attendance_present_count' => fn ($query) => $query->where('status', 'present'),
            'attendances as attendance_absent_count' => fn ($query) => $query->where('status', 'absent'),
            'attendances as attendance_late_count' => fn ($query) => $query->where('status', 'late'),
            'attendances as attendance_excused_count' => fn ($query) => $query->where('status', 'excused'),
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
        return response()->json(
            $student->attendances()
                ->with('schoolClass:id,name,section')
                ->latest('attendance_date')
                ->paginate(10)
        );
    }

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $student->update($request->validated());

        return response()->json([
            'message' => 'Student updated successfully',
            'data' => $student
        ]);
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully'
        ]);
    }
}
