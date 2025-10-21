<?php

namespace Tests\Feature;

use App\Jobs\SendInvitationEmailJob;
use App\Services\InvitationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class InvitationJobDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_invitation_service_dispatches_job()
    {
        Bus::fake();

        $service = new InvitationService();

        // Ensure company exists to satisfy FK
    \App\Models\Company::factory()->create();

        // create an inviter user to satisfy invited_by FK
    $inviter = \App\Models\User::factory()->create(['company_id' => 1]);

        $invitation = $service->createAndSend([
            'email' => 'dispatch@example.com',
            'company_id' => 1,
            'first_name' => 'Dispatch',
            'last_name' => 'User',
            'role' => 'host',
            'invited_by' => $inviter->id,
        ]);

        Bus::assertDispatched(SendInvitationEmailJob::class, function ($job) use ($invitation) {
            return $job->invitation->id === $invitation->id;
        });
    }
}
