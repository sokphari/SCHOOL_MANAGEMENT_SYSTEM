<?php

namespace App\Http\Controllers\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TimetableSession;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TimetableController extends Controller
{
    public function classOptions()
    {
        $user = request()->user();
        abort_unless(in_array($user?->role, ['admin', 'teacher'], true), 403);

        $query = SchoolClass::with([
            'teacher',
            'courseRecord',
            'lessonRecord',
            'roomLocation.floor.building',
            'buildingLocation',
        ])
            ->where('status', 'active')
            ->where(function ($classQuery) {
                $classQuery->whereNull('end_date')->orWhereDate('end_date', '>=', today());
            })
            ->whereNull('pre_end_at');

        if ($user->role === 'teacher') {
            $teacherId = Teacher::where('user_id', $user->id)->value('id');
            abort_unless($teacherId, 403, 'Teacher profile is not linked to this account.');
            $query->where('teacher_id', $teacherId);
        }

        return response()->json($query->orderBy('name')->orderBy('section')->get());
    }

    public function index()
    {
        $query = TimetableSession::with([
            'schoolClass.teacher',
            'schoolClass.courseRecord',
            'schoolClass.lessonRecord',
            'schoolClass.roomLocation.floor.building',
        ]);

        $this->limitToTeacherClasses($query);

        return response()->json($query->orderBy('day_of_week')->orderBy('starts_at')->get());
    }

    public function store(Request $request)
    {
        $this->requireAdmin();
        $data = $this->validatedSession($request);
        $class = SchoolClass::findOrFail($data['school_class_id']);
        $this->ensureNoConflict($class, $data);

        $session = TimetableSession::create($data);

        return response()->json([
            'message' => 'Timetable session created successfully.',
            'data' => $session->load($this->relations()),
        ], 201);
    }

    public function update(Request $request, TimetableSession $timetableSession)
    {
        $this->requireAdmin();
        $data = $this->validatedSession($request);
        $class = SchoolClass::findOrFail($data['school_class_id']);
        $this->ensureNoConflict($class, $data, $timetableSession->id);
        $timetableSession->update($data);

        return response()->json([
            'message' => 'Timetable session updated successfully.',
            'data' => $timetableSession->fresh()->load($this->relations()),
        ]);
    }

    public function destroy(TimetableSession $timetableSession)
    {
        $this->requireAdmin();
        $timetableSession->delete();

        return response()->json(['message' => 'Timetable session deleted successfully.']);
    }

    private function validatedSession(Request $request): array
    {
        $data = $request->validate([
            'school_class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'day_of_week' => ['required', 'integer', 'between:1,7'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
        ]);

        $class = SchoolClass::findOrFail($data['school_class_id']);
        if ($class->status !== 'active' || $class->pre_end_at || $class->end_date?->lt(today())) {
            throw ValidationException::withMessages(['school_class_id' => 'Choose an active class that has not ended.']);
        }

        return $data;
    }

    private function ensureNoConflict(SchoolClass $class, array $data, ?int $ignoreId = null): void
    {
        $query = TimetableSession::with('schoolClass')
            ->where('day_of_week', $data['day_of_week'])
            ->where('starts_at', '<', $data['ends_at'])
            ->where('ends_at', '>', $data['starts_at']);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $conflict = $query->get()->first(function (TimetableSession $session) use ($class) {
            $scheduledClass = $session->schoolClass;

            return $scheduledClass->id === $class->id
                || ($class->teacher_id && $scheduledClass->teacher_id === $class->teacher_id)
                || $this->sameRoom($class, $scheduledClass);
        });

        if ($conflict) {
            $reason = $conflict->schoolClass->id === $class->id
                ? 'This class already has a session at that time.'
                : ($class->teacher_id && $conflict->schoolClass->teacher_id === $class->teacher_id
                    ? 'This teacher is already scheduled for an overlapping session.'
                    : 'This room is already booked for an overlapping session.');

            throw ValidationException::withMessages(['starts_at' => $reason]);
        }
    }

    private function limitToTeacherClasses($query): void
    {
        $user = request()->user();
        abort_unless(in_array($user?->role, ['admin', 'teacher'], true), 403);

        if ($user->role === 'teacher') {
            $teacherId = Teacher::where('user_id', $user->id)->value('id');
            abort_unless($teacherId, 403, 'Teacher profile is not linked to this account.');
            $query->whereHas('schoolClass', fn ($classQuery) => $classQuery->where('teacher_id', $teacherId));
        }
    }

    private function requireAdmin(): void
    {
        abort_unless(request()->user()?->role === 'admin', 403, 'Only admins can manage timetable sessions.');
    }

    private function sameRoom(SchoolClass $class, SchoolClass $scheduledClass): bool
    {
        if ($class->room_id && $scheduledClass->room_id) {
            return (int) $class->room_id === (int) $scheduledClass->room_id;
        }

        if (! $class->room || ! $scheduledClass->room) {
            return false;
        }

        return mb_strtolower(trim($class->room)) === mb_strtolower(trim($scheduledClass->room))
            && mb_strtolower(trim((string) $class->building)) === mb_strtolower(trim((string) $scheduledClass->building));
    }

    private function relations(): array
    {
        return ['schoolClass.teacher', 'schoolClass.courseRecord', 'schoolClass.lessonRecord', 'schoolClass.roomLocation.floor.building'];
    }
}
