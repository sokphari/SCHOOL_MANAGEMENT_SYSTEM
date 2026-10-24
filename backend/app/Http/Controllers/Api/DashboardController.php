<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\SchoolClass;
use App\Models\StudentRequest;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Admin dashboard
        if ($user->role === 'admin') {
            return response()->json([
                'role' => 'admin',
                'total_students' => Student::count(),
                'total_teachers' => Teacher::count(),
                'total_classes' => SchoolClass::count(),
                'today_attendance' => Attendance::whereDate('attendance_date', today())->count(),

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
