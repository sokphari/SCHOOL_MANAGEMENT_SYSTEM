<?php

namespace App\Http\Controllers\Modules\Audit\Services;

use App\Models\AuditLog;
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

    public function recordMutation(Request $request, Response $response): void
    {
        $route = $request->route();
        $uri = $route?->uri() ?? $request->path();
        $method = $request->method();
        $status = $response->getStatusCode();
        $module = $this->moduleFor($uri);

        if ($status >= 400) {
            $action = $status === Response::HTTP_TOO_MANY_REQUESTS
                ? 'security.rate_limited'
                : 'security.access_denied';
            $this->record($request, $action, 'security', statusCode: $status);

            return;
        }

        $subject = collect($route?->parameters() ?? [])
            ->filter(fn ($value) => $value instanceof Model)
            ->last();

        $responseData = method_exists($response, 'getData') ? $response->getData(true) : [];
        $responseId = data_get($responseData, 'data.id');
        $subjectId = $subject?->getKey() ?? (is_numeric($responseId) ? (int) $responseId : null);
        $subjectType = $subject ? class_basename($subject) : $this->subjectTypeFor($uri);
        $this->persist(
            $request,
            $this->actionFor($method, $uri),
            $module,
            $subjectType,
            $subjectId,
            $status,
        );
    }

    private function moduleFor(string $uri): string
    {
        return match (true) {
            str_contains($uri, 'login') || str_contains($uri, 'logout') => 'auth',
            str_contains($uri, 'attendance') => 'attendance',
            str_contains($uri, 'student-requests') => 'requests',
            str_contains($uri, 'timetable') => 'timetable',
            str_contains($uri, 'grades') => 'grades',
            str_contains($uri, 'locations') => 'facilities',
            str_contains($uri, 'students') => 'students',
            str_contains($uri, 'teachers') => 'teachers',
            str_contains($uri, 'classes') => 'classes',
            str_contains($uri, 'courses') || str_contains($uri, 'lessons') => 'courses',
            str_contains($uri, 'settings') => 'settings',
            str_contains($uri, 'role-permissions') => 'roles',
            str_contains($uri, 'system-users') => 'users',
            default => 'system',
        };
    }

    private function actionFor(string $method, string $uri): string
    {
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

    private function subjectTypeFor(string $uri): ?string
    {
        return match ($this->moduleFor($uri)) {
            'students' => 'Student',
            'teachers' => 'Teacher',
            'classes' => 'SchoolClass',
            'attendance' => 'Attendance',
            'courses' => str_contains($uri, 'lessons') ? 'Lesson' : 'Course',
            'facilities' => str_contains($uri, 'buildings') ? 'Building' : (str_contains($uri, 'floors') ? 'Floor' : 'Room'),
            'grades' => str_contains($uri, '/students/') ? 'TermScore' : 'GradingTerm',
            'requests' => 'StudentRequest',
            'timetable' => 'TimetableSession',
            default => null,
        };
    }
}
