<?php

namespace App\Http\Controllers\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Audit\Services\AuditLogService;
use App\Models\RoleFeaturePermission;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request, AuditLogService $auditLogService)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $user = User::where('email', mb_strtolower(trim($credentials['email'])))->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password) || ! in_array($user->role, ['admin', 'teacher'], true) || ! $user->is_active) {
            $auditLogService->record($request, 'auth.login.failed', 'auth', statusCode: 401);

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $now = now()->timestamp;
        $request->session()->put([
            'auth_started_at' => $now,
            'auth_last_activity_at' => $now,
        ]);
        $auditLogService->record($request, 'auth.login.succeeded', 'auth', $user);

        return response()->json([
            'user' => $this->withModulePermissions($user),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($this->withModulePermissions($request->user()));
    }

    public function logout(Request $request, AuditLogService $auditLogService)
    {
        $auditLogService->record($request, 'auth.logout.succeeded', 'auth', $request->user());
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function withModulePermissions(User $user): User
    {
        $permissions = $user->role === 'admin'
            ? []
            : RoleModulePermission::query()
                ->where('role', $user->role)
                ->where('allowed', true)
                ->pluck('module')
                ->all();

        $features = $user->role === 'admin'
            ? []
            : RoleFeaturePermission::query()
                ->where('role', $user->role)
                ->where('allowed', true)
                ->get(['module', 'feature'])
                ->map(fn (RoleFeaturePermission $permission) => $permission->module.'.'.$permission->feature)
                ->all();

        $user->setAttribute('module_permissions', $permissions);
        $user->setAttribute('feature_permissions', $features);

        return $user;
    }
}
