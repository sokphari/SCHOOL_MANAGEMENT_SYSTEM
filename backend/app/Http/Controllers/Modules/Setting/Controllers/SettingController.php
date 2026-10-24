<?php

namespace App\Http\Controllers\Modules\Setting\Controllers;

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
            'logo_url',
            'banner_url',
        ])->get()->pluck('value', 'key');

        return response()->json([
            'school_name' => $settings['school_name'] ?? '',
            'school_phone' => $settings['school_phone'] ?? '',
            'school_email' => $settings['school_email'] ?? '',
            'school_address' => $settings['school_address'] ?? '',
            'telegram_chat_id' => $settings['telegram_chat_id'] ?? '',
            'logo_url' => $settings['logo_url'] ?? '',
            'banner_url' => $settings['banner_url'] ?? '',
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
            'logo_url' => ['nullable','url',' max:2048'],
            'banner_url' => ['nullable','url',' max:2048'],
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
    public function publicInfo()
    {
        $settings = Setting::whereIn('key', [
            'school_name',
            'school_phone',
            'school_email',
            'school_address',
            'logo_url',
            'banner_url',
        ])->get()->pluck('value', 'key');

        return response()->json([
            'school_name' => $settings['school_name'] ?? 'ETEC-CENTER',
            'school_phone' => $settings['school_phone'] ?? '',
            'school_email' => $settings['school_email'] ?? '',
            'school_address' => $settings['school_address'] ?? '',
            'logo_url' => $settings['logo_url'] ?? '',
            'banner_url' => $settings['banner_url'] ?? '',
        ]);
    }
}
