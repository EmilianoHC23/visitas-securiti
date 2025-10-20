<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisitEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'visit_id', 'type', 'photos', 'timestamp'
    ];

    protected $casts = [
        'photos' => 'array',
        'timestamp' => 'datetime',
    ];

    public function visit()
    {
        return $this->belongsTo(Visit::class);
    }
}
