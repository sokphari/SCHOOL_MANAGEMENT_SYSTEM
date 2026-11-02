<?php

use App\Http\Controllers\Modules\Audit\Services\AuditLogService;
use App\Http\Middleware\AuditApiMutations;
use App\Http\Middleware\EnforceSessionLifetime;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->api(append: [AuditApiMutations::class]);
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'session.lifetime' => EnforceSessionLifetime::class,
        ]);
        $middleware->append(SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*') || $request->header('X-Notification-Poll') === 'true') {
                return null;
            }

            $status = match (true) {
                $exception instanceof AuthenticationException => Response::HTTP_UNAUTHORIZED,
                $exception instanceof AuthorizationException => Response::HTTP_FORBIDDEN,
                $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
                default => null,
            };

            if (! in_array($status, [Response::HTTP_UNAUTHORIZED, Response::HTTP_FORBIDDEN, Response::HTTP_TOO_MANY_REQUESTS], true)) {
                return null;
            }

            $action = $status === Response::HTTP_TOO_MANY_REQUESTS
                ? 'security.rate_limited'
                : 'security.access_denied';
            app(AuditLogService::class)->record($request, $action, 'security', statusCode: $status);

            return null;
        });
    })->create();
