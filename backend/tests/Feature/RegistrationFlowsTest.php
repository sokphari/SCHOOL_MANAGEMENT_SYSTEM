<?php

namespace Tests\Feature;

use App\Models\StaffAccountRegistration;
use App\Models\User;
use App\Notifications\FrontendResetPasswordNotification;
use Database\Seeders\SchoolDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_registration_qr_is_single_use_and_admin_can_approve_or_reject(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $this->useClientIp('127.0.0.1');
        $admin = User::where('email', 'admin@example.com')->firstOrFail();

        $token = $this->asAdmin($admin)->postJson('/api/student-registrations/qr-tokens')
            ->assertCreated()
            ->json('data.token');

        $this->getJson('/api/public/student-registrations/qr-status?token='.$token)
            ->assertOk()->assertJsonPath('valid', true);

        $registration = $this->postJson('/api/public/student-registrations', [
            'registration_token' => $token,
            'first_name' => 'QR',
            'last_name' => 'Student',
            'gender' => 'female',
            'email' => 'qr-student@example.com',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');

        $registrationId = $registration->json('data.id');
        $this->getJson('/api/public/student-registrations/qr-status?token='.$token)
            ->assertOk()->assertJsonPath('valid', false);
        $this->postJson('/api/public/student-registrations', [
            'registration_token' => $token,
            'first_name' => 'Duplicate',
            'last_name' => 'Student',
            'gender' => 'male',
        ])->assertUnprocessable();

        $this->asAdmin($admin)->getJson('/api/student-registrations?status=pending')
            ->assertOk()->assertJsonPath('data.0.id', $registrationId);
        $this->asAdmin($admin)->postJson("/api/student-registrations/{$registrationId}/approve")
            ->assertCreated()->assertJsonPath('data.email', 'qr-student@example.com');
        $this->assertDatabaseHas('student_registrations', [
            'id' => $registrationId,
            'status' => 'approved',
        ]);
        $this->assertDatabaseHas('students', [
            'email' => 'qr-student@example.com',
            'status' => 'active',
        ]);
        $this->asAdmin($admin)->postJson("/api/student-registrations/{$registrationId}/approve")
            ->assertUnprocessable();

        $rejectToken = $this->asAdmin($admin)->postJson('/api/student-registrations/qr-tokens')
            ->assertCreated()->json('data.token');
        $rejectRegistrationId = $this->postJson('/api/public/student-registrations', [
            'registration_token' => $rejectToken,
            'first_name' => 'Rejected',
            'last_name' => 'Student',
            'gender' => 'male',
        ])->assertCreated()->json('data.id');
        $this->asAdmin($admin)->postJson("/api/student-registrations/{$rejectRegistrationId}/reject", [
            'review_note' => 'Incomplete information.',
        ])->assertOk();
        $this->assertDatabaseHas('student_registrations', [
            'id' => $rejectRegistrationId,
            'status' => 'rejected',
            'review_note' => 'Incomplete information.',
        ]);
    }

    public function test_teacher_signup_ip_blocking_and_admin_approval(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->useClientIp('198.51.100.25');

        $this->postJson('/api/register', [
            'name' => 'Requested Teacher',
            'email' => 'requested-teacher@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(202);

        $registration = StaffAccountRegistration::where('email', 'requested-teacher@example.com')->firstOrFail();
        $this->assertTrue($registration->expires_at->isFuture());
        $this->assertNotSame('password123', $registration->password);
        $this->assertNotNull($registration->ip_address);

        $this->useClientIp('127.0.0.1');
        $this->asAdmin($admin)->getJson('/api/staff-registrations')
            ->assertOk()->assertJsonPath('data.0.email', 'requested-teacher@example.com');
        $this->asAdmin($admin)->postJson("/api/staff-registrations/{$registration->id}/block-ip")
            ->assertOk();
        $this->assertDatabaseHas('blocked_ips', ['ip_address' => '198.51.100.25']);

        $this->useClientIp('198.51.100.25');
        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertForbidden();
        $this->postJson('/api/register', [
            'name' => 'Blocked Applicant',
            'email' => 'blocked-applicant@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertForbidden();

        $this->useClientIp('127.0.0.1');
        $this->asAdmin($admin)->deleteJson('/api/staff-registrations/blocked-ip', [
            'ip_address' => '198.51.100.25',
        ])->assertOk();
        $this->assertDatabaseMissing('blocked_ips', ['ip_address' => '198.51.100.25']);

        $this->asAdmin($admin)->postJson("/api/staff-registrations/{$registration->id}/approve")
            ->assertOk()->assertJsonPath('user.role', 'teacher');
        $teacherUser = User::where('email', 'requested-teacher@example.com')->firstOrFail();
        $this->assertTrue($teacherUser->is_active);
        $this->assertDatabaseHas('teachers', ['user_id' => $teacherUser->id]);
        $this->postJson('/api/login', [
            'email' => 'requested-teacher@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.role', 'teacher');

    }

    public function test_teacher_can_reset_a_password_using_the_emailed_token(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $this->useClientIp('127.0.0.1');
        Notification::fake();
        $teacher = User::where('email', 'teacher1@example.com')->firstOrFail();

        $this->postJson('/api/password/forgot', ['email' => $teacher->email])->assertOk();
        Notification::assertSentTo($teacher, FrontendResetPasswordNotification::class);
        $notification = Notification::sent($teacher, FrontendResetPasswordNotification::class)->first();
        parse_str((string) parse_url($notification->toMail($teacher)->actionUrl, PHP_URL_QUERY), $query);

        $this->postJson('/api/password/reset', [
            'token' => $query['token'],
            'email' => $teacher->email,
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertOk();
        $this->postJson('/api/login', [
            'email' => $teacher->email,
            'password' => 'new-password123',
        ])->assertOk()->assertJsonPath('user.role', 'teacher');
    }

    private function asAdmin(User $admin): self
    {
        Sanctum::actingAs($admin);

        return $this;
    }

    private function useClientIp(string $ip): void
    {
        $this->withServerVariables([
            'HTTP_ORIGIN' => 'http://localhost:5176',
            'REMOTE_ADDR' => $ip,
        ]);
    }
}
