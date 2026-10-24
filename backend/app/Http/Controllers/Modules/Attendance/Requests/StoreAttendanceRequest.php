<?php

namespace App\Http\Controllers\Modules\Attendance\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_id' => ['required','exists:students,id'],
            'school_class_id' => ['required','exists:school_classes,id'],
            'attendance_date' => ['required', 'date'],
            'attendance_date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late,excused'],
            'note' => ['nullable', 'string'],
        ];
    }
}
