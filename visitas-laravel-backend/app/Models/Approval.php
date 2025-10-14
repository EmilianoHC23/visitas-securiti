<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'visit_id', 'host_id', 'token', 'status', 'decision', 'decided_at', 'expires_at'
    ];

    public function visit()
    {
        return $this->belongsTo(Visit::class);
    }

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }
}
