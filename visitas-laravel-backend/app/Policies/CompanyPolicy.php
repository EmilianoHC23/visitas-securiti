<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Company;
use Illuminate\Auth\Access\HandlesAuthorization;

class CompanyPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Company $company)
    {
        if ($user->role === 'admin') return true;
        return $user->company_id === $company->id;
    }

    public function create(User $user)
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Company $company)
    {
        return $user->role === 'admin';
    }

    public function delete(User $user, Company $company)
    {
        return $user->role === 'admin';
    }
}
