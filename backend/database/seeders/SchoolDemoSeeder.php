<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudentRequest;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class SchoolDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'School Admin',
                'password' => 'password',
                'role' => 'admin',
            ]
        );

        $teachers = collect();
        for ($i = 1; $i <= 10; $i++) {
            $user = User::updateOrCreate(
                ['email' => "teacher{$i}@example.com"],
                [
                    'name' => "Teacher {$i}",
                    'password' => 'password',
                    'role' => 'teacher',
                ]
            );

            $teachers->push(Teacher::updateOrCreate(
                ['teacher_code' => sprintf('T%03d', $i)],
                [
                    'user_id' => $user->id,
                    'first_name' => 'Teacher',
                    'last_name' => (string) $i,
                    'gender' => $i % 2 === 0 ? 'female' : 'male',
                    'phone' => sprintf('012345%04d', $i),
                    'email' => $user->email,
                    'address' => "Teacher address {$i}",
                    'hire_date' => now()->subYears($i)->toDateString(),
                    'status' => 'active',
                ]
            ));
        }

        $students = collect();
        for ($i = 1; $i <= 10; $i++) {
            $students->push(Student::updateOrCreate(
                ['student_code' => sprintf('S%03d', $i)],
                [
                    'first_name' => 'Student',
                    'last_name' => (string) $i,
                    'gender' => $i % 2 === 0 ? 'female' : 'male',
                    'date_of_birth' => now()->subYears(10 + ($i % 8))->toDateString(),
                    'phone' => sprintf('098765%04d', $i),
                    'email' => sprintf('student%d@example.com', $i),
                    'address' => "Student address {$i}",
                    'guardian_name' => "Guardian {$i}",
                    'guardian_phone' => sprintf('011234%04d', $i),
                    'enrollment_date' => now()->subMonths($i)->toDateString(),
                    'status' => 'active',
                ]
            ));
        }

        $classes = collect();
        for ($i = 1; $i <= 10; $i++) {
            $classes->push(SchoolClass::updateOrCreate(
                ['name' => "Grade {$i}", 'academic_year' => '2026-2027'],
                [
                    'section' => 'A',
                    'room' => sprintf('Room %02d', $i),
                    'teacher_id' => $teachers[$i - 1]->id,
                    'description' => "Demo class {$i}",
                    'status' => 'active',
                ]
            ));
        }

        foreach ($students as $i => $student) {
            $class = $classes[$i];
            $class->students()->syncWithoutDetaching([
                $student->id => [
                    'joined_at' => now()->subMonths($i + 1)->toDateString(),
                    'status' => 'active',
                ],
            ]);

            Attendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'school_class_id' => $class->id,
                    'attendance_date' => now()->subDay()->toDateString(),
                ],
                [
                    'status' => ['present', 'present', 'late', 'absent', 'excused'][$i % 5],
                    'marked_by' => $teachers[$i]->user_id,
                    'note' => $i % 5 === 3 ? 'Demo absence' : null,
                ]
            );

            StudentRequest::updateOrCreate(
                [
                    'student_code_snapshot' => $student->student_code,
                    'subject' => 'Demo request '.($i + 1),
                ],
                [
                    'student_id' => $student->id,
                    'category' => [
                        'teacher_feedback',
                        'room_issue',
                        'facility_issue',
                        'class_request',
                        'general_request',
                    ][$i % 5],
                    'description' => 'This is demo request '.($i + 1).' for API testing.',
                    'status' => ['pending', 'in_progress', 'resolved', 'rejected'][$i % 4],
                    'priority' => ['low', 'medium', 'high'][$i % 3],
                    'admin_note' => $i % 4 === 2 ? 'Demo request reviewed.' : null,
                ]
            );
        }

        $settings = [
            'school_name' => 'Demo School',
            'school_phone' => '+855 12 345 678',
            'school_email' => 'info@example.com',
            'school_address' => 'Phnom Penh, Cambodia',
            'telegram_chat_id' => '',
            'logo_url' => 'https://example.com/school-logo.png',
            'banner_url' => 'https://example.com/school-banner.jpg',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
