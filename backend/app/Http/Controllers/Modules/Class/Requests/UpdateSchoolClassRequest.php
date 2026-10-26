<?php

namespace App\Http\Controllers\Modules\Class\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'course' => ['required', 'string', 'max:100'],
            'lesson' => ['required', 'string', 'max:150'],
            'delivery_mode' => ['required', 'in:physical,hybrid,online'],
            'section' => ['nullable', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'building' => ['required', 'string', 'max:100'],
            'floor' => ['required', 'string', 'max:50'],
            'room' => ['nullable', 'string', 'max:50'],
            'term' => ['required', 'string', 'max:100'],
            'time' => ['required', 'string', 'max:100'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }
}
