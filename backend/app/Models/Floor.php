<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Floor extends Model
{
    protected $fillable = ['building_id', 'name', 'floor_number', 'code', 'status'];

    protected $casts = ['floor_number' => 'integer'];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class);
    }
}
