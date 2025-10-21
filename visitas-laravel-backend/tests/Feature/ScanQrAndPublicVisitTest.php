<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Visit;
use App\Models\Company;

class ScanQrAndPublicVisitTest extends TestCase
{
    use RefreshDatabase;

    public function test_scan_qr_returns_visit()
    {
    $company = Company::factory()->create(['qr_code' => 'token-123']);
    $user = \App\Models\User::factory()->create(['company_id' => $company->id]);
    $this->actingAs($user, 'api');

    $response = $this->postJson('/api/visits/scan-qr', ['qrToken' => 'token-123']);
    $response->assertStatus(200)->assertJsonPath('company.id', $company->id);
    }

    public function test_public_visit_registration_creates_visit()
    {
        $company = Company::factory()->create();
        $host = \App\Models\User::factory()->create(['company_id' => $company->id]);

        $payload = [
            'host_id' => $host->id,
            'visitor_name' => 'Invitado',
            'visitor_email' => 'guest@example.com',
            'scheduled_date' => now()->addDay()->toDateTimeString(),
        ];

        $response = $this->postJson('/api/public/visit', $payload);
        $response->assertStatus(201);
        $this->assertDatabaseHas('visits', ['visitor_email' => 'guest@example.com']);
    }
}
