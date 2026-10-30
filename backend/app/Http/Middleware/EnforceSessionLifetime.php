<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnforceSessionLifetime
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->currentAccessToken() instanceof PersonalAccessToken) {
            return response()->json(['message' => 'Bearer tokens are not accepted for this browser application.'], 401);
        }

        $session = $request->session();
        $now = now()->timestamp;
        $startedAt = (int) $session->get('auth_started_at', $now);
        $lastActivityAt = (int) $session->get('auth_last_activity_at', $now);
        $idleLimit = (int) config('session.lifetime', 120) * 60;
        $absoluteLimit = (int) config('session.absolute_lifetime', 480) * 60;

        if (($now - $lastActivityAt) >= $idleLimit || ($now - $startedAt) >= $absoluteLimit) {
            Auth::guard('web')->logout();
            $session->invalidate();
            $session->regenerateToken();

            return response()->json(['message' => 'Your session has expired. Please sign in again.'], 401);
        }

        $session->put('auth_last_activity_at', $now);

        return $next($request);
    }
}
