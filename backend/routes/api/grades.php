<?php

use App\Http\Controllers\Modules\Grade\Controllers\GradeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->group(function () {
    Route::get('/classes/{class}/grades/terms', [GradeController::class, 'terms']);
    Route::get('/grades/terms/{term}', [GradeController::class, 'showTerm']);
    Route::put('/grades/terms/{term}/students/{student}', [GradeController::class, 'saveStudentScore']);
});

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])
    ->post('/classes/{class}/grades/terms', [GradeController::class, 'createTerm']);
