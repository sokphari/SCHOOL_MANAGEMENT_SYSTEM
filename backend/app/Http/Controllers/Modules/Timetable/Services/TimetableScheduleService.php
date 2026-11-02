<?php

namespace App\Http\Controllers\Modules\Timetable\Services;

use App\Models\SchoolClass;
use App\Models\TimetableSession;
use Illuminate\Validation\ValidationException;

class TimetableScheduleService
{
    public function syncClassSchedule(SchoolClass $class, array $days, string $startsAt, string $endsAt): void
    {
        $days = array_values(array_unique(array_map('intval', $days)));
        sort($days);

        foreach ($days as $day) {
            $this->ensureSessionAvailable($class, [
                'day_of_week' => $day,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ]);
        }

        $class->timetableSessions()->delete();
        foreach ($days as $day) {
            $class->timetableSessions()->create([
                'day_of_week' => $day,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ]);
        }
    }

    public function ensureSessionAvailable(SchoolClass $class, array $schedule, ?int $ignoreSessionId = null): void
    {
        $query = TimetableSession::with('schoolClass')
            ->where('day_of_week', $schedule['day_of_week'])
            ->where('starts_at', '<', $schedule['ends_at'])
            ->where('ends_at', '>', $schedule['starts_at']);

        if ($ignoreSessionId) {
            $query->where('id', '!=', $ignoreSessionId);
        }

        $conflict = $query->get()->first(function (TimetableSession $session) use ($class) {
            $scheduledClass = $session->schoolClass;

            if (! $scheduledClass || $scheduledClass->id === $class->id) {
                return false;
            }

            return ($class->teacher_id && $scheduledClass->teacher_id === $class->teacher_id)
                || $this->sameRoom($class, $scheduledClass);
        });

        if (! $conflict) {
            return;
        }

        $reason = $class->teacher_id && $conflict->schoolClass->teacher_id === $class->teacher_id
            ? 'This teacher is already scheduled for an overlapping session.'
            : 'This room is already booked for an overlapping session.';

        throw ValidationException::withMessages(['schedule_days' => $reason]);
    }

    public function formatDays(array $days): string
    {
        $days = array_values(array_unique(array_map('intval', $days)));
        sort($days);

        $labels = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];

        if (count($days) > 1 && $days === range($days[0], $days[array_key_last($days)])) {
            return $labels[$days[0]].'-'.$labels[$days[array_key_last($days)]];
        }

        return implode(', ', array_map(fn (int $day) => $labels[$day], $days));
    }

    public function formatTime(string $startsAt, string $endsAt): string
    {
        return date('g:i A', strtotime($startsAt)).' - '.date('g:i A', strtotime($endsAt));
    }

    private function sameRoom(SchoolClass $class, SchoolClass $scheduledClass): bool
    {
        if ($class->room_id && $scheduledClass->room_id) {
            return (int) $class->room_id === (int) $scheduledClass->room_id;
        }

        if (! $class->room || ! $scheduledClass->room) {
            return false;
        }

        return mb_strtolower(trim($class->room)) === mb_strtolower(trim($scheduledClass->room))
            && mb_strtolower(trim((string) $class->building)) === mb_strtolower(trim((string) $scheduledClass->building));
    }
}
