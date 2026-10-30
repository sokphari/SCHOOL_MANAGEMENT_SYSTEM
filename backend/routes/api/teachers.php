<?php

use App\Http\Controllers\Modules\Teacher\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->apiResource('teachers', TeacherController::class);
