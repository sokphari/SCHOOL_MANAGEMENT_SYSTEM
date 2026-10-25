<?php

use App\Http\Controllers\Modules\Attendance\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('attendances', AttendanceController::class);
    Route::get('/classes/{class}/attendance/permission-availability', [AttendanceController::class, 'teacherPermissionAvailability']);
    Route::post('/classes/{class}/attendance/permission-range', [AttendanceController::class, 'grantPermissionRange']);
    Route::get('/classes/{class}/attendance/{date}', [AttendanceController::class, 'byClassAndDate']);
    Route::post('/classes/{class}/attendance/bulk', [AttendanceController::class, 'bulkStore']);
});
