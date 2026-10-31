<?php

namespace App\Http\Controllers\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Audit\Services\AuditLogService;
use App\Models\RoleFeaturePermission;
use App\Models\RoleModulePermission;
use App\Models\StaffAccountRegistration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'max:255'],
        ]);

        $email = mb_strtolower(trim($data['email']));
        abort_if(User::query()->where('email', $email)->exists(), 422, 'An account with this email already exists.');

        StaffAccountRegistration::query()
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired', 'updated_at' => now()]);

        abort_if(
            StaffAccountRegistration::query()->where('email', $email)->where('status', 'pending')->exists(),
            422,
            'A registration request for this email is already waiting for administrator review.',
        );

        StaffAccountRegistration::create([
            'name' => trim($data['name']),
            'email' => $email,
            'password' => Hash::make($data['password']),
            'ip_address' => $request->ip(),
            'status' => 'pending',
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'message' => 'Your teacher account request was sent to the school administrator. It expires in 24 hours if not reviewed.',
        ], 202);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        Password::sendResetLink(['email' => mb_strtolower(trim($data['email']))]);

        // Do not reveal whether an email address belongs to an account.
        return response()->json([
            'message' => 'If an active account exists for that email, password reset instructions have been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'max:255'],
        ]);

        $status = Password::reset(
            [...$data, 'email' => mb_strtolower(trim($data['email']))],
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'This password reset link is invalid or expired. Request a new one.'], 422);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }

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
