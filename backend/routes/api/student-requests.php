<?php

use App\Http\Controllers\Modules\StudentRequest\Controllers\StudentRequestController;
use Illuminate\Support\Facades\Route;

Route::post('/public/student-requests', [StudentRequestController::class, 'store'])->middleware('throttle:public-student-requests');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/student-requests/pending-count', [StudentRequestController::class, 'pendingCount']);
    Route::get('/student-requests', [StudentRequestController::class, 'index']);
    Route::get('/student-requests/{studentRequest}', [StudentRequestController::class, 'show']);
    Route::put('/student-requests/{studentRequest}/status', [StudentRequestController::class, 'updateStatus']);
});
