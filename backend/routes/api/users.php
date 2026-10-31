<?php

use App\Http\Controllers\Modules\User\Controllers\SystemUserController;
use App\Http\Controllers\Modules\User\Controllers\StaffRegistrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])
    ->group(function (): void {
        Route::get('/system-users', [SystemUserController::class, 'index']);
        Route::get('/system-users/{user}', [SystemUserController::class, 'show']);
        Route::put('/system-users/{user}', [SystemUserController::class, 'update']);
        Route::patch('/system-users/{user}/status', [SystemUserController::class, 'updateStatus']);
        Route::delete('/system-users/{user}', [SystemUserController::class, 'destroy']);
        Route::get('/staff-registrations', [StaffRegistrationController::class, 'index']);
        Route::post('/staff-registrations/{registration}/approve', [StaffRegistrationController::class, 'approve']);
        Route::post('/staff-registrations/{registration}/reject', [StaffRegistrationController::class, 'reject']);
        Route::post('/staff-registrations/{registration}/block-ip', [StaffRegistrationController::class, 'blockIp']);
        Route::delete('/staff-registrations/blocked-ip', [StaffRegistrationController::class, 'unblockIp']);
    });
