<?php

use App\Http\Controllers\Modules\Student\Controllers\StudentController;
use App\Http\Controllers\Modules\Student\Controllers\StudentPublicController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::apiResource('students', StudentController::class)->except(['index', 'show']);
});
Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->group(function () {
    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/{student}', [StudentController::class, 'show']);
    Route::get('/students/{student}/attendances', [StudentController::class, 'attendanceHistory']);
});
Route::get('/public/students/by-code/{student_code}', [StudentPublicController::class, 'findByCode'])
    ->middleware('throttle:public-student-lookup');
