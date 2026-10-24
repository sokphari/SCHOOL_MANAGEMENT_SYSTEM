<?php

use App\Http\Controllers\Modules\Attendance\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('attendances', AttendanceController::class);
    Route::get('/classes/{class}/attendance/{date}', [AttendanceController::class, 'byClassAndDate']);
    Route::post('/classes/{class}/attendance/bulk', [AttendanceController::class, 'bulkStore']);
});
