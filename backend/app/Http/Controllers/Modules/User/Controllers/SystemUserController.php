<?php

namespace App\Http\Controllers\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SystemUserController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'in:admin,teacher'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $latestActivity = AuditLog::query()
            ->selectRaw('MAX(created_at)')
            ->whereColumn('actor_id', 'users.id');

        $users = User::query()
            ->whereIn('role', ['admin', 'teacher'])
            ->select(['id', 'name', 'email', 'role', 'is_active'])
            ->selectSub($latestActivity, 'last_activity_at')
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->when($filters['search'] ?? null, function ($query, $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return response()->json($users);
    }

    public function show(User $user)
    {
        return response()->json($this->accountFields($user));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Account updated successfully.',
            'user' => $this->accountFields($user->fresh()),
        ]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $willBeActive = (bool) $data['is_active'];

        if (! $willBeActive && (int) $request->user()->id === (int) $user->id) {
            return response()->json(['message' => 'You cannot block your own account.'], 422);
        }

        if (! $willBeActive && $user->role === 'admin' && $this->activeAdminCountExcept($user) === 0) {
            return response()->json(['message' => 'At least one active admin account must remain.'], 422);
        }

        $user->forceFill(['is_active' => $willBeActive])->save();

        return response()->json([
            'message' => $willBeActive ? 'Account unblocked successfully.' : 'Account blocked successfully.',
            'user' => $this->accountFields($user->fresh()),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->role === 'admin' && $this->activeAdminCountExcept($user) === 0) {
            return response()->json(['message' => 'At least one active admin account must remain.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Account deleted successfully.']);
    }

    private function activeAdminCountExcept(User $user): int
    {
        return User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->where('id', '<>', $user->id)
            ->count();
    }

    private function accountFields(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'is_active']);
    }
}
