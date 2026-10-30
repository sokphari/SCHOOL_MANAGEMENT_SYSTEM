<?php

use App\Http\Controllers\Modules\Setting\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/public/settings', [SettingController::class, 'publicInfo']);

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
});
