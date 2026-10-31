<?php

use App\Http\Controllers\Modules\User\Controllers\AuthController;
use App\Http\Middleware\RejectBlockedIp;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware(['throttle:login', RejectBlockedIp::class]);
Route::post('/register', [AuthController::class, 'register'])->middleware(['throttle:public-account-registration', RejectBlockedIp::class]);
Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
