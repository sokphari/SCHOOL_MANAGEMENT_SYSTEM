<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassScheduleTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'days', 'starts_at', 'ends_at', 'status'];

    protected $casts = ['days' => 'array'];
}
