<?php

namespace App\Http\Controllers\Modules\Audit\Services;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Building;
use App\Models\Course;
use App\Models\Floor;
use App\Models\GradingTerm;
use App\Models\Lesson;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\StudentRequest;
use App\Models\Teacher;
use App\Models\TermScore;
use App\Models\TimetableSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuditLogService
{
    public function record(
        Request $request,
        string $action,
        string $module,
        ?Model $subject = null,
        ?int $statusCode = null,
        array $metadata = [],
    ): void {
        try {
            $this->persist(
                $request,
                $action,
                $module,
                $subject ? class_basename($subject) : null,
                $subject?->getKey(),
                $statusCode ?? Response::HTTP_OK,
                $metadata,
            );
        } catch (Throwable $exception) {
            Log::error('Audit log write failed.', ['exception' => $exception::class]);
        }
    }

    private function persist(
        Request $request,
        string $action,
        string $module,
        ?string $subjectType,
        int|string|null $subjectId,
        int $statusCode,
        array $metadata = [],
    ): void {
        (new AuditLog)->forceFill([
            'actor_id' => $request->user()?->getAuthIdentifier(),
            'action' => $action,
            'module' => $module,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'method' => $request->method(),
            'route' => '/'.ltrim($request->route()?->uri() ?? $request->path(), '/'),
            'status_code' => $statusCode,
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 2000),
            'metadata' => $metadata === [] ? null : $metadata,
            'created_at' => now(),
        ])->save();
    }

    /** Capture an allowlisted model snapshot before the controller changes it. */
    public function captureBefore(Request $request): ?array
    {
        $route = $request->route();
        if (! $route) {
            return null;
        }

        $models = [
            'student' => Student::class,
            'teacher' => Teacher::class,
            'class' => SchoolClass::class,
            'course' => Course::class,
            'lesson' => Lesson::class,
            'building' => Building::class,
            'floor' => Floor::class,
            'room' => Room::class,
            'attendance' => Attendance::class,
            'term' => GradingTerm::class,
            'timetableSession' => TimetableSession::class,
            'studentRequest' => StudentRequest::class,
            'studentRegistration' => StudentRegistration::class,
            'user' => User::class,
        ];

        foreach ($route->parameters() as $name => $value) {
            $modelClass = $models[$name] ?? null;
            $id = $value instanceof Model ? $value->getKey() : $value;
            if (! $modelClass || ! is_numeric($id)) {
                continue;
            }

            $model = $modelClass::query()->find($id);
            if ($model) {
                return [
                    'type' => class_basename($model),
                    'id' => $model->getKey(),
                    'before' => $this->snapshot($model),
                ];
            }
        }

        return null;
    }

    public function recordMutation(Request $request, Response $response, ?array $before = null): void
    {
        $route = $request->route();
        $uri = $route?->uri() ?? $request->path();
        $method = $request->method();
        $status = $response->getStatusCode();
        $module = $this->moduleFor($uri);

        if ($status >= 400) {
            if (in_array($status, [Response::HTTP_UNAUTHORIZED, Response::HTTP_FORBIDDEN, Response::HTTP_TOO_MANY_REQUESTS], true)) {
                $action = $status === Response::HTTP_TOO_MANY_REQUESTS
                    ? 'security.rate_limited'
                    : 'security.access_denied';
                $this->record($request, $action, 'security', statusCode: $status);

                return;
            }

            $this->record($request, $this->failedActionFor($request, $method, $uri), $module, statusCode: $status);

            return;
        }

        $subject = collect($route?->parameters() ?? [])
            ->filter(fn ($value) => $value instanceof Model)
            ->last();

        $responseData = method_exists($response, 'getData') ? $response->getData(true) : [];
        $responseId = data_get($responseData, 'data.id', data_get($responseData, 'id'));
        $subjectId = $subject?->getKey() ?? (is_numeric($responseId) ? (int) $responseId : ($before['id'] ?? null));
        $subjectType = $subject ? class_basename($subject) : ($before['type'] ?? $this->subjectTypeFor($uri));

        $metadata = [];
        $modelClass = $this->modelClassFor($subjectType);
        $beforeSnapshot = $before['before'] ?? null;
        $beforeId = $before['id'] ?? null;
        $entityId = $beforeId ?? $subjectId;
        $afterSnapshot = null;

        if ($modelClass && $entityId && $method !== 'DELETE') {
            $entity = $modelClass::query()->find($entityId);
            $afterSnapshot = $entity ? $this->snapshot($entity) : null;
        }

        if ($method === 'POST' && $beforeSnapshot === null && $modelClass && $subjectId && $response->isSuccessful()) {
            $entity = $modelClass::query()->find($subjectId);
            $afterSnapshot = $entity ? $this->snapshot($entity) : null;
        }

        if ($beforeSnapshot !== null || $afterSnapshot !== null) {
            $metadata['changes'] = $this->diff($beforeSnapshot, $afterSnapshot);
        }

        $this->persist(
            $request,
            $this->actionFor($request, $method, $uri),
            $module,
            $subjectType,
            $subjectId,
            $status,
            $metadata,
        );
    }

    private function modelClassFor(?string $subjectType): ?string
    {
        return match ($subjectType) {
            'Student' => Student::class,
            'Teacher' => Teacher::class,
            'SchoolClass' => SchoolClass::class,
            'Course' => Course::class,
            'Lesson' => Lesson::class,
            'Building' => Building::class,
            'Floor' => Floor::class,
            'Room' => Room::class,
            'Attendance' => Attendance::class,
            'GradingTerm' => GradingTerm::class,
            'TermScore' => TermScore::class,
            'TimetableSession' => TimetableSession::class,
            'StudentRequest' => StudentRequest::class,
            'StudentRegistration' => StudentRegistration::class,
            'User' => User::class,
            default => null,
        };
    }

    /** Keep audit snapshots deliberately narrow; credentials and secrets are never included. */
    private function snapshot(Model $model): array
    {
        $fields = match (class_basename($model)) {
            'Student' => ['student_code', 'first_name', 'last_name', 'gender', 'date_of_birth', 'phone', 'email', 'address', 'guardian_name', 'guardian_phone', 'enrollment_date', 'status'],
            'Teacher' => ['teacher_code', 'first_name', 'last_name', 'gender', 'phone', 'email', 'address', 'hire_date', 'status'],
            'SchoolClass' => ['name', 'course', 'lesson', 'course_id', 'lesson_id', 'delivery_mode', 'section', 'academic_year', 'building_id', 'floor_id', 'room_id', 'building', 'floor', 'room', 'term', 'time', 'teacher_id', 'status', 'end_date', 'pre_end_at'],
            'Course' => ['name', 'code', 'description', 'status'],
            'Lesson' => ['course_id', 'name', 'lesson_number', 'description', 'status'],
            'Building' => ['name', 'code', 'description', 'status'],
            'Floor' => ['building_id', 'name', 'floor_number', 'code', 'status'],
            'Room' => ['floor_id', 'name', 'room_type', 'code', 'capacity', 'status'],
            'Attendance' => ['student_id', 'school_class_id', 'attendance_date', 'status', 'note'],
            'GradingTerm' => ['school_class_id', 'name', 'start_date', 'end_date'],
            'TermScore' => ['grading_term_id', 'student_id', 'activity_score', 'exam_score'],
            'TimetableSession' => ['school_class_id', 'day_of_week', 'starts_at', 'ends_at'],
            'StudentRequest' => ['student_id', 'category', 'subject', 'status', 'priority', 'admin_note'],
            'StudentRegistration' => ['first_name', 'last_name', 'gender', 'status', 'review_note', 'student_id', 'reviewed_by', 'reviewed_at'],
            'User' => ['name', 'email', 'role', 'is_active'],
            default => [],
        };

        return collect($model->only($fields))->map(fn ($value) => $value instanceof \DateTimeInterface ? $value->format(DATE_ATOM) : $value)->all();
    }

    private function diff(?array $before, ?array $after): array
    {
        $fields = array_unique(array_merge(array_keys($before ?? []), array_keys($after ?? [])));
        $changes = [];
        foreach ($fields as $field) {
            $old = $before[$field] ?? null;
            $new = $after[$field] ?? null;
            if ($old !== $new) {
                $changes[$field] = ['before' => $old, 'after' => $new];
            }
        }

        return $changes;
    }

    private function moduleFor(string $uri): string
    {
        return match (true) {
            str_contains($uri, 'login') || str_contains($uri, 'logout') => 'auth',
            str_contains($uri, 'dashboard') => 'dashboard',
            str_contains($uri, 'attendance') => 'attendance',
            str_contains($uri, 'student-requests') => 'requests',
            str_contains($uri, 'student-registration') => 'students',
            str_contains($uri, 'timetable') => 'timetable',
            str_contains($uri, 'grades') => 'grades',
            str_contains($uri, 'locations') || str_contains($uri, 'buildings') || str_contains($uri, 'floors') || str_contains($uri, 'rooms') => 'facilities',
            str_contains($uri, 'students') => 'students',
            str_contains($uri, 'teachers') => 'teachers',
            str_contains($uri, 'classes') => 'classes',
            str_contains($uri, 'courses') || str_contains($uri, 'lessons') => 'courses',
            str_contains($uri, 'settings') => 'settings',
            str_contains($uri, 'role-permissions') => 'roles',
            str_contains($uri, 'system-users') || str_contains($uri, 'users') => 'users',
            default => 'system',
        };
    }

    private function actionFor(Request $request, string $method, string $uri): string
    {
        if (str_contains($uri, 'system-users/{user}/status') && $method === 'PATCH') {
            return $request->boolean('is_active') ? 'user.unblocked' : 'user.blocked';
        }
        if (str_contains($uri, '/transfer')) {
            return 'student.transferred';
        }
        if (str_contains($uri, '/attendance/permission-range')) {
            return 'attendance.permission_granted';
        }
        if (str_contains($uri, '/attendance/bulk')) {
            return 'attendance.bulk_marked';
        }
        if (str_contains($uri, '/grades/terms') && $method === 'POST') {
            return 'grade_term.created';
        }
        if (str_contains($uri, '/grades/terms') && $method === 'PUT') {
            return 'student_score.saved';
        }
        if (str_ends_with($uri, '/teacher') && $method === 'PUT') {
            return 'class.teacher_switched';
        }
        if (str_ends_with($uri, '/end') && $method === 'POST') {
            return 'class.end_scheduled';
        }
        if (str_ends_with($uri, '/pre-end') && $method === 'POST') {
            return 'class.pre_ended';
        }
        if (str_ends_with($uri, '/resume') && $method === 'POST') {
            return 'class.resumed';
        }
        if (str_contains($uri, '/students/{student}') && $method === 'POST') {
            return 'student.assigned_to_class';
        }
        if (str_contains($uri, '/students/{student}') && $method === 'DELETE') {
            return 'student.removed_from_class';
        }

        $verb = match ($method) {
            'POST' => 'created',
            'PUT', 'PATCH' => 'updated',
            'DELETE' => 'deleted',
            default => 'changed',
        };

        return $this->moduleFor($uri).'.'.$verb;
    }

    private function failedActionFor(Request $request, string $method, string $uri): string
    {
        if (str_contains($uri, 'system-users/{user}/status') && $method === 'PATCH') {
            return $request->boolean('is_active') ? 'user.unblock_failed' : 'user.block_failed';
        }
        if (str_contains($uri, '/transfer')) {
            return 'student.transfer_failed';
        }
        if (str_contains($uri, '/attendance/permission-range')) {
            return 'attendance.permission_grant_failed';
        }
        if (str_contains($uri, '/attendance/bulk')) {
            return 'attendance.bulk_mark_failed';
        }
        if (str_ends_with($uri, '/teacher') && $method === 'PUT') {
            return 'class.teacher_switch_failed';
        }
        if (str_ends_with($uri, '/end') && $method === 'POST') {
            return 'class.end_schedule_failed';
        }
        if (str_ends_with($uri, '/pre-end') && $method === 'POST') {
            return 'class.pre_end_failed';
        }
        if (str_ends_with($uri, '/resume') && $method === 'POST') {
            return 'class.resume_failed';
        }

        $verb = match ($method) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'change',
        };

        return $this->moduleFor($uri).'.'.$verb.'_failed';
    }

    private function subjectTypeFor(string $uri): ?string
    {
        return match ($this->moduleFor($uri)) {
            'students' => str_contains($uri, 'student-registrations') ? 'StudentRegistration' : 'Student',
            'teachers' => 'Teacher',
            'classes' => 'SchoolClass',
            'attendance' => 'Attendance',
            'courses' => str_contains($uri, 'lessons') ? 'Lesson' : 'Course',
            'facilities' => str_contains($uri, 'buildings') ? 'Building' : (str_contains($uri, 'floors') ? 'Floor' : 'Room'),
            'grades' => str_contains($uri, '/students/') ? 'TermScore' : 'GradingTerm',
            'users' => 'User',
            'requests' => 'StudentRequest',
            'timetable' => 'TimetableSession',
            default => null,
        };
    }
}
