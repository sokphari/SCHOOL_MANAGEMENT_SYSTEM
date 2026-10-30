<?php

namespace App\Http\Controllers\Modules\Grade\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\GradingTerm;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TermScore;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GradeController extends Controller
{
    public function terms(SchoolClass $class)
    {
        $this->authorizeClass($class);

        return response()->json($class->gradingTerms()->withCount('scores')->orderBy('start_date')->get());
    }

    public function createTerm(Request $request, SchoolClass $class)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only admins can create grading terms.');
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('grading_terms', 'name')->where('school_class_id', $class->id),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $term = $class->gradingTerms()->create($data);

        return response()->json(['message' => 'Grading term created successfully.', 'data' => $term], 201);
    }

    public function showTerm(GradingTerm $term)
    {
        $term->load('schoolClass');
        $this->authorizeClass($term->schoolClass);

        $scoreByStudent = $term->scores()->get()->keyBy('student_id');
        $attendanceByStudent = Attendance::query()
            ->selectRaw("student_id, SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count, SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as permission_count, SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count")
            ->where('school_class_id', $term->school_class_id)
            ->whereBetween('attendance_date', [$term->start_date, $term->end_date])
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $students = $term->schoolClass->students()->orderBy('first_name')->orderBy('last_name')->get()->map(function (Student $student) use ($scoreByStudent, $attendanceByStudent) {
            $score = $scoreByStudent->get($student->id);
            $attendance = $attendanceByStudent->get($student->id);
            $absent = (int) ($attendance->absent_count ?? 0);
            $permission = (int) ($attendance->permission_count ?? 0);
            $attendanceScore = max(0, 40 - $absent - (0.5 * $permission));
            $activityScore = $score?->activity_score === null ? null : (float) $score->activity_score;
            $examScore = $score?->exam_score === null ? null : (float) $score->exam_score;

            return [
                'id' => $student->id,
                'student_code' => $student->student_code,
                'name' => trim($student->first_name.' '.$student->last_name),
                'attendance_score' => $attendanceScore,
                'absent_count' => $absent,
                'permission_count' => $permission,
                'late_count' => (int) ($attendance->late_count ?? 0),
                'activity_score' => $activityScore,
                'exam_score' => $examScore,
                'total_score' => $attendanceScore + ($activityScore ?? 0) + ($examScore ?? 0),
            ];
        });

        return response()->json([
            'term' => $term,
            'class' => $term->schoolClass,
            'students' => $students,
            'score_maximums' => ['attendance' => 40, 'activity' => 30, 'exam' => 40, 'total' => 110],
        ]);
    }

    public function saveStudentScore(Request $request, GradingTerm $term, Student $student)
    {
        $term->load('schoolClass');
        $this->authorizeClass($term->schoolClass);

        if (! $term->schoolClass->students()->whereKey($student->id)->exists()) {
            throw ValidationException::withMessages(['student' => 'This student is not enrolled in the term class.']);
        }

        $data = $request->validate([
            'activity_score' => ['nullable', 'numeric', 'min:0', 'max:30'],
            'exam_score' => ['nullable', 'numeric', 'min:0', 'max:40'],
        ]);

        $score = TermScore::updateOrCreate(
            ['grading_term_id' => $term->id, 'student_id' => $student->id],
            $data
        );

        return response()->json(['message' => 'Scores saved successfully.', 'data' => $score]);
    }

    private function authorizeClass(SchoolClass $class): void
    {
        $user = request()->user();
        abort_unless(in_array($user?->role, ['admin', 'teacher'], true), 403);

        if ($user->role === 'teacher') {
            $teacherId = Teacher::where('user_id', $user->id)->value('id');
            abort_unless($teacherId && (int) $class->teacher_id === (int) $teacherId, 403, 'You may only access grades for your assigned classes.');
        }
    }
}
