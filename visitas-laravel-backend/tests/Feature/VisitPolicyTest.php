<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class VisitPolicyTest extends TestCase
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

    public function test_reception_cannot_delete_visit_of_other_company()
    {
        $hostCompanyUser = $this->createUserWithRole('host', true);
        $otherCompanyAdmin = $this->createUserWithRole('admin', true);

        // Crear visita asociada a hostCompanyUser's company
        $visit = Visit::create([
            'host_id' => $hostCompanyUser->id,
            'visitor_name' => 'Visitante',
            'visitor_email' => 'v@example.com',
            'company_id' => $hostCompanyUser->company_id,
            'status' => 'pending',
            'scheduled_date' => now(),
        ]);

        // Usuario reception en otra compañía
        $reception = $this->createUserWithRole('reception', true);
        $this->assertNotEquals($reception->company_id, $hostCompanyUser->company_id);

        $token = JWTAuth::fromUser($reception);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson('/api/visits/'.$visit->id);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_visit()
    {
        $hostCompanyUser = $this->createUserWithRole('host', true);

        $visit = Visit::create([
            'host_id' => $hostCompanyUser->id,
            'visitor_name' => 'Visitante',
            'visitor_email' => 'v2@example.com',
            'company_id' => $hostCompanyUser->company_id,
            'status' => 'pending',
            'scheduled_date' => now(),
        ]);

        $admin = $this->createUserWithRole('admin', true);
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson('/api/visits/'.$visit->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('visits', ['id' => $visit->id]);
    }
}
