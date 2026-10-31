<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    protected $primaryKey = 'ip_address';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['ip_address', 'blocked_by', 'reason'];
}
