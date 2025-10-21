<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InvitationPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_create_invitation()
    {
    $company = Company::factory()->create();
    $user = User::factory()->create(['role' => 'reception', 'company_id' => $company->id]);

        $payload = [
            'email' => 'invitee@example.com',
            'company_id' => $company->id,
            'first_name' => 'Invite',
            'last_name' => 'Person',
            'role' => 'host',
            'invited_by' => $user->id,
        ];

        $this->actingAs($user, 'api')
            ->postJson('/api/invitations', $payload)
            ->assertStatus(403);
    }

    public function test_admin_can_create_invitation()
    {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['role' => 'admin', 'company_id' => $company->id]);

        $payload = [
            'email' => 'invitee@example.com',
            'company_id' => $company->id,
            'first_name' => 'Invite',
            'last_name' => 'Person',
            'role' => 'host',
            'invited_by' => $admin->id,
        ];

        $this->actingAs($admin, 'api')
            ->postJson('/api/invitations', $payload)
            ->assertStatus(201)
            ->assertJsonFragment(['email' => 'invitee@example.com']);
    }
}
