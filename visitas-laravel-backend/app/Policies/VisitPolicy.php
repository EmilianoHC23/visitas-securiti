<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visit;
use Illuminate\Auth\Access\HandlesAuthorization;

class VisitPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the visit.
     */
    public function view(User $user, Visit $visit)
    {
        if ($user->role === 'admin') return true;
        if ($user->id === $visit->host_id) return true;
        if (!empty($user->company_id) && $user->company_id === $visit->company_id) return true;
        return false;
    }

    /**
     * Determine whether the user can create visits.
     */
    public function create(User $user)
    {
        return in_array($user->role, ['admin', 'reception']) && !empty($user->company_id);
    }

    /**
     * Determine whether the user can update the visit.
     */
    public function update(User $user, Visit $visit)
    {
        if ($user->role === 'admin') return true;
        if (!empty($user->company_id) && $user->company_id === $visit->company_id && in_array($user->role, ['admin', 'reception'])) return true;
        if ($user->id === $visit->host_id) return true; // host can update their own visit
        return false;
    }

    /**
     * Determine whether the user can delete the visit.
     */
    public function delete(User $user, Visit $visit)
    {
        return $user->role === 'admin';
    }
}
