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

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized',
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
            'carousel_images',
        ])->get()->pluck('value', 'key');

        return response()->json([
            'school_name' => $settings['school_name'] ?? '',
            'school_phone' => $settings['school_phone'] ?? '',
            'school_email' => $settings['school_email'] ?? '',
            'school_address' => $settings['school_address'] ?? '',
            'telegram_chat_id' => $settings['telegram_chat_id'] ?? '',
            'logo_url' => $settings['logo_url'] ?? '',
            'banner_url' => $settings['banner_url'] ?? '',
            'carousel_images' => $settings['carousel_images'] ?? '',
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $data = $request->validate([
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_phone' => ['nullable', 'string', 'max:50'],
            'school_email' => ['nullable', 'email', 'max:255'],
            'school_address' => ['nullable', 'string', 'max:1000'],
            'telegram_chat_id' => ['nullable', 'string', 'max:100'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'banner_url' => ['nullable', 'url', 'max:2048'],
            'carousel_images' => ['nullable', 'string', 'max:20000'],
        ]);

        if (! empty($data['carousel_images'])) {
            $imageUrls = preg_split('/\r\n|\r|\n/', $data['carousel_images']) ?: [];
            $imageUrls = array_values(array_filter(array_map('trim', $imageUrls), static fn ($url) => $url !== ''));
            if (count($imageUrls) !== 6) {
                return response()->json([
                    'message' => 'Add exactly 6 carousel images.',
                    'errors' => ['carousel_images' => ['Enter exactly 6 image URLs or site-relative image paths, one per line.']],
                ], 422);
            }
            foreach ($imageUrls as $imageUrl) {
                $isPublicUrl = filter_var($imageUrl, FILTER_VALIDATE_URL) !== false
                    && in_array(parse_url($imageUrl, PHP_URL_SCHEME), ['http', 'https'], true);
                $isLocalPublicAsset = str_starts_with($imageUrl, '/')
                    && ! str_starts_with($imageUrl, '//')
                    && ! str_contains($imageUrl, '..');

                if (! $isPublicUrl && ! $isLocalPublicAsset) {
                    return response()->json([
                        'message' => 'Each carousel image must be a public HTTP/HTTPS URL or a safe site-relative path.',
                        'errors' => ['carousel_images' => ['Enter one image URL or site-relative image path per line.']],
                    ], 422);
                }
            }
            $data['carousel_images'] = implode("\n", array_map('trim', $imageUrls));
        }

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'message' => 'Settings updated successfully',
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
            'carousel_images',
        ])->get()->pluck('value', 'key');

        $carouselImages = preg_split('/\r\n|\r|\n/', $settings['carousel_images'] ?? '') ?: [];

        return response()->json([
            'school_name' => $settings['school_name'] ?? 'ETEC-CENTER',
            'school_phone' => $settings['school_phone'] ?? '',
            'school_email' => $settings['school_email'] ?? '',
            'school_address' => $settings['school_address'] ?? '',
            'logo_url' => $settings['logo_url'] ?? '',
            'banner_url' => $settings['banner_url'] ?? '',
            'carousel_images' => array_values(array_filter(array_map('trim', $carouselImages))),
        ]);
    }
}
