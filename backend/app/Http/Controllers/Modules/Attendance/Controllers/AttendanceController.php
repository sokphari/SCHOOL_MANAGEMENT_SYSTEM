<?php

namespace App\Http\Controllers\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Attendance\Requests\StoreAttendanceRequest;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Attendance::with(['student', 'schoolClass', 'marker']);

        if ($user->role === 'teacher') {
            $teacher = \App\Models\Teacher::where('user_id', $user->id)->first();

            if (!$teacher) {
                return response()->json([
                    'message' => 'Teacher profile is not linked to this user.'
                ], 404);
            }

            $classIds = \App\Models\SchoolClass::where('teacher_id', $teacher->id)->pluck('id');
            $query->whereIn('school_class_id', $classIds);
        }

        return response()->json($query->latest('attendance_date')->paginate(10));
    }
    public function bulkStore(\App\Http\Controllers\Modules\Attendance\Requests\BulkAttendanceRequest $request, \App\Models\SchoolClass $class)
    {
        $user = auth()->user();

        if ($user->role === 'teacher') {
            $teacher = \App\Models\Teacher::where('user_id', $user->id)->first();

            if (!$teacher || $class->teacher_id !== $teacher->id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }
        }

        $data = $request->validated();

        $class->load('students');
        $classStudentIds = $class->students->pluck('id')->toArray();

        $saved = [];

        foreach ($data['records'] as $record) {
            if (!in_array($record['student_id'], $classStudentIds)) {
                continue;
            }

            $attendance = \App\Models\Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'school_class_id' => $class->id,
                    'attendance_date' => $data['attendance_date'],
                ],
                [
                    'status' => $record['status'],
                    'note' => $record['note'] ?? null,
                    'marked_by' => auth()->id(),
                ]
            );

            $saved[] = $attendance;
        }

        return response()->json([
            'message' => 'Attendance saved successfully',
            'data' => $saved,
        ]);
    }

    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        $exists = Attendance::where('student_id', $data['student_id'])
            ->where('school_class_id', $data['school_class_id'])
            ->where('attendance_date', $data['attendance_date'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Attendance already recorded'
            ], 422);
        }

        $attendance = Attendance::create([
            'student_id' => $data['student_id'],
            'school_class_id' => $data['school_class_id'],
            'attendance_date' => $data['attendance_date'],
            'status' => $data['status'],
            'note' => $data['note'] ?? null,
            'marked_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Attendance marked successfully',
            'data' => $attendance
        ], 201);
    }

    public function show(Attendance $attendance)
    {
        return response()->json(
            $attendance->load(['student', 'schoolClass', 'marker'])
        );
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return response()->json([
            'message' => 'Attendance deleted successfully'
        ]);
    }

    public function byClassAndDate($classId, $date)
    {
        $attendances = Attendance::with('student')
            ->where('school_class_id', $classId)
            ->where('attendance_date', $date)
            ->get();

        return response()->json($attendances);
    }
}
