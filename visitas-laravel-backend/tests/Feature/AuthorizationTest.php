<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function createUserWithRole($role)
    {
        // crear una compañía para cumplir la FK company_id NOT NULL
        $company = Company::create([
            'name' => 'FactoryCo '.Str::random(4),
            'qr_code' => Str::random(12),
        ]);

        return User::factory()->create([
            'role' => $role,
            'company_id' => $company->id,
        ]);
    }

    public function test_admin_can_create_company()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/companies', [
                'name' => 'TestCo',
                'notification_email' => 'test@testco.com',
                'is_active' => true,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('companies', ['name' => 'TestCo']);
    }

    public function test_non_admin_cannot_create_company()
    {
        $user = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/companies', [
                'name' => 'ForbiddenCo',
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('companies', ['name' => 'ForbiddenCo']);
    }

    public function test_admin_can_create_user()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        $payload = [
            'email' => 'newuser@example.com',
            'password' => 'secret123',
            'first_name' => 'New',
            'last_name' => 'User',
            'role' => 'reception',
            'company_id' => $admin->company_id,
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/users', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
    }

    public function test_non_admin_cannot_create_user()
    {
        $user = $this->createUserWithRole('host');
        $token = JWTAuth::fromUser($user);

        $payload = [
            'email' => 'otheruser@example.com',
            'password' => 'secret123',
            'first_name' => 'Other',
            'last_name' => 'User',
            'role' => 'reception',
            'company_id' => $user->company_id,
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/users', $payload);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'otheruser@example.com']);
    }

    public function test_admin_can_create_access()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        $payload = [
            'title' => 'Main Gate',
            'created_by' => $admin->id,
            'company_id' => $admin->company_id,
            'access_code' => 'AC-' . Str::random(6),
            'qr_code' => Str::random(12),
            'schedule_start_date' => now()->toDateString(),
            'schedule_end_date' => now()->addWeek()->toDateString(),
            'schedule_start_time' => '08:00',
            'schedule_end_time' => '18:00',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/accesses', $payload);

        $response->assertStatus(201);
    $this->assertDatabaseHas('accesses', ['title' => 'Main Gate']);
    }

    public function test_non_admin_cannot_create_access()
    {
        $user = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($user);

        $payload = [
            'title' => 'Side Gate',
            'created_by' => $user->id,
            'company_id' => $user->company_id,
            'access_code' => 'AC-' . Str::random(6),
            'qr_code' => Str::random(12),
            'schedule_start_date' => now()->toDateString(),
            'schedule_end_date' => now()->addWeek()->toDateString(),
            'schedule_start_time' => '08:00',
            'schedule_end_time' => '18:00',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/accesses', $payload);

        $response->assertStatus(403);
    $this->assertDatabaseMissing('accesses', ['title' => 'Side Gate']);
    }

    public function test_reception_can_create_visit()
    {
        $reception = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $reception->id,
            'visitor_name' => 'Juan Pérez',
            'visitor_email' => 'juan@example.com',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('visits', ['visitor_email' => 'juan@example.com']);
    }

    public function test_guest_cannot_create_visit()
    {
        $guest = $this->createUserWithRole('host'); // use host as guest-like if no guest role
        $token = JWTAuth::fromUser($guest);

        $payload = [
            'host_id' => $guest->id,
            'visitor_name' => 'Invitado',
            'visitor_email' => 'invitado@example.com',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'status' => 'pending',
        ];

        // According to VisitPolicy, only admin and reception can create visits.
        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(403);
    }
}
