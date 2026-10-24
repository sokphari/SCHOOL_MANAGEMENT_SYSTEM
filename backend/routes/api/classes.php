<?php

use App\Http\Controllers\Modules\Class\Controllers\SchoolClassController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('classes', SchoolClassController::class);
    Route::post('/classes/{class}/students/{student}', [SchoolClassController::class, 'assignStudent']);
    Route::delete('/classes/{class}/students/{student}', [SchoolClassController::class, 'removeStudent']);
});
