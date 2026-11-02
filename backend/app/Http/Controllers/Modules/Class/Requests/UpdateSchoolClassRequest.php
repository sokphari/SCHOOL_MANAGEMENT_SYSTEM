<?php

namespace App\Http\Controllers\Modules\Class\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'course_id' => ['required', 'integer', Rule::exists('courses', 'id')->where('status', 'active')],
            'lesson_id' => ['required', 'integer', Rule::exists('lessons', 'id')->where(fn ($query) => $query->where('course_id', $this->input('course_id'))->where('status', 'active'))],
            'delivery_mode' => ['required', 'in:physical,hybrid,online'],
            'section' => ['nullable', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'building_id' => ['required', 'integer', Rule::exists('buildings', 'id')->where('status', 'active')],
            'floor_id' => ['required', 'integer', Rule::exists('floors', 'id')->where(fn ($query) => $query->where('building_id', $this->input('building_id'))->where('status', 'active'))],
            'room_id' => ['required', 'integer', Rule::exists('rooms', 'id')->where(fn ($query) => $query->where('floor_id', $this->input('floor_id'))->where('status', 'active'))],
            'schedule_days' => ['required', 'array', 'min:1', 'max:7'],
            'schedule_days.*' => ['required', 'integer', 'distinct', 'between:1,7'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'teacher_id' => ['nullable', Rule::exists('teachers', 'id')->where('status', 'active')],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }
}
