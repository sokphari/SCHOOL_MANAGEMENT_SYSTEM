<?php

use App\Services\TelegramService;
use Illuminate\Support\Facades\Route;

Route::get('/test-telegram', function (TelegramService $telegramService) {
    $ok = $telegramService->sendMessage('✅ Telegram test from Laravel');

    return response()->json([
        'success' => $ok,
    ]);
});
