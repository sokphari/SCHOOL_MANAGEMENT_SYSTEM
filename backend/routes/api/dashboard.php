<?php

use App\Http\Controllers\Modules\Dashboard\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin,teacher'])->get('/dashboard', [DashboardController::class, 'index']);
