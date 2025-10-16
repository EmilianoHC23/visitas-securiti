<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\VisitCreated;
use App\Mail\VisitApproved;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class VisitMailTest extends TestCase
{
    use RefreshDatabase;

    protected function createUserWithRole($role)
    {
        $company = Company::create([
            'name' => 'FactoryCo '.Str::random(4),
            'qr_code' => Str::random(12),
            'notification_email' => 'notify@example.com',
        ]);

        return User::factory()->create([
            'role' => $role,
            'company_id' => $company->id,
        ]);
    }

    public function test_visit_created_sends_email_to_company()
    {
    Mail::fake();

        $reception = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $reception->id,
            'visitor_name' => 'Mailer Test',
            'visitor_email' => 'mailer@example.com',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $response->assertStatus(201);

        Mail::assertQueued(VisitCreated::class, function ($mail) {
            return $mail->hasTo('notify@example.com');
        });
    }

    public function test_visit_approval_sends_email_to_visitor()
    {
    Mail::fake();

        $reception = $this->createUserWithRole('reception');
        $token = JWTAuth::fromUser($reception);

        $payload = [
            'host_id' => $reception->id,
            'visitor_name' => 'Mailer Test 2',
            'visitor_email' => 'visitor@example.com',
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i'),
            'status' => 'pending',
        ];

        $create = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/visits', $payload);

        $create->assertStatus(201);
        $visitId = $create->json('id');

        $approve = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/visits/'.$visitId, ['status' => 'approved']);

        $approve->assertStatus(200);

        Mail::assertQueued(VisitApproved::class, function ($mail) {
            return $mail->hasTo('visitor@example.com');
        });
    }
}
