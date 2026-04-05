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
        'section',
        'academic_year',
        'room',
        'teacher_id',
        'description',
        'status',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
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
}