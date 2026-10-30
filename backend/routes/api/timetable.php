<?php

use App\Http\Controllers\Modules\Timetable\Controllers\TimetableController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/timetable/classes', [TimetableController::class, 'classOptions']);
    Route::get('/timetable', [TimetableController::class, 'index']);
    Route::post('/timetable', [TimetableController::class, 'store']);
    Route::put('/timetable/{timetableSession}', [TimetableController::class, 'update']);
    Route::delete('/timetable/{timetableSession}', [TimetableController::class, 'destroy']);
});
