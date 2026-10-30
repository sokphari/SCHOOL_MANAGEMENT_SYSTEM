<?php

use App\Http\Controllers\Modules\Location\Controllers\LocationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->prefix('locations')->group(function () {
    Route::get('/buildings', [LocationController::class, 'buildings']);
    Route::post('/buildings', [LocationController::class, 'storeBuilding']);
    Route::put('/buildings/{building}', [LocationController::class, 'updateBuilding']);
    Route::delete('/buildings/{building}', [LocationController::class, 'destroyBuilding']);

    Route::get('/floors', [LocationController::class, 'floors']);
    Route::post('/floors', [LocationController::class, 'storeFloor']);
    Route::put('/floors/{floor}', [LocationController::class, 'updateFloor']);
    Route::delete('/floors/{floor}', [LocationController::class, 'destroyFloor']);

    Route::get('/rooms', [LocationController::class, 'rooms']);
    Route::post('/rooms', [LocationController::class, 'storeRoom']);
    Route::put('/rooms/{room}', [LocationController::class, 'updateRoom']);
    Route::delete('/rooms/{room}', [LocationController::class, 'destroyRoom']);
});
