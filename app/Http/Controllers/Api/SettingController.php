<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $settings = Setting::whereIn('key', [
            'school_name',
            'school_phone',
            'school_email',
            'school_address',
            'telegram_chat_id',
        ])->get()->pluck('value', 'key');

        return response()->json([
            'school_name' => $settings['school_name'] ?? '',
            'school_phone' => $settings['school_phone'] ?? '',
            'school_email' => $settings['school_email'] ?? '',
            'school_address' => $settings['school_address'] ?? '',
            'telegram_chat_id' => $settings['telegram_chat_id'] ?? '',
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $data = $request->validate([
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_phone' => ['nullable', 'string', 'max:50'],
            'school_email' => ['nullable', 'email', 'max:255'],
            'school_address' => ['nullable', 'string'],
            'telegram_chat_id' => ['nullable', 'string', 'max:100'],
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'message' => 'Settings updated successfully'
        ]);
    }
}