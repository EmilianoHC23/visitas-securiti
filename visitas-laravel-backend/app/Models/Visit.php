<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'visitor_name', 'visitor_company', 'visitor_photo', 'host_id', 'reason', 'destination', 'status', 'visit_type', 'access_code', 'access_id', 'scheduled_date', 'check_in_time', 'check_out_time', 'company_id', 'notes', 'visitor_email', 'visitor_phone'
    ];

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function access()
    {
        return $this->belongsTo(Access::class);
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class);
    }

    public function events()
    {
        return $this->hasMany(VisitEvent::class);
    }
}
