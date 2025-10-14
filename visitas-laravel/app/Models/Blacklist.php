<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Blacklist extends Model
{
    protected $fillable = [
        'identifier_type',
        'identifier',
        'email',
        'name',
        'reason',
        'notes',
        'added_by',
        'company_id',
        'is_active',
    ];
}
