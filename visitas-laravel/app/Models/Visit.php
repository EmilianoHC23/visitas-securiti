<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    protected $fillable = [
        'visitor_name',
        'visitor_company',
        'visitor_photo',
        'host_id',
        'reason',
        'status',
        'visit_type',
        'access_code',
        'access_id',
        'scheduled_date',
        'check_in_time',
        'check_out_time',
        'company_id',
        'notes',
        'visitor_email',
        'visitor_phone',
    ];
}
