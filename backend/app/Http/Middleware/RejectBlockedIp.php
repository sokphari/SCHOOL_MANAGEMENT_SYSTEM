<?php

namespace App\Http\Middleware;

use App\Models\BlockedIp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectBlockedIp
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->ip() && BlockedIp::query()->whereKey($request->ip())->exists()) {
            return response()->json(['message' => 'Access from this IP address is blocked. Contact the school administrator.'], 403);
        }

        return $next($request);
    }
}
