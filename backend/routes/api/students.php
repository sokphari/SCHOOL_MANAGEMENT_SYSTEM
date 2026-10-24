<?php

use App\Http\Controllers\Modules\Student\Controllers\StudentController;
use App\Http\Controllers\Modules\Student\Controllers\StudentPublicController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->apiResource('students', StudentController::class);
Route::get('/public/students/by-code/{student_code}', [StudentPublicController::class, 'findByCode']);
