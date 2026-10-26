<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = ['floor_id', 'name', 'room_type', 'code', 'capacity', 'status'];

    protected $casts = ['capacity' => 'integer'];

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class);
    }
}
