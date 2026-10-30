<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleFeaturePermission extends Model
{
    protected $fillable = ['role', 'module', 'feature', 'allowed'];

    protected function casts(): array
    {
        return ['allowed' => 'boolean'];
    }
}
