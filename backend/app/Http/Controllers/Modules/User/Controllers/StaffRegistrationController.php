<?php

namespace App\Http\Controllers\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BlockedIp;
use App\Models\StaffAccountRegistration;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaffRegistrationController extends Controller
{
    public function index(Request $request)
    {
        StaffAccountRegistration::query()
            ->where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired', 'review_note' => 'Not approved within 24 hours.', 'updated_at' => now()]);

        $registrations = StaffAccountRegistration::query()
            ->select(['id', 'name', 'email', 'ip_address', 'status', 'expires_at', 'created_at'])
            ->addSelect(['ip_blocked' => BlockedIp::query()
                ->selectRaw('1')
                ->whereColumn('blocked_ips.ip_address', 'staff_account_registrations.ip_address')
                ->limit(1)])
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->latest()
            ->paginate(10);

        return response()->json($registrations);
    }

    public function approve(Request $request, StaffAccountRegistration $registration)
    {
        $user = DB::transaction(function () use ($request, $registration): User {
            $locked = StaffAccountRegistration::query()->lockForUpdate()->findOrFail($registration->id);
            abort_unless($locked->status === 'pending' && $locked->expires_at->isFuture(), 422, 'This registration request has expired or was already reviewed.');
            abort_if(User::query()->where('email', $locked->email)->exists(), 422, 'An account with this email already exists.');

            $user = User::create([
                'name' => $locked->name,
                'email' => $locked->email,
                'password' => $locked->password,
                'role' => 'teacher',
                'is_active' => true,
            ]);

            [$firstName, $lastName] = $this->splitName($locked->name);
            $teacher = Teacher::query()->whereNull('user_id')->where('email', $locked->email)->first();
            if ($teacher) {
                $teacher->update(['user_id' => $user->id]);
            } else {
                Teacher::create([
                    'user_id' => $user->id,
                    'teacher_code' => 'REG-'.Str::upper(Str::random(8)),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $locked->email,
                    'status' => 'active',
                ]);
            }

            $locked->update(['status' => 'approved', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

            return $user;
        });

        return response()->json(['message' => 'Teacher account approved.', 'user' => $user->only(['id', 'name', 'email', 'role', 'is_active'])]);
    }

    public function reject(Request $request, StaffAccountRegistration $registration)
    {
        $data = $request->validate(['review_note' => ['nullable', 'string', 'max:1000']]);
        abort_unless($registration->status === 'pending' && $registration->expires_at->isFuture(), 422, 'This registration request has expired or was already reviewed.');

        $registration->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_note' => $data['review_note'] ?? null,
            'password' => Str::random(64),
        ]);

        return response()->json(['message' => 'Teacher account request rejected.']);
    }

    public function blockIp(Request $request, StaffAccountRegistration $registration)
    {
        abort_unless($registration->ip_address, 422, 'This registration has no recorded IP address.');
        abort_if($registration->ip_address === $request->ip(), 422, 'You cannot block the IP address you are using now because it could lock you out of the admin account.');

        BlockedIp::query()->updateOrCreate(
            ['ip_address' => $registration->ip_address],
            ['blocked_by' => $request->user()->id, 'reason' => 'Blocked from staff registration review.'],
        );

        return response()->json(['message' => 'IP address blocked for future login and account registration attempts.']);
    }

    public function unblockIp(Request $request)
    {
        $data = $request->validate(['ip_address' => ['required', 'ip']]);
        $deleted = BlockedIp::query()->whereKey($data['ip_address'])->delete();

        return response()->json(['message' => $deleted ? 'IP address unblocked.' : 'IP address was not blocked.']);
    }

    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2) ?: [];

        return [$parts[0] ?? 'Teacher', $parts[1] ?? ''];
    }
}
