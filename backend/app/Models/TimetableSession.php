<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimetableSession extends Model
{
    use HasFactory;

    protected $fillable = ['school_class_id', 'day_of_week', 'starts_at', 'ends_at'];

    protected $casts = ['day_of_week' => 'integer'];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }
}
