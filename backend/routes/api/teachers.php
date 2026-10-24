<?php

use App\Http\Controllers\Modules\Teacher\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->apiResource('teachers', TeacherController::class);
