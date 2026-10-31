<?php

use App\Http\Controllers\Modules\User\Controllers\SystemUserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])
    ->group(function (): void {
        Route::get('/system-users', [SystemUserController::class, 'index']);
        Route::get('/system-users/{user}', [SystemUserController::class, 'show']);
        Route::put('/system-users/{user}', [SystemUserController::class, 'update']);
        Route::patch('/system-users/{user}/status', [SystemUserController::class, 'updateStatus']);
        Route::delete('/system-users/{user}', [SystemUserController::class, 'destroy']);
    });
