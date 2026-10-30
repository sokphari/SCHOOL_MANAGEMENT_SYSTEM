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

        $response = $next($request);
        $status = $response->getStatusCode();
        $isLoginCredentialFailure = $request->path() === 'api/login' && $status === 401;
        $isRejectedOrLimited = in_array($status, [401, 403, 429], true) && ! $isLoginCredentialFailure;
        $isSuccessfulMutation = $response->isSuccessful()
            && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)
            && ! in_array($request->path(), ['api/login', 'api/logout'], true);

        if ($isSuccessfulMutation || $isRejectedOrLimited) {
            try {
                $this->auditLogService->recordMutation($request, $response);
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

        return true;
    }
}
