<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffAccountRegistration extends Model
{
    protected $fillable = [
        'name', 'email', 'password', 'ip_address', 'status', 'expires_at',
        'reviewed_by', 'reviewed_at', 'review_note',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }
}
