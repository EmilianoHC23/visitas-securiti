<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'logo',
        'auto_approval',
        'require_photo',
        'enable_self_register',
        'notification_email',
        'is_active',
        'qr_code',
    ];
}