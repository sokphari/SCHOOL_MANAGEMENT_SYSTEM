<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentRegistration extends Model
{
    protected $fillable = [
        'first_name', 'last_name', 'gender', 'date_of_birth', 'phone', 'email',
        'address', 'guardian_name', 'guardian_phone', 'status', 'review_note',
        'student_id', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date:Y-m-d', 'reviewed_at' => 'datetime'];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
