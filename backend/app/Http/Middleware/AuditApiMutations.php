<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Modules\Audit\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuditApiMutations
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->isAuditableApiRequest($request)) {
            return $next($request);
        }

        $isMutation = in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
        $before = null;
        if ($isMutation) {
            try {
                $before = $this->auditLogService->captureBefore($request);
            } catch (Throwable $exception) {
                Log::error('Audit before snapshot failed.', [
                    'exception' => $exception::class,
                    'route' => $request->route()?->uri(),
                ]);
            }
        }
        $response = $next($request);
        $status = $response->getStatusCode();
        $isLoginCredentialFailure = $request->path() === 'api/login' && $status === 401;
        $isRejectedOrLimited = in_array($status, [401, 403, 429], true) && ! $isLoginCredentialFailure;
        $isFailedAuthenticatedMutation = $status >= 400
            && ! in_array($status, [401, 403, 429], true)
            && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)
            && in_array($request->user()?->role, ['admin', 'teacher'], true);
        $isSuccessfulMutation = $response->isSuccessful()
            && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)
            && ! in_array($request->path(), ['api/login', 'api/logout'], true);

        if ($isSuccessfulMutation || $isRejectedOrLimited || $isFailedAuthenticatedMutation) {
            try {
                $this->auditLogService->recordMutation($request, $response, $before);
            } catch (Throwable $exception) {
                Log::error('Audit log write failed.', [
                    'exception' => $exception::class,
                    'route' => $request->route()?->uri(),
                ]);
            }
        }

        return $response;
    }

    private function isAuditableApiRequest(Request $request): bool
    {
        if (! $request->is('api/*')) {
            return false;
        }

        if ($request->header('X-Notification-Poll') === 'true') {
            return false;
        }

        return true;
    }
}
