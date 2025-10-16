<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Company;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visit>
 */
class VisitFactory extends Factory
{
    public function definition(): array
    {
        // ensure there is at least one company and a host user linked to it
        $company = Company::create([
            'name' => 'Fac '.Str::random(4),
            'qr_code' => Str::random(12),
            'notification_email' => 'notify@example.com',
        ]);
        $host = User::factory()->create(['company_id' => $company->id]);

        return [
            'visitor_name' => $this->faker->name(),
            'visitor_email' => $this->faker->safeEmail(),
            'host_id' => $host->id,
            'company_id' => $company->id,
            'scheduled_date' => now()->toDateTimeString(),
            'status' => 'pending',
        ];
    }
}
