<?php

namespace App\Http\Controllers\Modules\StudentRequest\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public function sendMessage(string $message): bool
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if (! $token || ! $chatId) {
            Log::warning('Telegram config missing.');

            return false;
        }

        $url = "https://api.telegram.org/bot{$token}/sendMessage";

        $response = Http::connectTimeout(3)->timeout(5)->post($url, [
            'chat_id' => $chatId,
            'text' => $message,
        ]);

        if ($response->successful()) {
            return true;
        }

        Log::error('Telegram send failed', [
            'status' => $response->status(),
        ]);

        return false;
    }
}
