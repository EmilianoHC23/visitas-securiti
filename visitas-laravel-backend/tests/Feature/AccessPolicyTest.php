<?php

namespace Tests\Feature;

use App\Models\Access;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AccessPolicyTest extends TestCase
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

    public function test_admin_can_create_access()
    {
        $admin = $this->createUserWithRole('admin');
        $token = JWTAuth::fromUser($admin);

        $payload = [
            'title' => 'Gate',
            'created_by' => $admin->id,
            'company_id' => $admin->company_id,
            'access_code' => 'AC-'.Str::random(6),
            'qr_code' => Str::random(12),
            'schedule_start_date' => now()->toDateString(),
            'schedule_end_date' => now()->addWeek()->toDateString(),
            'schedule_start_time' => '08:00',
            'schedule_end_time' => '18:00',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/accesses', $payload);

        $response->assertStatus(201);
    }

    public function test_non_admin_cannot_create_access()
    {
        $user = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($user);

        $payload = [
            'title' => 'Gate2',
            'created_by' => $user->id,
            'company_id' => $user->company_id,
            'access_code' => 'AC-'.Str::random(6),
            'qr_code' => Str::random(12),
            'schedule_start_date' => now()->toDateString(),
            'schedule_end_date' => now()->addWeek()->toDateString(),
            'schedule_start_time' => '08:00',
            'schedule_end_time' => '18:00',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/accesses', $payload);

        $response->assertStatus(403);
    }
}
