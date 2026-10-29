<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'description', 'status'];

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('lesson_number')->orderBy('name');
    }

    public function schoolClasses()
    {
        return $this->hasMany(SchoolClass::class);
    }
}
