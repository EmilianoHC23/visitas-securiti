<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccessInvitedEmail extends Model
{
    use HasFactory;

    protected $fillable = [
        'access_id', 'email', 'sent_at', 'status'
    ];

    public function access()
    {
        return $this->belongsTo(Access::class);
    }
}
