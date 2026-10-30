<?php

namespace App\Http\Middleware;

use App\Models\RoleFeaturePermission;
use App\Models\RoleModulePermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_unless($user && in_array($user->role, $roles, true), 403, 'You are not authorized to access this resource.');

        if ($user->role === 'teacher' && in_array('teacher', $roles, true)) {
            if (in_array($request->path(), ['api/me', 'api/logout'], true)) {
                return $next($request);
            }

            $module = $this->moduleFor($request);
            abort_unless(
                $module !== null && RoleModulePermission::query()
                    ->where('role', 'teacher')
                    ->where('module', $module)
                    ->where('allowed', true)
                    ->exists(),
                403,
                'Your role does not have access to this module.',
            );

            $feature = $this->featureFor($request, $module);
            abort_unless(
                $feature !== null && RoleFeaturePermission::query()
                    ->where('role', 'teacher')
                    ->where('module', $module)
                    ->where('feature', $feature)
                    ->where('allowed', true)
                    ->exists(),
                403,
                'Your role does not have access to this feature.',
            );

            foreach (config('role_permissions.feature_dependencies')[$module.'.'.$feature] ?? [] as $dependency) {
                [$dependencyModule, $dependencyFeature] = explode('.', $dependency, 2);
                abort_unless(
                    RoleFeaturePermission::query()
                        ->where('role', 'teacher')
                        ->where('module', $dependencyModule)
                        ->where('feature', $dependencyFeature)
                        ->where('allowed', true)
                        ->exists(),
                    403,
                    'This feature requires access to its related view feature.',
                );
            }
        }

        return $next($request);
    }

    private function moduleFor(Request $request): ?string
    {
        $uri = $request->route()?->uri() ?? $request->path();

        return match (true) {
            str_contains($uri, 'dashboard') => 'dashboard',
            str_contains($uri, 'attendance') => 'attendance',
            str_contains($uri, 'grades') => 'grades',
            str_contains($uri, 'timetable') => 'timetable',
            str_contains($uri, 'courses') => 'classes',
            str_contains($uri, 'locations/buildings') => 'classes',
            str_contains($uri, 'classes') => 'classes',
            str_contains($uri, 'students') => 'students',
            str_contains($uri, 'login'), str_contains($uri, 'logout'), str_contains($uri, 'api/me') => null,
            default => null,
        };
    }

    private function featureFor(Request $request, string $module): ?string
    {
        $uri = $request->route()?->uri() ?? $request->path();
        $method = $request->method();

        return match ($module) {
            'dashboard' => 'view',
            'attendance' => $method === 'GET' ? 'view' : 'record',
            'students' => match (true) {
                str_contains($uri, 'students/{student}/attendances') => 'view_attendance',
                preg_match('#students/\{student\}$#', $uri) === 1 => 'view_details',
                default => 'view_list',
            },
            'classes' => match (true) {
                $method === 'POST' && preg_match('#classes$#', $uri) === 1 => 'create',
                str_contains($uri, 'classes/{class}/students/{student}/transfer') => 'view_details',
                str_contains($uri, 'classes/{class}/available-students') => 'add_students',
                str_contains($uri, 'classes/{class}/students/{student}') && $method === 'POST' => 'add_students',
                str_contains($uri, 'classes/{class}/teacher') => 'switch_teacher',
                str_contains($uri, 'classes/{class}/end') => 'schedule_end',
                str_contains($uri, 'classes/{class}/pre-end') => 'pre_end',
                str_contains($uri, 'classes/{class}/resume') => 'resume',
                str_contains($uri, 'classes/{class}') && in_array($method, ['PUT', 'PATCH'], true) => 'edit',
                str_contains($uri, 'courses'), str_contains($uri, 'locations/buildings') => 'view_list',
                str_contains($uri, 'classes/{class}') => 'view_details',
                default => 'view_list',
            },
            'timetable' => $method === 'GET' ? 'view' : 'manage',
            'grades' => match (true) {
                $method === 'POST' && str_contains($uri, 'grades/terms') => 'create_terms',
                $method === 'PUT' => 'enter_scores',
                default => 'view_terms',
            },
            default => null,
        };
    }
}
