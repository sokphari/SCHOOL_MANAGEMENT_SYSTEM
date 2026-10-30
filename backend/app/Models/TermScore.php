<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TermScore extends Model
{
    use HasFactory;

    protected $fillable = ['grading_term_id', 'student_id', 'activity_score', 'exam_score'];

    protected $casts = [
        'activity_score' => 'decimal:2',
        'exam_score' => 'decimal:2',
    ];

    public function gradingTerm()
    {
        return $this->belongsTo(GradingTerm::class, 'grading_term_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
