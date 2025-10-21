<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Invitation;
use Illuminate\Auth\Access\HandlesAuthorization;

class InvitationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any invitations.
     */
    public function viewAny(User $user)
    {
        return $user->role === 'admin' || (property_exists($user, 'is_company_admin') && $user->is_company_admin);
    }

    /**
     * Determine whether the user can create invitations.
     */
    public function create(User $user)
    {
        return $user->role === 'admin' || (property_exists($user, 'is_company_admin') && $user->is_company_admin);
    }

    /**
     * Determine whether the user can delete the invitation.
     */
    public function delete(User $user, Invitation $invitation)
    {
        if ($user->role === 'admin') return true;
        return property_exists($user, 'company_id') && $user->company_id === $invitation->company_id;
    }
}
