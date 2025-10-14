<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    protected $fillable = [
        'visit_id',
        'host_id',
        'token',
        'status',
        'decision',
        'decided_at',
        'expires_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
