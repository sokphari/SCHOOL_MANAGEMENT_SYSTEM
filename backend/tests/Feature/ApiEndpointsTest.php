<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Course;
use App\Models\Floor;
use App\Models\Lesson;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\StudentRequest;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\SchoolDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private function authenticatedAs(User $user): self
    {
        Sanctum::actingAs($user);

        return $this;
    }

    public function test_login_uses_an_http_only_session_cookie_and_logout_invalidates_it(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $this->withServerVariables(['HTTP_ORIGIN' => 'http://localhost:5176']);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['user'])->assertJsonMissingPath('token');

        $cookieName = config('session.cookie');
        $sessionCookie = $response->getCookie($cookieName, false);

        $this->assertNotNull($sessionCookie);
        $this->assertTrue($sessionCookie->isHttpOnly());

        $this->withUnencryptedCookie($cookieName, $sessionCookie->getValue())
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('role', 'admin');
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => User::where('email', 'admin@example.com')->value('id'),
            'action' => 'auth.login.succeeded',
        ]);

        $this->postJson('/api/logout')->assertOk();
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'auth.logout.succeeded',
            'module' => 'auth',
        ]);
        Auth::forgetGuards();
        $this->getJson('/api/me')->assertUnauthorized();

        $this->postJson('/api/login', [
            'email' => 'teacher1@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonPath('user.role', 'teacher');
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => User::where('email', 'teacher1@example.com')->value('id'),
            'action' => 'auth.login.succeeded',
            'module' => 'auth',
        ]);
    }

    public function test_api_endpoints_across_all_modules(): void
    {
        Http::fake(['api.telegram.org/*' => Http::response(['ok' => true])]);
        $this->seed(SchoolDemoSeeder::class);
        $this->withServerVariables(['HTTP_ORIGIN' => 'http://localhost:5176']);

        $adminUser = User::where('email', 'admin@example.com')->firstOrFail();
        $teacherUser = User::where('email', 'teacher1@example.com')->firstOrFail();

        $this->getJson('/api/locations/buildings')->assertUnauthorized();
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'security.access_denied',
            'module' => 'security',
            'status_code' => 401,
        ]);
        $this->authenticatedAs($teacherUser)->getJson('/api/locations/buildings')->assertOk();
        $this->authenticatedAs($teacherUser)->getJson('/api/courses')->assertOk();
        $building = $this->authenticatedAs($adminUser)->postJson('/api/locations/buildings', [
            'name' => 'API Test Building',
            'code' => 'API-B',
            'description' => 'Facilities endpoint test',
            'status' => 'active',
        ])->assertCreated()->json('data');
        $buildingId = $building['id'];
        $this->authenticatedAs($adminUser)->putJson("/api/locations/buildings/{$buildingId}", [
            'name' => 'API Test Building Updated', 'code' => 'API-B', 'description' => 'Updated facilities test', 'status' => 'active',
        ])->assertOk();
        $floor = $this->authenticatedAs($adminUser)->postJson('/api/locations/floors', [
            'building_id' => $buildingId,
            'name' => 'API Test Floor',
            'floor_number' => 1,
            'code' => 'API-F1',
            'status' => 'active',
        ])->assertCreated()->json('data');
        $floorId = $floor['id'];
        $this->authenticatedAs($adminUser)->putJson("/api/locations/floors/{$floorId}", [
            'building_id' => $buildingId, 'name' => 'API Test Floor Updated', 'floor_number' => 1, 'code' => 'API-F1', 'status' => 'active',
        ])->assertOk();
        $room = $this->authenticatedAs($adminUser)->postJson('/api/locations/rooms', [
            'floor_id' => $floorId,
            'name' => 'API Test Room',
            'room_type' => 'classroom',
            'code' => 'API-R1',
            'capacity' => 24,
            'status' => 'active',
        ])->assertCreated()->json('data');
        $roomId = $room['id'];
        $this->authenticatedAs($adminUser)->putJson("/api/locations/rooms/{$roomId}", [
            'floor_id' => $floorId, 'name' => 'API Test Room Updated', 'room_type' => 'computer_lab', 'code' => 'API-R1', 'capacity' => 28, 'status' => 'active',
        ])->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/locations/buildings')->assertOk()
            ->assertJsonPath('0.floors.0.rooms.0.name', 'API Test Room Updated')
            ->assertJsonPath('0.floors.0.rooms.0.room_type', 'computer_lab');

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'auth.login.failed',
            'module' => 'auth',
            'status_code' => 401,
        ]);
        $this->authenticatedAs($adminUser)->getJson('/api/system-users')
            ->assertOk()
            ->assertJsonFragment(['role' => 'teacher']);
        $this->authenticatedAs($adminUser)->getJson('/api/audit-logs?role=teacher')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'last_page']);

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

        $this->authenticatedAs($teacherUser)->getJson('/api/dashboard')->assertOk()->assertJsonPath('role', 'teacher');
        $this->authenticatedAs($teacherUser)->getJson('/api/classes')->assertOk();

        $this->authenticatedAs($adminUser)->getJson('/api/me')->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/dashboard')->assertOk()->assertJsonPath('role', 'admin');
        $this->authenticatedAs($adminUser)->getJson('/api/students')->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/teachers')->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/classes')->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/settings')->assertOk();
        $this->authenticatedAs($adminUser)->putJson('/api/settings', ['school_name' => 'Smoke Test School'])->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/student-requests/pending-count')->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/student-requests')->assertOk();

        $studentRequestId = StudentRequest::query()->where('subject', 'Endpoint smoke test request')->value('id');
        $this->authenticatedAs($adminUser)->getJson("/api/student-requests/{$studentRequestId}")->assertOk();
        $this->authenticatedAs($adminUser)->putJson("/api/student-requests/{$studentRequestId}/status", [
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
        $student = $this->authenticatedAs($adminUser)->postJson('/api/students', $studentData)->assertCreated()->json('data');
        $studentId = $student['id'];
        $this->authenticatedAs($adminUser)->getJson("/api/students/{$studentId}")->assertOk();
        $studentData['first_name'] = 'Updated';
        $this->authenticatedAs($adminUser)->putJson("/api/students/{$studentId}", $studentData)->assertOk();
        $studentData['last_name'] = 'Patched';
        $this->authenticatedAs($adminUser)->patchJson("/api/students/{$studentId}", $studentData)->assertOk();

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
        $teacher = $this->authenticatedAs($adminUser)->postJson('/api/teachers', $teacherData)->assertCreated()->json('data');
        $teacherId = $teacher['id'];
        $this->authenticatedAs($adminUser)->getJson("/api/teachers/{$teacherId}")->assertOk();
        $teacherData['last_name'] = 'Updated';
        $this->authenticatedAs($adminUser)->putJson("/api/teachers/{$teacherId}", $teacherData)->assertOk();
        $teacherData['last_name'] = 'Patched';
        $this->authenticatedAs($adminUser)->patchJson("/api/teachers/{$teacherId}", $teacherData)->assertOk();

        $course = $this->authenticatedAs($adminUser)->postJson('/api/courses', [
            'name' => 'API Test Course', 'code' => 'API-C01', 'description' => 'Course CRUD test', 'status' => 'active',
        ])->assertCreated()->json('data');
        $courseId = $course['id'];
        $this->authenticatedAs($adminUser)->putJson("/api/courses/{$courseId}", [
            'name' => 'API Test Course Updated', 'code' => 'API-C01', 'description' => 'Updated course test', 'status' => 'active',
        ])->assertOk();
        $lesson = $this->authenticatedAs($adminUser)->postJson("/api/courses/{$courseId}/lessons", [
            'name' => 'API Test Lesson', 'lesson_number' => 1, 'description' => 'Lesson CRUD test', 'status' => 'active',
        ])->assertCreated()->json('data');
        $lessonId = $lesson['id'];
        $this->authenticatedAs($adminUser)->putJson("/api/lessons/{$lessonId}", [
            'name' => 'API Test Lesson Updated', 'lesson_number' => 1, 'description' => 'Updated lesson test', 'status' => 'active',
        ])->assertOk();
        $this->authenticatedAs($adminUser)->getJson('/api/courses')->assertOk()
            ->assertJsonPath('0.lessons.0.name', 'API Test Lesson Updated');

        $classData = [
            'name' => 'API Test Class',
            'course' => 'API Test Course Updated',
            'course_id' => $courseId,
            'lesson' => 'API Test Lesson Updated',
            'lesson_id' => $lessonId,
            'delivery_mode' => 'physical',
            'section' => 'Z',
            'academic_year' => '2026-2027',
            'building_id' => $buildingId,
            'floor_id' => $floorId,
            'room_id' => $roomId,
            'term' => 'Monday and Wednesday',
            'time' => '09:00 AM - 10:30 AM',
            'teacher_id' => $teacherId,
            'status' => 'active',
        ];
        $class = $this->authenticatedAs($adminUser)->postJson('/api/classes', $classData)->assertCreated()
            ->assertJsonPath('data.course', 'API Test Course Updated')
            ->assertJsonPath('data.lesson', 'API Test Lesson Updated')
            ->json('data');
        $classId = $class['id'];
        $this->authenticatedAs($adminUser)->deleteJson("/api/lessons/{$lessonId}")->assertStatus(409);
        $this->authenticatedAs($adminUser)->deleteJson("/api/courses/{$courseId}")->assertStatus(409);
        $this->authenticatedAs($adminUser)->deleteJson("/api/locations/rooms/{$roomId}")->assertStatus(409);
        $this->authenticatedAs($adminUser)->deleteJson("/api/locations/floors/{$floorId}")->assertStatus(409);
        $this->authenticatedAs($adminUser)->deleteJson("/api/locations/buildings/{$buildingId}")->assertStatus(409);
        $this->authenticatedAs($adminUser)->getJson("/api/classes/{$classId}")->assertOk();
        $classData['name'] = 'API Test Class Updated';
        $this->authenticatedAs($adminUser)->putJson("/api/classes/{$classId}", $classData)->assertOk();
        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/students/{$studentId}")->assertOk();

        $attendanceDate = now()->toDateString();
        $permissionDate = now()->addDays(2)->toDateString();
        $attendance = $this->authenticatedAs($adminUser)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => $attendanceDate,
            'status' => 'present',
        ])->assertCreated()->json('data');
        $attendanceId = $attendance['id'];

        // This assertion currently exposes the known broken index implementation.
        $this->authenticatedAs($adminUser)->getJson('/api/attendances')->assertOk();
        $this->authenticatedAs($adminUser)->getJson("/api/attendances/{$attendanceId}")->assertOk();
        $this->authenticatedAs($adminUser)->getJson("/api/classes/{$classId}/attendance/{$attendanceDate}")->assertOk();
        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/attendance/bulk", [
            'attendance_date' => now()->addDay()->toDateString(),
            'records' => [['student_id' => $studentId, 'status' => 'late']],
        ])->assertOk();

        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/attendance/permission-range", [
            'student_id' => $studentId,
            'start_date' => $permissionDate,
            'end_date' => $permissionDate,
            'note' => 'API permission range test',
        ])->assertOk();
        $this->authenticatedAs($adminUser)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => now()->addDays(3)->toDateString(),
            'status' => 'absent',
        ])->assertCreated();

        $gradingTerm = $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/grades/terms", [
            'name' => 'API Test Term',
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(),
        ])->assertCreated()->json('data');
        $termId = $gradingTerm['id'];
        $this->authenticatedAs($adminUser)->getJson("/api/classes/{$classId}/grades/terms")->assertOk();
        $this->authenticatedAs($adminUser)->putJson("/api/grades/terms/{$termId}/students/{$studentId}", [
            'activity_score' => 25,
            'exam_score' => 35,
        ])->assertOk();
        $this->authenticatedAs($adminUser)->putJson("/api/grades/terms/{$termId}/students/{$studentId}", [
            'activity_score' => 31,
            'exam_score' => 35,
        ])->assertUnprocessable();
        $this->authenticatedAs($adminUser)->getJson("/api/grades/terms/{$termId}")
            ->assertOk()
            ->assertJsonPath('score_maximums.attendance', 40)
            ->assertJsonPath('students.0.attendance_score', 38.5)
            ->assertJsonPath('students.0.activity_score', 25)
            ->assertJsonPath('students.0.exam_score', 35)
            ->assertJsonPath('students.0.total_score', 98.5);

        $this->authenticatedAs($teacherUser)->getJson("/api/classes/{$classId}/attendance/permission-availability?date={$permissionDate}")
            ->assertOk()
            ->assertJsonPath("availability.{$studentId}", false);
        $this->authenticatedAs($teacherUser)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => '2027-01-04',
            'status' => 'excused',
        ])->assertCreated();
        $this->authenticatedAs($teacherUser)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => '2027-01-05',
            'status' => 'excused',
        ])->assertForbidden();

        $this->authenticatedAs($teacherUser)->getJson('/api/timetable/classes')->assertOk();
        $this->authenticatedAs($teacherUser)->postJson('/api/timetable', [
            'school_class_id' => $classId,
            'day_of_week' => 2,
            'starts_at' => '10:00',
            'ends_at' => '11:00',
        ])->assertForbidden();
        $timetableSession = $this->authenticatedAs($adminUser)->postJson('/api/timetable', [
            'school_class_id' => $classId,
            'day_of_week' => 2,
            'starts_at' => '10:00',
            'ends_at' => '11:00',
        ])->assertCreated()->json('data');
        $timetableSessionId = $timetableSession['id'];
        $this->authenticatedAs($adminUser)->getJson('/api/timetable')->assertOk();
        $this->authenticatedAs($adminUser)->putJson("/api/timetable/{$timetableSessionId}", [
            'school_class_id' => $classId,
            'day_of_week' => 2,
            'starts_at' => '11:00',
            'ends_at' => '12:00',
        ])->assertOk();
        $this->authenticatedAs($adminUser)->postJson('/api/timetable', [
            'school_class_id' => $classId,
            'day_of_week' => 2,
            'starts_at' => '11:30',
            'ends_at' => '12:30',
        ])->assertUnprocessable();
        $this->authenticatedAs($adminUser)->deleteJson("/api/timetable/{$timetableSessionId}")->assertOk();

        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/end", [
            'end_date' => now()->addDays(10)->toDateString(),
        ])->assertOk();
        $this->authenticatedAs($adminUser)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => now()->addDays(11)->toDateString(),
            'status' => 'present',
        ])->assertForbidden();
        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/pre-end")->assertOk();
        $this->authenticatedAs($adminUser)->getJson("/api/classes/{$classId}/attendance/{$attendanceDate}")->assertOk();
        $this->authenticatedAs($adminUser)->postJson('/api/attendances', [
            'student_id' => $studentId,
            'school_class_id' => $classId,
            'attendance_date' => $attendanceDate,
            'status' => 'present',
        ])->assertForbidden();
        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/resume")->assertOk();

        $targetClassId = SchoolClass::where('name', 'Grade 2')->value('id');
        $this->authenticatedAs($adminUser)->postJson("/api/classes/{$classId}/students/{$studentId}/transfer", [
            'target_class_id' => $targetClassId,
        ])->assertOk()->assertJsonPath('data.target_class_id', $targetClassId);
        $secondTeacherId = Teacher::where('teacher_code', 'T002')->value('id');
        $this->authenticatedAs($adminUser)->putJson("/api/classes/{$classId}/teacher", [
            'teacher_id' => $secondTeacherId,
        ])->assertOk()->assertJsonPath('data.teacher.id', $secondTeacherId);

        $this->authenticatedAs($adminUser)->deleteJson("/api/attendances/{$attendanceId}")->assertOk();

        $this->authenticatedAs($adminUser)->deleteJson("/api/classes/{$targetClassId}/students/{$studentId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/classes/{$classId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/lessons/{$lessonId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/courses/{$courseId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/locations/rooms/{$roomId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/locations/floors/{$floorId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/locations/buildings/{$buildingId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/teachers/{$teacherId}")->assertOk();
        $this->authenticatedAs($adminUser)->deleteJson("/api/students/{$studentId}")->assertOk();

        $this->getJson('/api/test-telegram')->assertNotFound();
        $this->authenticatedAs($adminUser)->postJson('/api/logout')->assertOk();
    }

    public function test_admin_can_change_teacher_module_access_and_backend_enforces_it(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $this->withServerVariables(['HTTP_ORIGIN' => 'http://localhost:5176']);
        $adminUser = User::where('email', 'admin@example.com')->firstOrFail();
        $teacherUser = User::where('email', 'teacher1@example.com')->firstOrFail();
        $modules = [
            'dashboard' => true,
            'attendance' => true,
            'students' => true,
            'classes' => false,
            'timetable' => true,
            'grades' => true,
        ];
        $features = [
            'dashboard' => ['view' => false],
            'attendance' => ['view' => true, 'record' => true],
            'students' => ['view_list' => true, 'view_details' => true, 'view_attendance' => true],
            'classes' => ['view_list' => true, 'view_details' => true],
            'timetable' => ['view' => true],
            'grades' => ['view_terms' => true, 'enter_scores' => true],
        ];

        $this->authenticatedAs($adminUser)->putJson('/api/role-permissions/teacher', [
            'modules' => $modules,
            'features' => $features,
        ])
            ->assertOk()
            ->assertJsonFragment(['key' => 'classes', 'allowed' => false])
            ->assertJsonFragment(['key' => 'view', 'label' => 'View dashboard', 'allowed' => false]);
        $this->authenticatedAs($teacherUser)->getJson('/api/dashboard')->assertForbidden();
        $this->authenticatedAs($teacherUser)->getJson('/api/classes')->assertForbidden();
        $this->authenticatedAs($teacherUser)->getJson('/api/system-users')->assertForbidden();
        $this->authenticatedAs($teacherUser)->putJson('/api/role-permissions/teacher', ['modules' => $modules])->assertForbidden();

        $modules['classes'] = true;
        $features['dashboard']['view'] = true;
        $this->authenticatedAs($adminUser)->putJson('/api/role-permissions/teacher', [
            'modules' => $modules,
            'features' => $features,
        ])->assertOk();
        $this->assertDatabaseHas('role_feature_permissions', [
            'role' => 'teacher',
            'module' => 'dashboard',
            'feature' => 'view',
            'allowed' => true,
        ]);
        $this->authenticatedAs($teacherUser)->getJson('/api/dashboard')->assertOk();
        $this->authenticatedAs($teacherUser)->getJson('/api/classes')->assertOk();
    }

    public function test_teacher_can_create_a_class_only_when_the_create_feature_is_allowed(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $this->withServerVariables(['HTTP_ORIGIN' => 'http://localhost:5176']);

        $adminUser = User::where('email', 'admin@example.com')->firstOrFail();
        $teacherUser = User::where('email', 'teacher1@example.com')->firstOrFail();
        $teacherId = Teacher::where('user_id', $teacherUser->id)->value('id');
        $otherTeacherId = Teacher::where('user_id', '!=', $teacherUser->id)->value('id');
        $course = Course::where('status', 'active')->firstOrFail();
        $lesson = Lesson::where('course_id', $course->id)->where('status', 'active')->firstOrFail();
        $building = Building::create(['name' => 'Teacher Create Building', 'status' => 'active']);
        $floor = Floor::create(['building_id' => $building->id, 'name' => 'Ground Floor', 'floor_number' => 0, 'status' => 'active']);
        $room = Room::create(['floor_id' => $floor->id, 'name' => 'Room T1', 'room_type' => 'classroom', 'capacity' => 24, 'status' => 'active']);

        $modules = [
            'dashboard' => true,
            'attendance' => true,
            'students' => true,
            'classes' => true,
            'timetable' => true,
            'grades' => true,
        ];
        $features = [
            'dashboard' => ['view' => true],
            'attendance' => ['view' => true, 'record' => true],
            'students' => ['view_list' => true, 'view_details' => true, 'view_attendance' => true],
            'classes' => ['view_list' => true, 'view_details' => true, 'create' => false],
            'timetable' => ['view' => true],
            'grades' => ['view_terms' => true, 'enter_scores' => true],
        ];

        $this->authenticatedAs($adminUser)->putJson('/api/role-permissions/teacher', [
            'modules' => $modules,
            'features' => $features,
        ])->assertOk();
        $this->authenticatedAs($teacherUser)->getJson('/api/courses')->assertForbidden();

        $features['classes']['create'] = true;
        $this->authenticatedAs($adminUser)->putJson('/api/role-permissions/teacher', [
            'modules' => $modules,
            'features' => $features,
        ])->assertOk();
        $this->authenticatedAs($teacherUser)->getJson('/api/courses')->assertOk();

        $this->authenticatedAs($teacherUser)->postJson('/api/classes', [
            'name' => 'Teacher Created Class',
            'course' => $course->name,
            'lesson' => $lesson->name,
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
            'delivery_mode' => 'physical',
            'section' => 'T',
            'academic_year' => '2026-2027',
            'building_id' => $building->id,
            'floor_id' => $floor->id,
            'room_id' => $room->id,
            'term' => 'Monday and Wednesday',
            'time' => '09:00 AM - 10:30 AM',
            'teacher_id' => $otherTeacherId,
            'status' => 'inactive',
        ])->assertCreated()
            ->assertJsonPath('data.teacher_id', $teacherId)
            ->assertJsonPath('data.status', 'active');
    }
}
