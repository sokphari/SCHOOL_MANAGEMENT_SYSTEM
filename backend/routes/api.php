<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentPublicController;
use App\Http\Controllers\Api\StudentRequestController;
use App\Http\Controllers\Api\TeacherController;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Route;

//route public 
Route::get('/public/settings',[SettingController::class,'publicInfo']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');;

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    Route::get('/student-requests/pending-count', [StudentRequestController::class, 'pendingCount']);
    Route::get('/student-requests', [StudentRequestController::class, 'index']);
    Route::get('/student-requests/{studentRequest}', [StudentRequestController::class, 'show']);
    Route::put('/student-requests/{studentRequest}/status', [StudentRequestController::class, 'updateStatus']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('students', StudentController::class);
    Route::apiResource('teachers', TeacherController::class);
    Route::apiResource('classes', SchoolClassController::class);
    Route::apiResource('attendances', AttendanceController::class);

    Route::post('/classes/{class}/students/{student}', [SchoolClassController::class, 'assignStudent']);
    Route::delete('/classes/{class}/students/{student}', [SchoolClassController::class, 'removeStudent']);
    // Route::get('/classes/{class}/attendance-by-date/{date}', [AttendanceController::class, 'byClassAndDate']);

    Route::post('/attendances', [AttendanceController::class, 'store']);
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::get('/classes/{class}/attendance/{date}', [AttendanceController::class, 'byClassAndDate']);
    Route::post('/classes/{class}/attendance/bulk', [AttendanceController::class, 'bulkStore']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
Route::get('/public/students/by-code/{student_code}', [StudentPublicController::class, 'findByCode']);
Route::post('/public/student-requests', [StudentRequestController::class, 'store'])->middleware('throttle:login');;
Route::get('/test-telegram', function (TelegramService $telegramService) {
    $ok = $telegramService->sendMessage('✅ Telegram test from Laravel');

    return response()->json([
        'success' => $ok,
    ]);
});
