<?php

namespace App\Http\Controllers\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

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
            ->select(['id', 'name', 'email', 'role'])
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
}
