<?php

namespace App\Http\Controllers\Modules\StudentRequest\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\StudentRequest\Services\TelegramService;
use App\Models\Student;
use App\Models\StudentRequest;
use Illuminate\Http\Request;

class StudentRequestController extends Controller
{
    public function pendingCount()
    {
        $user = auth()->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $count = StudentRequest::where('status', 'pending')->count();

        return response()->json([
            'pending_count' => $count,
        ]);
    }

    public function store(Request $request, TelegramService $telegramService)
    {
        $data = $request->validate([
            'student_code' => ['required', 'string', 'max:50'],
            'category' => ['required', 'in:teacher_feedback,room_issue,facility_issue,class_request,general_request'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:3000'],
            'priority' => ['nullable', 'in:low,medium,high'],
        ]);

        $student = Student::where('student_code', $data['student_code'])->first();

        if (! $student) {
            return response()->json([
                'message' => 'Student not found',
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

        $message = "📩 *New Student Request*\n\n"
            .'🕒 '.now()->format('Y-m-d H:i')."\n\n"
            ."👤 *Student:* {$student->first_name} {$student->last_name}\n"
            ."🆔 *Code:* {$student->student_code}\n"
            ."📂 *Category:* {$studentRequest->category}\n"
            ."⚡ *Priority:* {$studentRequest->priority}\n\n"
            ."📝 *Subject:*\n{$studentRequest->subject}\n\n"
            ."📌 *Description:*\n{$studentRequest->description}";

        $telegramService->sendMessage($message);

        return response()->json([
            'message' => 'Request submitted successfully',
            'data' => $studentRequest,
        ], 201);
    }

    public function index(Request $request)
    {
        $user = auth()->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $query = StudentRequest::with('student');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('student_code_snapshot', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json(
            $query->latest()->paginate(10)
        );
    }

    public function show(StudentRequest $studentRequest)
    {
        $user = auth()->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json(
            $studentRequest->load('student')
        );
    }

    public function updateStatus(Request $request, StudentRequest $studentRequest)
    {
        $user = auth()->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'in:pending,in_progress,resolved,rejected'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $studentRequest->update([
            'status' => $data['status'],
            'admin_note' => $data['admin_note'] ?? $studentRequest->admin_note,
        ]);

        return response()->json([
            'message' => 'Request updated successfully',
            'data' => $studentRequest,
        ]);
    }
}
