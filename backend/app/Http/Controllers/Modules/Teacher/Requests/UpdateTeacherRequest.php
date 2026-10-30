<?php

namespace App\Http\Controllers\Modules\Teacher\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teacherId = $this->route('teacher')->id;

        return [
            'user_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('role', 'teacher'),
                Rule::unique('teachers', 'user_id')->ignore($teacherId),
            ],
            'teacher_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('teachers', 'teacher_code')->ignore($teacherId),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'in:male,female'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'hire_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }
}
