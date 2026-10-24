<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\SchoolDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_endpoints_across_all_modules(): void
    {
        Http::fake(['api.telegram.org/*' => Http::response(['ok' => true])]);
        $this->seed(SchoolDemoSeeder::class);

        $adminLogin = $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['user', 'token']);
        $adminToken = $adminLogin->json('token');

        $teacherLogin = $this->postJson('/api/login', [
            'email' => 'teacher1@example.com',
            'password' => 'password',
        ])->assertOk();
        $teacherToken = $teacherLogin->json('token');

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();

        $this->getJson('/api/public/settings')->assertOk();
        $this->getJson('/api/public/students/by-code/S001')->assertOk();
        $this->getJson('/api/public/students/by-code/MISSING')->assertNotFound();

        $this->postJson('/api/public/student-requests', [
            'student_code' => 'S001',
            'category' => 'general_request',
            'subject' => 'Endpoint smoke test request',
            'description' => 'Request created by the API endpoint smoke test.',
            'priority' => 'low',
        ])->assertCreated();

        $this->withToken($teacherToken)->getJson('/api/dashboard')->assertOk()->assertJsonPath('role', 'teacher');
        $this->withToken($teacherToken)->getJson('/api/classes')->assertOk();

        $this->withToken($adminToken)->getJson('/api/me')->assertOk();
        $this->withToken($adminToken)->getJson('/api/dashboard')->assertOk()->assertJsonPath('role', 'admin');
        $this->withToken($adminToken)->getJson('/api/students')->assertOk();
        $this->withToken($adminToken)->getJson('/api/teachers')->assertOk();
        $this->withToken($adminToken)->getJson('/api/classes')->assertOk();
        $this->withToken($adminToken)->getJson('/api/settings')->assertOk();
        $this->withToken($adminToken)->putJson('/api/settings', ['school_name' => 'Smoke Test School'])->assertOk();
        $this->withToken($adminToken)->getJson('/api/student-requests/pending-count')->assertOk();
        $this->withToken($adminToken)->getJson('/api/student-requests')->assertOk();

        $studentRequestId = \App\Models\StudentRequest::query()->where('subject', 'Endpoint smoke test request')->value('id');
        $this->withToken($adminToken)->getJson("/api/student-requests/{$studentRequestId}")->assertOk();
        $this->withToken($adminToken)->putJson("/api/student-requests/{$studentRequestId}/status", [
            'status' => 'in_progress',
            'admin_note' => 'Reviewed by endpoint smoke test.',
        ])->assertOk();

        $studentData = [
            'student_code' => 'API-TEST-001',
            'first_name' => 'Api',
            'last_name' => 'Student',
            'gender' => 'female',
            'email' => 'api-student@example.com',
            'status' => 'active',
        ];
        $student = $this->withToken($adminToken)->postJson('/api/students', $studentData)->assertCreated()->json('data');
        $studentId = $student['id'];
        $this->withToken($adminToken)->getJson("/api/students/{$studentId}")->assertOk();
        $studentData['first_name'] = 'Updated';
        $this->withToken($adminToken)->putJson("/api/students/{$studentId}", $studentData)->assertOk();
        $studentData['last_name'] = 'Patched';
        $this->withToken($adminToken)->patchJson("/api/students/{$studentId}", $studentData)->assertOk();

        $teacherUser = User::create([
            'name' => 'API Test Teacher',
            'email' => 'api-test-teacher@example.com',
            'password' => 'password',
            'role' => 'teacher',
        ]);
        $teacherData = [
            'user_id' => $teacherUser->id,
            'teacher_code' => 'API-T001',
            'first_name' => 'Api',
            'last_name' => 'Teacher',
            'gender' => 'male',
            'email' => $teacherUser->email,
            'status' => 'active',
        ];
        $teacher = $this->withToken($adminToken)->postJson('/api/teachers', $teacherData)->assertCreated()->json('data');
        $teacherId = $teacher['id'];
        $this->withToken($adminToken)->getJson("/api/teachers/{$teacherId}")->assertOk();
        $teacherData['last_name'] = 'Updated';
        $this->withToken($adminToken)->putJson("/api/teachers/{$teacherId}", $teacherData)->assertOk();
        $teacherData['last_name'] = 'Patched';
        $this->withToken($adminToken)->patchJson("/api/teachers/{$teacherId}", $teacherData)->assertOk();

        $classData = [
            'name' => 'API Test Class',
            'section' => 'Z',
            'academic_year' => '2026-2027',
            'teacher_id' => $teacherId,
            'status' => 'active',
        ];
        $class = $this->withToken($adminToken)->postJson('/api/classes', $classData)->assertCreated()->json('data');
        $classId = $class['id'];
        $this->withToken($adminToken)->getJson("/api/classes/{$classId}")->assertOk();
        $classData['name'] = 'API Test Class Updated';
        $this->withToken($adminToken)->putJson("/api/classes/{$classId}", $classData)->assertOk();
        $this->withToken($adminToken)->postJson("/api/classes/{$classId}/students/{$studentId}")->assertOk();

        $attendanceDate = now()->toDateString();
        $attendance = $this->withToken($adminToken)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => $attendanceDate,
            'status' => 'present',
        ])->assertCreated()->json('data');
        $attendanceId = $attendance['id'];

        // This assertion currently exposes the known broken index implementation.
        $this->withToken($adminToken)->getJson('/api/attendances')->assertOk();
        $this->withToken($adminToken)->getJson("/api/attendances/{$attendanceId}")->assertOk();
        $this->withToken($adminToken)->getJson("/api/classes/{$classId}/attendance/{$attendanceDate}")->assertOk();
        $this->withToken($adminToken)->postJson("/api/classes/{$classId}/attendance/bulk", [
            'attendance_date' => now()->addDay()->toDateString(),
            'records' => [['student_id' => $studentId, 'status' => 'late']],
        ])->assertOk();
        $this->withToken($adminToken)->deleteJson("/api/attendances/{$attendanceId}")->assertOk();

        $this->withToken($adminToken)->deleteJson("/api/classes/{$classId}/students/{$studentId}")->assertOk();
        $this->withToken($adminToken)->deleteJson("/api/classes/{$classId}")->assertOk();
        $this->withToken($adminToken)->deleteJson("/api/teachers/{$teacherId}")->assertOk();
        $this->withToken($adminToken)->deleteJson("/api/students/{$studentId}")->assertOk();

        $this->getJson('/api/test-telegram')->assertOk()->assertJsonStructure(['success']);
        $this->withToken($adminToken)->postJson('/api/logout')->assertOk();
    }
}
