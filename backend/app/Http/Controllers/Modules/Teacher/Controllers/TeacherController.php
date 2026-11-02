<?php

namespace App\Http\Controllers\Modules\Teacher\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Modules\Teacher\Requests\StoreTeacherRequest;
use App\Http\Controllers\Modules\Teacher\Requests\UpdateTeacherRequest;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::query();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('teacher_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        return response()->json(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreTeacherRequest $request)
    {
        $data = $request->validated();
        $data['teacher_code'] ??= $this->generateTeacherCode();
        $teacher = Teacher::create($data);

        return response()->json([
            'message' => 'Teacher created successfully',
            'data' => $teacher,
        ], 201);
    }

    private function generateTeacherCode(): string
    {
        do {
            $code = 'TCH-'.now()->format('Y').'-'.Str::upper(Str::random(6));
        } while (Teacher::where('teacher_code', $code)->exists());

        return $code;
    }

    public function show(Teacher $teacher)
    {
        return response()->json($teacher);
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher)
    {
        $teacher->update($request->validated());

        return response()->json([
            'message' => 'Teacher updated successfully',
            'data' => $teacher,
        ]);
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->delete();

        return response()->json([
            'message' => 'Teacher deleted successfully',
        ]);
    }
}
