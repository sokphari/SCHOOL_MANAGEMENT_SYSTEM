<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentRegistrationToken extends Model
{
    protected $fillable = ['token_hash', 'issued_by', 'registration_id', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'used_at' => 'datetime'];
    }
}
