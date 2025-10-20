<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visit>
 */
class VisitFactory extends Factory
{
    protected $model = \App\Models\Visit::class;

    public function definition(): array
    {
        // create related company and host when not provided
        $company = Company::factory()->create();
        $host = User::factory()->create(['company_id' => $company->id]);

        return [
            'visitor_name' => $this->faker->name(),
            'visitor_company' => $this->faker->company(),
            'visitor_photo' => null,
            'host_id' => $host->id,
            'reason' => $this->faker->sentence(),
            'destination' => 'Lobby',
            'status' => 'pending',
            'visit_type' => 'scheduled',
            'scheduled_date' => now()->addHour(),
            'company_id' => $company->id,
        ];
    }
}
