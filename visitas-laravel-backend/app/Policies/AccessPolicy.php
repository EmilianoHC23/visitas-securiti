<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Access;
use Illuminate\Auth\Access\HandlesAuthorization;

class AccessPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Access $access)
    {
        if ($user->role === 'admin') return true;
        return $user->company_id === $access->company_id;
    }

    public function create(User $user)
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Access $access)
    {
        return $user->role === 'admin';
    }

    public function delete(User $user, Access $access)
    {
        return $user->role === 'admin';
    }
}
