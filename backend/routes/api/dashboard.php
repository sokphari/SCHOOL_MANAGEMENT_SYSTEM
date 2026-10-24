<?php

use App\Http\Controllers\Modules\Dashboard\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/dashboard', [DashboardController::class, 'index']);
