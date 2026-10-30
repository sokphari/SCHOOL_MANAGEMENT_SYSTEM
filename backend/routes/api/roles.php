<?php

use App\Http\Controllers\Modules\Role\Controllers\RolePermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::get('/role-permissions/teacher', [RolePermissionController::class, 'showTeacherPermissions']);
    Route::put('/role-permissions/teacher', [RolePermissionController::class, 'updateTeacherPermissions']);
});
