<?php

namespace Database\Factories;

use App\Models\Approval;
use App\Models\Visit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Approval>
 */
class ApprovalFactory extends Factory
{
    protected $model = Approval::class;

    public function definition(): array
    {
        $visit = Visit::factory()->create();
        $host = User::factory()->create(['company_id' => $visit->company_id]);

        return [
            'visit_id' => $visit->id,
            'host_id' => $host->id,
            'token' => Str::random(40),
            'expires_at' => now()->addDays(3),
            'status' => 'pending',
        ];
    }
}
