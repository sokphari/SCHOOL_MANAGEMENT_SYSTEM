<?php

use App\Http\Controllers\Modules\Student\Controllers\StudentRegistrationController;
use Illuminate\Support\Facades\Route;

Route::post('/public/student-registrations', [StudentRegistrationController::class, 'store'])
    ->middleware('throttle:public-student-registrations');
Route::get('/public/student-registrations/qr-status', [StudentRegistrationController::class, 'checkQr'])
    ->middleware('throttle:public-student-registration-check');

Route::middleware(['auth:sanctum', 'session.lifetime', 'role:admin'])->group(function () {
    Route::post('/student-registrations/qr-tokens', [StudentRegistrationController::class, 'issueQr']);
    Route::get('/student-registrations', [StudentRegistrationController::class, 'index']);
    Route::post('/student-registrations/{studentRegistration}/approve', [StudentRegistrationController::class, 'approve']);
    Route::post('/student-registrations/{studentRegistration}/reject', [StudentRegistrationController::class, 'reject']);
});
