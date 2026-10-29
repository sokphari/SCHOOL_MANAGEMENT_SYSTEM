<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = ['course_id', 'name', 'lesson_number', 'description', 'status'];

    protected $casts = ['lesson_number' => 'integer'];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function schoolClasses()
    {
        return $this->hasMany(SchoolClass::class);
    }
}
