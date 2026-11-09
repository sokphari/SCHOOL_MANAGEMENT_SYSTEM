<?php

namespace App\Http\Controllers\Modules\Dashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\SchoolClass;
use App\Models\StudentRequest;
use App\Models\Attendance;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // Admin dashboard
        if ($user->role === 'admin') {
            $filters = $request->validate([
                'from_date' => ['nullable', 'date_format:Y-m-d'],
                'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            ]);
            $fromDate = $filters['from_date'] ?? today()->subDays(6)->toDateString();
            $toDate = $filters['to_date'] ?? today()->toDateString();
            $attendanceByDate = Attendance::query()
                ->select('attendance_date', 'status', DB::raw('COUNT(*) as total'))
                ->whereBetween('attendance_date', [$fromDate, $toDate])
                ->groupBy('attendance_date', 'status')
                ->orderBy('attendance_date')
                ->get()
                ->groupBy(fn ($row) => (string) $row->attendance_date);
            $attendanceTrend = collect(CarbonPeriod::create($fromDate, $toDate))
                ->map(function ($date) use ($attendanceByDate) {
                    $dateKey = $date->toDateString();
                    $records = $attendanceByDate->get($dateKey, collect())->keyBy('status');

                    return [
                        'date' => $dateKey,
                        'present' => (int) ($records->get('present')?->total ?? 0),
                        'absent' => (int) ($records->get('absent')?->total ?? 0),
                        'late' => (int) ($records->get('late')?->total ?? 0),
                        'permission' => (int) ($records->get('excused')?->total ?? 0),
                    ];
                })
                ->values();

            return response()->json([
                'role' => 'admin',
                'total_students' => Student::count(),
                'total_teachers' => Teacher::count(),
                'total_classes' => SchoolClass::count(),
                'today_attendance' => Attendance::whereDate('attendance_date', today())->count(),
                'today_present' => Attendance::whereDate('attendance_date', today())
                    ->where('status', 'present')
                    ->count(),
                'attendance_range' => ['from_date' => $fromDate, 'to_date' => $toDate],
                'attendance_trend' => $attendanceTrend,

                'male_students' => Student::where('gender', 'male')->count(),
                'female_students' => Student::where('gender', 'female')->count(),

                'request_stats' => [
                    'pending' => StudentRequest::where('status', 'pending')->count(),
                    'in_progress' => StudentRequest::where('status', 'in_progress')->count(),
                    'resolved' => StudentRequest::where('status', 'resolved')->count(),
                    'rejected' => StudentRequest::where('status', 'rejected')->count(),
                ],
            ]);
        }

        // Teacher dashboard
        if ($user->role === 'teacher') {
            $teacher = Teacher::where('user_id', $user->id)->first();

            if (!$teacher) {
                return response()->json([
                    'message' => 'Teacher profile is not linked to this user.'
                ], 404);
            }

            $classes = SchoolClass::where('teacher_id', $teacher->id)->get();
            $classIds = $classes->pluck('id');

            // distinct student ids in teacher's classes
            $studentIds = DB::table('class_student')
                ->whereIn('school_class_id', $classIds)
                ->distinct()
                ->pluck('student_id');

            return response()->json([
                'role' => 'teacher',
                'my_classes' => $classes,
                'today_attendance' => Attendance::whereIn('school_class_id', $classIds)
                    ->whereDate('attendance_date', today())
                    ->count(),

                'total_students' => Student::whereIn('id', $studentIds)->count(),
                'male_students' => Student::whereIn('id', $studentIds)
                    ->where('gender', 'male')
                    ->count(),
                'female_students' => Student::whereIn('id', $studentIds)
                    ->where('gender', 'female')
                    ->count(),

                'request_stats' => [
                    'pending' => StudentRequest::where('status', 'pending')->count(),
                    'in_progress' => StudentRequest::where('status', 'in_progress')->count(),
                    'resolved' => StudentRequest::where('status', 'resolved')->count(),
                    'rejected' => StudentRequest::where('status', 'rejected')->count(),
                ],
            ]);
        }

        return response()->json([
            'message' => 'Unauthorized'
        ], 403);
    }
}
