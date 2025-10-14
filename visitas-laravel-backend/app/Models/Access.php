<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Access extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'created_by', 'company_id', 'access_code', 'qr_code', 'auto_approval', 'max_uses', 'allow_guests', 'require_approval', 'schedule_start_date', 'schedule_end_date', 'schedule_start_time', 'schedule_end_time', 'schedule_recurrence', 'status', 'usage_count'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function invitedEmails()
    {
        return $this->hasMany(AccessInvitedEmail::class);
    }

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }
}
