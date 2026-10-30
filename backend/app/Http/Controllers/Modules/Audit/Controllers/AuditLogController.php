<?php

namespace App\Http\Controllers\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'module' => ['nullable', 'string', 'max:60'],
            'action' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'actor_id' => ['nullable', 'integer', 'exists:users,id'],
            'role' => ['nullable', 'in:admin,teacher'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = AuditLog::query()
            ->with('actor:id,name,role')
            ->when($filters['module'] ?? null, fn ($builder, $module) => $builder->where('module', $module))
            ->when($filters['action'] ?? null, fn ($builder, $action) => $builder->where('action', $action))
            ->when($filters['actor_id'] ?? null, fn ($builder, $actorId) => $builder->where('actor_id', $actorId))
            ->when($filters['role'] ?? null, fn ($builder, $role) => $builder->whereHas('actor', fn ($actor) => $actor->where('role', $role)))
            ->when($filters['date_from'] ?? null, fn ($builder, $date) => $builder->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($builder, $date) => $builder->whereDate('created_at', '<=', $date))
            ->when($filters['search'] ?? null, function ($builder, $search) {
                $builder->where(function ($nested) use ($search) {
                    $nested->where('action', 'like', '%'.$search.'%')
                        ->orWhere('module', 'like', '%'.$search.'%')
                        ->orWhere('route', 'like', '%'.$search.'%')
                        ->orWhere('ip_address', 'like', '%'.$search.'%')
                        ->orWhereHas('actor', fn ($actor) => $actor->where('name', 'like', '%'.$search.'%'));
                });
            })
            ->latest('created_at');

        return response()->json($query->paginate(15)->withQueryString());
    }
}
