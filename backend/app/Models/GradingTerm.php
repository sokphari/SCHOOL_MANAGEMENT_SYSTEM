<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradingTerm extends Model
{
    use HasFactory;

    protected $fillable = ['school_class_id', 'name', 'start_date', 'end_date'];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function scores()
    {
        return $this->hasMany(TermScore::class, 'grading_term_id');
    }
}
