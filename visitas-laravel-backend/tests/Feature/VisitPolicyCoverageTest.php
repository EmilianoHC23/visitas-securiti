<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class VisitPolicyCoverageTest extends TestCase
{
    use RefreshDatabase;

    protected function createUserWithRole($role, $withCompany = true)
    {
        $companyId = null;
        if ($withCompany) {
            $company = Company::create([
                'name' => 'FactoryCo '.Str::random(4),
                'qr_code' => Str::random(12),
            ]);
            $companyId = $company->id;
        }

        return User::factory()->create([
            'role' => $role,
            'company_id' => $companyId,
        ]);
    }

    public function test_reception_can_view_and_update_visits_in_own_company()
    {
        $companyUser = $this->createUserWithRole('host', true);
        $visit = Visit::create([
            'host_id' => $companyUser->id,
            'visitor_name' => 'ViewUpdate',
            'visitor_email' => 'vu@example.com',
            'company_id' => $companyUser->company_id,
            'status' => 'pending',
            'scheduled_date' => now(),
        ]);

        $reception = $this->createUserWithRole('reception', true);
        // ensure same company
        $reception->company_id = $companyUser->company_id;
        $reception->save();

        $token = JWTAuth::fromUser($reception);

        $view = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/visits/'.$visit->id);
        $view->assertStatus(200);

        $update = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/visits/'.$visit->id, ['status' => 'approved']);
        $update->assertStatus(200);
        $this->assertDatabaseHas('visits', ['id' => $visit->id, 'status' => 'approved']);
    }

    public function test_host_can_update_own_visit_but_not_other_companies()
    {
        $host = $this->createUserWithRole('host', true);
        $visit = Visit::create([
            'host_id' => $host->id,
            'visitor_name' => 'HostOwn',
            'visitor_email' => 'hostown@example.com',
            'company_id' => $host->company_id,
            'status' => 'pending',
            'scheduled_date' => now(),
        ]);

        $token = JWTAuth::fromUser($host);
        $updateOwn = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/visits/'.$visit->id, ['status' => 'approved']);
        $updateOwn->assertStatus(200);

        // host from other company
        $otherHost = $this->createUserWithRole('host', true);
        $this->assertNotEquals($host->company_id, $otherHost->company_id);
        $token2 = JWTAuth::fromUser($otherHost);

        $updateOther = $this->withHeader('Authorization', "Bearer $token2")
            ->putJson('/api/visits/'.$visit->id, ['status' => 'rejected']);
        $updateOther->assertStatus(403);
    }
}
