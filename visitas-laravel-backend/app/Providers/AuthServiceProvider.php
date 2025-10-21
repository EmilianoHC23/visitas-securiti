<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Visit;
use App\Models\Company;
use App\Models\Access;
use App\Policies\VisitPolicy;
use App\Policies\CompanyPolicy;
use App\Policies\AccessPolicy;
use App\Policies\InvitationPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Visit::class => VisitPolicy::class,
        Company::class => CompanyPolicy::class,
        Access::class => AccessPolicy::class,
        \App\Models\Invitation::class => InvitationPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
