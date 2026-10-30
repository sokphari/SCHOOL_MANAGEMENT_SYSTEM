<?php

use App\Http\Controllers\Modules\Audit\Controllers\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])
    ->get('/audit-logs', [AuditLogController::class, 'index']);
