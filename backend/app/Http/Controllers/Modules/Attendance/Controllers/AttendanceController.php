<?php

namespace App\Http\Controllers\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Attendance\Requests\StoreAttendanceRequest;
use App\Models\Attendance;
use App\Models\SchoolClass;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
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

        if ($this->attendanceTrackingBlocked($class, $data['attendance_date'])) {
            return response()->json([
                'message' => $this->attendanceBlockedMessage($class),
            ], 403);
        }

        if ($user->role === 'teacher') {
            $permissionStudentIds = collect($data['records'])
                ->where('status', 'excused')
                ->pluck('student_id')
                ->unique()
                ->values();
            $weekStart = Carbon::parse($data['attendance_date'])->startOfWeek(Carbon::MONDAY)->toDateString();
            $weekEnd = Carbon::parse($data['attendance_date'])->endOfWeek(Carbon::SUNDAY)->toDateString();
            $alreadyGrantedStudentIds = Attendance::whereIn('student_id', $permissionStudentIds)
                ->where('status', 'excused')
                ->whereBetween('attendance_date', [$weekStart, $weekEnd])
                ->distinct()
                ->pluck('student_id');

            if ($alreadyGrantedStudentIds->isNotEmpty()) {
                return response()->json([
                    'message' => 'This student has already received permission this week.',
                    'student_ids' => $alreadyGrantedStudentIds,
                ], 403);
            }
        }

        if ($user->role === 'teacher' && Attendance::where('school_class_id', $class->id)
            ->where('attendance_date', $data['attendance_date'])
            ->exists()) {
            return response()->json([
                'message' => 'Attendance has already been submitted and cannot be changed by a teacher.'
            ], 403);
        }

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

    public function teacherPermissionAvailability(Request $request, \App\Models\SchoolClass $class)
    {
        $data = $request->validate(['date' => ['required', 'date']]);
        $user = auth()->user();

        if ($this->attendanceTrackingBlocked($class, $data['date'])) {
            return response()->json([
                'message' => $this->attendanceBlockedMessage($class),
                'availability' => [],
            ], 403);
        }

        if ($user->role === 'teacher') {
            $teacher = \App\Models\Teacher::where('user_id', $user->id)->first();
            if (!$teacher || $class->teacher_id !== $teacher->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $date = Carbon::parse($data['date']);
        $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = $date->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
        $studentIds = $class->students()->pluck('students.id');
        $usedStudentIds = Attendance::whereIn('student_id', $studentIds)
            ->where('status', 'excused')
            ->whereBetween('attendance_date', [$weekStart, $weekEnd])
            ->distinct()
            ->pluck('student_id')
            ->flip();
        $availability = $studentIds->mapWithKeys(fn ($studentId) => [
            $studentId => $user->role === 'admin' || !$usedStudentIds->has($studentId),
        ]);

        return response()->json([
            'availability' => $availability,
            'week_start' => $weekStart,
            'week_end' => $weekEnd,
        ]);
    }

    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        $class = SchoolClass::findOrFail($data['school_class_id']);
        if ($this->attendanceTrackingBlocked($class, $data['attendance_date'])) {
            return response()->json([
                'message' => $this->attendanceBlockedMessage($class),
            ], 403);
        }

        $user = auth()->user();
        if ($user->role === 'teacher' && $data['status'] === 'excused') {
            $date = Carbon::parse($data['attendance_date']);
            $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
            $weekEnd = $date->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
            $alreadyGranted = Attendance::where('student_id', $data['student_id'])
                ->where('status', 'excused')
                ->whereBetween('attendance_date', [$weekStart, $weekEnd])
                ->exists();

            if ($alreadyGranted) {
                return response()->json([
                    'message' => 'This student has already received permission this week.'
                ], 403);
            }
        }

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

    public function grantPermissionRange(Request $request, \App\Models\SchoolClass $class)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Only admins can grant permission date ranges.'], 403);
        }

        $data = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'note' => ['required', 'string', 'max:1000'],
        ]);

        if ($this->attendanceTrackingBlocked($class, $data['start_date']) || $this->attendanceTrackingBlocked($class, $data['end_date'])) {
            return response()->json([
                'message' => $this->attendanceBlockedMessage($class),
            ], 403);
        }

        $studentIsInClass = $class->students()->where('students.id', $data['student_id'])->exists();
        if (!$studentIsInClass) {
            return response()->json(['message' => 'The selected student is not assigned to this class.'], 422);
        }

        $saved = [];
        foreach (CarbonPeriod::create($data['start_date'], $data['end_date']) as $date) {
            $saved[] = Attendance::updateOrCreate(
                [
                    'student_id' => $data['student_id'],
                    'school_class_id' => $class->id,
                    'attendance_date' => $date->toDateString(),
                ],
                [
                    'status' => 'excused',
                    'note' => $data['note'] ?? null,
                    'marked_by' => auth()->id(),
                ]
            );
        }

        return response()->json([
            'message' => 'Permission recorded for the selected date range.',
            'data' => $saved,
        ]);
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

    private function attendanceTrackingBlocked(SchoolClass $class, string $date): bool
    {
        return $class->status !== 'active'
            || $class->pre_end_at !== null
            || ($class->end_date !== null && Carbon::parse($date)->greaterThan(Carbon::parse($class->end_date)->startOfDay()));
    }

    private function attendanceBlockedMessage(SchoolClass $class): string
    {
        if ($class->pre_end_at !== null) {
            return 'Attendance tracking is disabled because this class is in pre-end.';
        }
        if ($class->status !== 'active') {
            return 'Attendance tracking is disabled because this class is inactive.';
        }
        return 'Attendance tracking is disabled on or after the scheduled class end date.';
    }
}
