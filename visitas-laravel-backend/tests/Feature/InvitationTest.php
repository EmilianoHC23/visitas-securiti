<?php

namespace Tests\Feature;

use App\Models\Invitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_accept_invitation_with_valid_token()
    {
        $invitation = \App\Models\Invitation::factory()->create(['invitation_token' => 'valid-token-123', 'expires_at' => now()->addDay()]);

        $response = $this->postJson('/api/invitations/valid-token-123/accept');
        $response->assertStatus(200)->assertJsonFragment(['message' => 'Invitation accepted']);

        $this->assertDatabaseHas('invitations', ['invitation_token' => 'valid-token-123', 'status' => 'accepted']);
    }

    public function test_accept_invitation_with_expired_token()
    {
        $invitation = \App\Models\Invitation::factory()->create(['invitation_token' => 'expired-token-123', 'expires_at' => now()->subDay()]);

        $response = $this->postJson('/api/invitations/expired-token-123/accept');
        $response->assertStatus(410)->assertJsonFragment(['message' => 'Invitation expired']);
    }
}
