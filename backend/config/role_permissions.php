<?php

return [
    'teacher_modules' => [
        'dashboard' => [
            'label' => 'Dashboard',
            'features' => ['view' => 'View dashboard'],
        ],
        'attendance' => [
            'label' => 'Attendance',
            'features' => [
                'view' => 'View attendance records',
                'record' => 'Record attendance',
            ],
        ],
        'students' => [
            'label' => 'Students',
            'features' => [
                'view_list' => 'View student list',
                'view_details' => 'View student details',
                'view_attendance' => 'View student attendance history',
            ],
        ],
        'classes' => [
            'label' => 'Classes',
            'features' => [
                'view_list' => 'View class list',
                'view_details' => 'View class details and roster',
                'create' => 'Create a class assigned to yourself',
                'add_students' => 'Add students to your classes',
                'switch_teacher' => 'Switch the teacher assigned to your class',
                'edit' => 'Edit your class information',
                'schedule_end' => 'Schedule an end date for your class',
                'pre_end' => 'Pre-End your class and stop attendance tracking',
                'resume' => 'Resume your class',
            ],
        ],
        'timetable' => [
            'label' => 'Timetable',
            'features' => ['view' => 'View weekly timetable'],
        ],
        'grades' => [
            'label' => 'Grades',
            'features' => [
                'view_terms' => 'View grading terms and scores',
                'enter_scores' => 'Enter and update student scores',
            ],
        ],
    ],
    'feature_dependencies' => [
        'attendance.record' => ['attendance.view'],
        'classes.create' => ['classes.view_list'],
        'classes.add_students' => ['classes.view_list'],
        'classes.switch_teacher' => ['classes.view_list'],
        'classes.edit' => ['classes.view_list', 'classes.view_details'],
        'classes.schedule_end' => ['classes.view_list'],
        'classes.pre_end' => ['classes.view_list'],
        'classes.resume' => ['classes.view_list'],
        'grades.enter_scores' => ['grades.view_terms'],
    ],
];
