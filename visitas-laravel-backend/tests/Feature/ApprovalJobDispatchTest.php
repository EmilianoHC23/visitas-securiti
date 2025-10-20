<?php

namespace Tests\Feature;

use App\Jobs\SendApprovalEmailJob;
use App\Services\ApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class ApprovalJobDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_approval_service_dispatches_job()
    {
        Bus::fake();

        $service = new ApprovalService();

        // Ensure host user and visit exist
        $visit = \App\Models\Visit::factory()->create();

        $approval = $service->createAndSend([
            'visit_id' => $visit->id,
            'host_id' => $visit->host_id,
        ]);

        Bus::assertDispatched(SendApprovalEmailJob::class, function ($job) use ($approval) {
            return $job->approval->id === $approval->id;
        });
    }
}
