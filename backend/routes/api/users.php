<?php

use App\Http\Controllers\Modules\User\Controllers\SystemUserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])
    ->get('/system-users', [SystemUserController::class, 'index']);
