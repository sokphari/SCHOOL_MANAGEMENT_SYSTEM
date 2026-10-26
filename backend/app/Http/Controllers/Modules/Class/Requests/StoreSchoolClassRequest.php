<?php

namespace App\Http\Controllers\Modules\Class\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolClassRequest extends FormRequest
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
            'building_id' => ['required', 'integer', 'exists:buildings,id'],
            'floor_id' => ['required', 'integer', Rule::exists('floors', 'id')->where('building_id', $this->input('building_id'))],
            'room_id' => ['required', 'integer', Rule::exists('rooms', 'id')->where('floor_id', $this->input('floor_id'))],
            'term' => ['required', 'string', 'max:100'],
            'time' => ['required', 'string', 'max:100'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }
}
