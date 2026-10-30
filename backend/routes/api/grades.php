<?php

use App\Http\Controllers\Modules\Grade\Controllers\GradeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/classes/{class}/grades/terms', [GradeController::class, 'terms']);
    Route::post('/classes/{class}/grades/terms', [GradeController::class, 'createTerm']);
    Route::get('/grades/terms/{term}', [GradeController::class, 'showTerm']);
    Route::put('/grades/terms/{term}/students/{student}', [GradeController::class, 'saveStudentScore']);
});
