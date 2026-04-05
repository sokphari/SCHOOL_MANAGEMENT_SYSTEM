<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'student_code_snapshot',
        'category',
        'subject',
        'description',
        'status',
        'priority',
        'admin_note',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}