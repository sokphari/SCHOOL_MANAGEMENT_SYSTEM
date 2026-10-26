<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    protected $fillable = ['name', 'code', 'description', 'status'];

    public function floors()
    {
        return $this->hasMany(Floor::class);
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class);
    }
}
