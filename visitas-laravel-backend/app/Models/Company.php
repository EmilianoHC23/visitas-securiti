<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'logo', 'auto_approval', 'require_photo', 'enable_self_register', 'notification_email', 'qr_code', 'is_active'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    public function invitations()
    {
        return $this->hasMany(Invitation::class);
    }

    public function accesses()
    {
        return $this->hasMany(Access::class);
    }

    public function blacklists()
    {
        return $this->hasMany(Blacklist::class);
    }
}
