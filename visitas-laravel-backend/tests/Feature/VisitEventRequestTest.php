<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Visit;

class VisitEventRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_event_success()
    {
        $visit = Visit::factory()->create();
    $company = \App\Models\Company::factory()->create();
    $user = \App\Models\User::factory()->create(['company_id' => $company->id]);
        $this->actingAs($user, 'api');

        $response = $this->postJson("/api/visits/{$visit->id}/events", [
            'type' => 'photo',
            'photos' => ['http://example.com/p1.jpg'],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('visit_events', ['visit_id' => $visit->id, 'type' => 'photo']);
    }

    public function test_store_event_missing_type_returns_422()
    {
        $visit = Visit::factory()->create();
    $company = \App\Models\Company::factory()->create();
    $user = \App\Models\User::factory()->create(['company_id' => $company->id]);
    $this->actingAs($user, 'api');

        $response = $this->postJson("/api/visits/{$visit->id}/events", [
            'photos' => ['http://example.com/p1.jpg'],
        ]);

        $response->assertStatus(422);
    }
}
