<?php

namespace App\Http\Controllers\Modules\Student\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student;

class StudentPublicController extends Controller
{
    public function findByCode($student_code)
    {
        $student = Student::with('classes')
            ->where('student_code', $student_code)
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }

        return response()->json([
            'id' => $student->id,
            'student_code' => $student->student_code,
            'name' => $student->first_name . ' ' . $student->last_name,
            'class_names' => $student->classes->map(function ($class) {
                return $class->name . ($class->section ? " ({$class->section})" : "");
            })->values(),
        ]);
    }
}