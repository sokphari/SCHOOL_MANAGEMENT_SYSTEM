<?php

namespace App\Http\Controllers\Modules\Class\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassScheduleTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClassScheduleTemplateController extends Controller
{
    public function index()
    {
        return response()->json(ClassScheduleTemplate::query()
            ->orderBy('name')
            ->get());
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);
        $template = ClassScheduleTemplate::create($data);

        return response()->json([
            'message' => 'Schedule template created successfully.',
            'data' => $template,
        ], 201);
    }

    public function update(Request $request, ClassScheduleTemplate $scheduleTemplate)
    {
        $scheduleTemplate->update($this->validatedData($request, $scheduleTemplate));

        return response()->json([
            'message' => 'Schedule template updated successfully.',
            'data' => $scheduleTemplate->fresh(),
        ]);
    }

    public function destroy(ClassScheduleTemplate $scheduleTemplate)
    {
        $scheduleTemplate->delete();

        return response()->json(['message' => 'Schedule template deleted successfully.']);
    }

    private function validatedData(Request $request, ?ClassScheduleTemplate $scheduleTemplate = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('class_schedule_templates', 'name')->ignore($scheduleTemplate?->id)],
            'days' => ['required', 'array', 'min:1', 'max:7'],
            'days.*' => ['required', 'integer', 'distinct', 'between:1,7'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'status' => ['required', 'in:active,inactive'],
        ]);
    }
}
