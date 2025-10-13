<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisitEvent extends Model
{
    protected $fillable = [
        'visit_id',
        'type',
        'photos',
        'timestamp',
    ];

    protected $casts = [
        'photos' => 'array',
        'timestamp' => 'datetime',
    ];
}
