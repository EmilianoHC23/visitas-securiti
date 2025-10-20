<?php

namespace Tests\Feature;

use App\Models\Approval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_approval_decision_with_valid_token()
    {
        $approval = \Database\Factories\ApprovalFactory::new()->create(['token' => 'approval-token-123', 'expires_at' => now()->addDay()]);

        $response = $this->postJson('/api/approvals/approval-token-123/decision', ['decision' => 'approved']);
        $response->assertStatus(200)->assertJsonFragment(['message' => 'Decision recorded']);

        $this->assertDatabaseHas('approvals', ['token' => 'approval-token-123', 'status' => 'approved']);
    }

    public function test_approval_decision_with_invalid_token()
    {
        $response = $this->postJson('/api/approvals/invalid-token/decision', ['decision' => 'rejected']);
        $response->assertStatus(404);
    }
}
