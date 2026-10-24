<?php

use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/public/settings', [SettingController::class, 'publicInfo']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
});
