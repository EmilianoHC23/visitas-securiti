<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Company;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected function createUserWithRole($role)
    {
        $company = Company::create([
            'name' => 'RCo '.Str::random(4),
            'qr_code' => Str::random(12),
            'notification_email' => 'notify@example.com',
        ]);

        return User::factory()->create([
            'role' => $role,
            'company_id' => $company->id,
        ]);
    }

    public function test_visits_by_date_returns_counts()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        // create visits on two dates
        Visit::factory()->count(2)->create(['scheduled_date' => now()->toDateString().' 10:00:00']);
        Visit::factory()->count(3)->create(['scheduled_date' => now()->addDay()->toDateString().' 11:00:00']);

        $response = $this->withHeader('Authorization', "Bearer $token")->getJson('/api/reports/visits-by-date');
        $response->assertStatus(200);
        $json = $response->json();
        $this->assertCount(2, $json);
    }

    public function test_visits_by_company_returns_counts()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        // create visits for two companies
        $companyA = Company::create(['name' => 'A','qr_code' => Str::random(8),'notification_email' => 'a@example.com']);
        $companyB = Company::create(['name' => 'B','qr_code' => Str::random(8),'notification_email' => 'b@example.com']);

        Visit::factory()->count(4)->create(['company_id' => $companyA->id]);
        Visit::factory()->count(1)->create(['company_id' => $companyB->id]);

        $response = $this->withHeader('Authorization', "Bearer $token")->getJson('/api/reports/visits-by-company');
        $response->assertStatus(200);
        $json = $response->json();
        $this->assertCount(2, $json);
    }

    public function test_visits_by_status_returns_counts()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        Visit::factory()->count(2)->create(['status' => 'pending']);
        Visit::factory()->count(1)->create(['status' => 'approved']);

        $response = $this->withHeader('Authorization', "Bearer $token")->getJson('/api/reports/visits-by-status');
        $response->assertStatus(200);
        $json = $response->json();
        $this->assertGreaterThanOrEqual(2, count($json));
    }

    public function test_visits_by_company_filters_by_status()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        $companyA = Company::create(['name' => 'A','qr_code' => Str::random(8),'notification_email' => 'a@example.com']);
        $companyB = Company::create(['name' => 'B','qr_code' => Str::random(8),'notification_email' => 'b@example.com']);

        // company A: 3 pending, 1 approved
        Visit::factory()->count(3)->create(['company_id' => $companyA->id, 'status' => 'pending']);
        Visit::factory()->count(1)->create(['company_id' => $companyA->id, 'status' => 'approved']);

        // company B: 2 pending
        Visit::factory()->count(2)->create(['company_id' => $companyB->id, 'status' => 'pending']);

        $response = $this->withHeader('Authorization', "Bearer $token")->getJson('/api/reports/visits-by-company?status=pending');
        $response->assertStatus(200);
        $json = $response->json();

        // both companies should appear with only pending counts
        $this->assertCount(2, $json);

        $a = collect($json)->firstWhere('company_id', $companyA->id);
        $this->assertEquals(3, $a['total']);
    }
}
