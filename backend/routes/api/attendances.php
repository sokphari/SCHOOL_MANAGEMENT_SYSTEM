<?php

use App\Http\Controllers\Modules\Attendance\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->group(function () {
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::post('/attendances', [AttendanceController::class, 'store']);
    Route::get('/attendances/{attendance}', [AttendanceController::class, 'show']);
    Route::get('/classes/{class}/attendance/permission-availability', [AttendanceController::class, 'teacherPermissionAvailability']);
    Route::get('/classes/{class}/attendance/{date}', [AttendanceController::class, 'byClassAndDate']);
    Route::post('/classes/{class}/attendance/bulk', [AttendanceController::class, 'bulkStore']);
});

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::delete('/attendances/{attendance}', [AttendanceController::class, 'destroy']);
    Route::post('/classes/{class}/attendance/permission-range', [AttendanceController::class, 'grantPermissionRange']);
});
