<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Visit;
use App\Models\Access;
use App\Models\Invitation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class IntegrationSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_auth_login_and_me()
    {
        $company = Company::factory()->create();
        $user = User::factory()->create(['role' => 'admin', 'company_id' => $company->id, 'password' => bcrypt('password')]);

        $resp = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password']);
        $resp->assertStatus(200);
        $this->assertArrayHasKey('token', $resp->json() ?? []);

        $token = $resp->json('token') ?? $resp->json('access_token') ?? null;
        $this->assertNotNull($token);

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_create_visit_and_actions()
    {
        $company = Company::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'company_id' => $company->id, 'password' => bcrypt('password')]);
        // Create an Access record directly (no factory present)
        $access = Access::create([
            'title' => 'Test Access',
            'description' => 'For tests',
            'created_by' => $admin->id,
            'company_id' => $company->id,
            'access_code' => 'AC-123',
            'qr_code' => 'AC-QR-123',
            'auto_approval' => false,
            'max_uses' => 1,
            'allow_guests' => true,
            'require_approval' => false,
            'schedule_start_date' => now()->toDateString(),
            'schedule_end_date' => now()->addDay()->toDateString(),
            'schedule_start_time' => '00:00',
            'schedule_end_time' => '23:59',
            'status' => 'active',
            'usage_count' => 0,
        ]);

        $login = $this->postJson('/api/auth/login', ['email' => $admin->email, 'password' => 'password']);
        $token = $login->json('token') ?? $login->json('access_token');

        $payload = [
            'host_id' => $admin->id,
            'access_id' => $access->id,
            'visitor_name' => 'Visitor One',
            'visitor_email' => 'visitor@example.com',
            'company_id' => $company->id,
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
        ];

        $create = $this->withHeader('Authorization', "Bearer $token")->postJson('/api/visits', $payload);
        $create->assertStatus(201);
        $visitId = $create->json('id');

        // Checkin
        $this->withHeader('Authorization', "Bearer $token")->postJson("/api/visits/checkin/{$visitId}")
            ->assertStatus(200);

        // Checkout
        $this->withHeader('Authorization', "Bearer $token")->postJson("/api/visits/checkout/{$visitId}")
            ->assertStatus(200);
    }

    public function test_scan_qr_and_public_visit()
    {
    $company = Company::factory()->create(['qr_code' => 'COMPANY-QR-123']);
    $visit = Visit::factory()->create(['company_id' => $company->id]);

    // Prepare an admin to authenticate for protected scan-qr
    $admin = User::factory()->create(['role' => 'admin', 'company_id' => $company->id, 'password' => bcrypt('password')]);

    // scan-qr should return either a visit or company info. scan-qr is protected, send token
    $login = $this->postJson('/api/auth/login', ['email' => $admin->email, 'password' => 'password']);
        $token = $login->json('token') ?? $login->json('access_token');
        $this->withHeader('Authorization', "Bearer $token")->postJson('/api/visits/scan-qr', ['code' => $company->qr_code])
            ->assertStatus(200);

        // public visit creation
        $payload = [
            'host_id' => $admin->id,
            'visitor_name' => 'Public User',
            'visitor_email' => 'public@example.com',
            'first_name' => 'Public',
            'last_name' => 'User',
            'company_id' => $company->id,
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
        ];
        $this->postJson('/api/public/visit', $payload)->assertStatus(201);
    }

    public function test_invitations_flow()
    {
        $company = Company::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'company_id' => $company->id, 'password' => bcrypt('password')]);

        $login = $this->postJson('/api/auth/login', ['email' => $admin->email, 'password' => 'password']);
        $token = $login->json('token') ?? $login->json('access_token');

        $payload = [
            'email' => 'invitee@example.com',
            'first_name' => 'Invite',
            'last_name' => 'Person',
            'role' => 'host',
            'company_id' => $company->id,
        ];

        $create = $this->withHeader('Authorization', "Bearer $token")->postJson('/api/invitations', $payload);
        $create->assertStatus(201);
        $invitation = $create->json();

        // verify public token
        $this->getJson('/api/invitations/verify/' . $invitation['invitation_token'])->assertStatus(200);

        // complete (public) should call accept flow (we expect 200)
        $this->postJson('/api/invitations/complete', ['token' => $invitation['invitation_token']])->assertStatus(200);
    }
}
