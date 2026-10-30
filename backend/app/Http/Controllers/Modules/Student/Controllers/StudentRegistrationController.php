<?php

namespace App\Http\Controllers\Modules\Student\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\StudentRegistrationToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StudentRegistrationController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'registration_token' => ['required', 'string', 'size:64'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'guardian_name' => ['nullable', 'string', 'max:150'],
            'guardian_phone' => ['nullable', 'string', 'max:30'],
        ]);

        $result = DB::transaction(function () use ($data) {
            $token = StudentRegistrationToken::query()
                ->where('token_hash', hash('sha256', $data['registration_token']))
                ->lockForUpdate()
                ->first();

            abort_unless($token && ! $token->used_at && $token->expires_at->isFuture(), 422, 'This registration QR is invalid, expired, or already used. Please ask the school admin for a new QR code.');

            unset($data['registration_token']);
            $registration = StudentRegistration::create($data);
            $token->update(['used_at' => now(), 'registration_id' => $registration->id]);

            return $registration;
        });

        return response()->json([
            'message' => 'Registration submitted. The school will review your application.',
            'data' => ['id' => $result->id, 'status' => $result->status],
        ], 201);
    }

    public function issueQr(Request $request)
    {
        $plainToken = Str::random(64);
        $token = StudentRegistrationToken::create([
            'token_hash' => hash('sha256', $plainToken),
            'issued_by' => $request->user()->id,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'message' => 'A single-use registration QR was issued. It expires in 24 hours.',
            'data' => ['token' => $plainToken, 'expires_at' => $token->expires_at],
        ], 201);
    }

    public function checkQr(Request $request)
    {
        $data = $request->validate(['token' => ['required', 'string', 'size:64']]);
        $valid = StudentRegistrationToken::where('token_hash', hash('sha256', $data['token']))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->exists();

        return response()->json(['valid' => $valid]);
    }

    public function index(Request $request)
    {
        $query = StudentRegistration::query()->with('student:id,student_code');

        if ($request->filled('status') && in_array($request->status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        return response()->json($query->latest()->paginate(10));
    }

    public function approve(Request $request, StudentRegistration $studentRegistration)
    {
        $request->validate(['student_code' => ['nullable', 'string', 'max:50', 'unique:students,student_code']]);

        $student = DB::transaction(function () use ($request, $studentRegistration) {
            $registration = StudentRegistration::query()->lockForUpdate()->findOrFail($studentRegistration->id);
            abort_unless($registration->status === 'pending', 422, 'Only pending registrations can be approved.');

            $studentCode = $request->input('student_code') ?: $this->generateStudentCode();
            $student = Student::create([
                'student_code' => $studentCode,
                'first_name' => $registration->first_name,
                'last_name' => $registration->last_name,
                'gender' => $registration->gender,
                'date_of_birth' => $registration->date_of_birth,
                'phone' => $registration->phone,
                'email' => $registration->email,
                'address' => $registration->address,
                'guardian_name' => $registration->guardian_name,
                'guardian_phone' => $registration->guardian_phone,
                'enrollment_date' => now()->toDateString(),
                'status' => 'active',
            ]);

            $registration->update([
                'status' => 'approved',
                'student_id' => $student->id,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            return $student;
        });

        return response()->json(['message' => 'Registration approved and student enrolled.', 'data' => $student], 201);
    }

    public function reject(Request $request, StudentRegistration $studentRegistration)
    {
        $data = $request->validate(['review_note' => ['nullable', 'string', 'max:1000']]);
        abort_unless($studentRegistration->status === 'pending', 422, 'Only pending registrations can be rejected.');
        $studentRegistration->update([
            'status' => 'rejected',
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Registration rejected.']);
    }

    private function generateStudentCode(): string
    {
        do {
            $code = 'STU-'.now()->format('Y').'-'.Str::upper(Str::random(6));
        } while (Student::where('student_code', $code)->exists());

        return $code;
    }
}
