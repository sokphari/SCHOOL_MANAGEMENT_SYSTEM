<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentRequest;
// use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public function sendMessage(string $message): bool
    {
        $token = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_CHAT_ID');

        if (!$token || !$chatId) {
            Log::warning('Telegram config missing.');
            return false;
        }

        $url = "https://api.telegram.org/bot{$token}/sendMessage";

        $response = Http::post($url, [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            return true;
        }

        Log::error('Telegram send failed', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return false;
    }
    public function store(Request $request, TelegramService $telegramService)
    {
        $data = $request->validate([
            'student_code' => ['required', 'string', 'max:50'],
            'category' => ['required', 'in:teacher_feedback,room_issue,facility_issue,class_request,general_request'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['nullable', 'in:low,medium,high'],
        ]);

        $student = Student::where('student_code', $data['student_code'])->first();

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }

        $studentRequest = StudentRequest::create([
            'student_id' => $student->id,
            'student_code_snapshot' => $student->student_code,
            'category' => $data['category'],
            'subject' => $data['subject'],
            'description' => $data['description'],
            'priority' => $data['priority'] ?? 'medium',
            'status' => 'pending',
        ]);

        $message = "📩 New Student Request\n"
            . "Student: {$student->first_name} {$student->last_name}\n"
            . "Code: {$student->student_code}\n"
            . "Category: {$studentRequest->category}\n"
            . "Priority: {$studentRequest->priority}\n"
            . "Subject: {$studentRequest->subject}\n"
            . "Description: {$studentRequest->description}";

        $telegramService->sendMessage($message);

        return response()->json([
            'message' => 'Request submitted successfully',
            'data' => $studentRequest,
        ], 201);
    }
}
