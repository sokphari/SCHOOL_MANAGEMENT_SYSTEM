<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleModulePermission extends Model
{
    protected $fillable = ['role', 'module', 'allowed'];

    protected function casts(): array
    {
        return ['allowed' => 'boolean'];
    }
}
