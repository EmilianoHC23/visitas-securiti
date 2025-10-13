<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Access extends Model
{
    protected $fillable = [
        'title',
        'description',
        'created_by',
        'company_id',
        'auto_approval',
        'max_uses',
        'allow_guests',
        'require_approval',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'recurrence',
        'status',
        'usage_count',
        'access_code',
        'qr_code',
    ];
}