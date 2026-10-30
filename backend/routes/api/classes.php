<?php

use App\Http\Controllers\Modules\Class\Controllers\SchoolClassController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::apiResource('classes', SchoolClassController::class)->except(['index', 'show', 'store', 'update']);
    Route::post('/classes/{class}/students/{student}/transfer', [SchoolClassController::class, 'transferStudent']);
    Route::delete('/classes/{class}/students/{student}', [SchoolClassController::class, 'removeStudent']);
});

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->group(function () {
    Route::post('/classes', [SchoolClassController::class, 'store']);
    Route::put('/classes/{class}', [SchoolClassController::class, 'update']);
    Route::patch('/classes/{class}', [SchoolClassController::class, 'update']);
    Route::post('/classes/{class}/end', [SchoolClassController::class, 'scheduleEnd']);
    Route::post('/classes/{class}/pre-end', [SchoolClassController::class, 'preEnd']);
    Route::post('/classes/{class}/resume', [SchoolClassController::class, 'resume']);
    Route::get('/classes/{class}/available-students', [SchoolClassController::class, 'availableStudents']);
    Route::post('/classes/{class}/students/{student}', [SchoolClassController::class, 'assignStudent']);
    Route::put('/classes/{class}/teacher', [SchoolClassController::class, 'switchTeacher']);
    Route::get('/classes', [SchoolClassController::class, 'index']);
    Route::get('/classes/{class}', [SchoolClassController::class, 'show']);
});
