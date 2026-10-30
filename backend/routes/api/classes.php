<?php

use App\Http\Controllers\Modules\Class\Controllers\SchoolClassController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::post('/classes/{class}/end', [SchoolClassController::class, 'scheduleEnd']);
    Route::post('/classes/{class}/pre-end', [SchoolClassController::class, 'preEnd']);
    Route::post('/classes/{class}/resume', [SchoolClassController::class, 'resume']);
    Route::apiResource('classes', SchoolClassController::class)->except(['index', 'show']);
    Route::post('/classes/{class}/students/{student}', [SchoolClassController::class, 'assignStudent']);
    Route::post('/classes/{class}/students/{student}/transfer', [SchoolClassController::class, 'transferStudent']);
    Route::put('/classes/{class}/teacher', [SchoolClassController::class, 'switchTeacher']);
    Route::delete('/classes/{class}/students/{student}', [SchoolClassController::class, 'removeStudent']);
});

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->group(function () {
    Route::get('/classes', [SchoolClassController::class, 'index']);
    Route::get('/classes/{class}', [SchoolClassController::class, 'show']);
});
