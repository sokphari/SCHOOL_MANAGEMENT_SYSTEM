<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'school_classes';

    protected $fillable = [
        'name',
        'course',
        'lesson',
        'course_id',
        'lesson_id',
        'delivery_mode',
        'section',
        'academic_year',
        'building_id',
        'floor_id',
        'room_id',
        'building',
        'floor',
        'room',
        'term',
        'time',
        'teacher_id',
        'description',
        'status',
        'end_date',
        'pre_end_at',
    ];

    protected $casts = [
        'end_date' => 'date:Y-m-d',
        'pre_end_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function courseRecord()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function lessonRecord()
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function buildingLocation()
    {
        return $this->belongsTo(Building::class, 'building_id');
    }

    public function floorLocation()
    {
        return $this->belongsTo(Floor::class, 'floor_id');
    }

    public function roomLocation()
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    public function students()
    {
        return $this->belongsToMany(
            Student::class,
            'class_student',
            'school_class_id',
            'student_id'
        )->withPivot(['joined_at', 'status'])->withTimestamps();
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'school_class_id');
    }

    public function gradingTerms()
    {
        return $this->hasMany(GradingTerm::class, 'school_class_id');
    }

    public function timetableSessions()
    {
        return $this->hasMany(TimetableSession::class, 'school_class_id');
    }
}
