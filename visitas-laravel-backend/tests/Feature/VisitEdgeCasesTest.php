<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class VisitEdgeCasesTest extends TestCase
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

    public function test_create_visit_when_host_has_no_company_returns_422()
    {
        // Crear dos compañías distintas: una para el host y otra para el usuario autenticado
        $host = $this->createUserWithRole('host', true); // host con compañía propia
        $reception = $this->createUserWithRole('reception', true); // usuario autenticado con otra compañía

        $this->assertNotEquals($host->company_id, $reception->company_id, 'Se requieren compañías distintas para el test');

        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $host->id,
            'visitor_name' => 'Host Company',
            'visitor_email' => 'hostcompany@example.com',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('visits', ['visitor_email' => 'hostcompany@example.com', 'company_id' => $host->company_id]);
    }

    public function test_create_visit_with_invalid_access_id_returns_422()
    {
        $reception = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $reception->id,
            'visitor_name' => 'Acceso Invalido',
            'visitor_email' => 'badaccess@example.com',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'access_id' => 999999,
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(422);
    }

    public function test_create_visit_missing_date_or_time_returns_422()
    {
        $reception = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $reception->id,
            'visitor_name' => 'Falta Fecha',
            'visitor_email' => 'nofecha@example.com',
            // missing visit_time
            'visit_date' => now()->toDateString(),
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(422);
    }

    public function test_create_visit_with_invalid_email_returns_422()
    {
        $reception = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $reception->id,
            'visitor_name' => 'Email Mal',
            'visitor_email' => 'not-an-email',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(422);
    }
}
