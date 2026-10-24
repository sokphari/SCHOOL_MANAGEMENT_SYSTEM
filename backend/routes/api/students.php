<?php

use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentPublicController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->apiResource('students', StudentController::class);
Route::get('/public/students/by-code/{student_code}', [StudentPublicController::class, 'findByCode']);
