<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CompanyPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function createUserWithRole($role)
    {
        $company = Company::create([
            'name' => 'FactoryCo '.Str::random(4),
            'qr_code' => Str::random(12),
        ]);

        return User::factory()->create([
            'role' => $role,
            'company_id' => $company->id,
        ]);
    }

    public function test_admin_can_create_and_delete_company()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/companies', [
                'name' => 'NewCo',
                'notification_email' => 'n@example.com',
            ]);

        $response->assertStatus(201);
        $companyId = $response->json('id');

        $del = $this->withHeader('Authorization', "Bearer $token")
            ->deleteJson('/api/companies/'.$companyId);

        $del->assertStatus(200);
    }

    public function test_non_admin_cannot_create_company()
    {
        $user = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/companies', [
                'name' => 'BlockedCo'
            ]);

        $response->assertStatus(403);
    }
}
