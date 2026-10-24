<?php

use App\Http\Controllers\Api\TeacherController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->apiResource('teachers', TeacherController::class);
