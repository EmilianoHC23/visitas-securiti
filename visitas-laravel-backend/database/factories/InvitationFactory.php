<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Invitation>
 */
class InvitationFactory extends Factory
{
    protected $model = \App\Models\Invitation::class;

    public function definition(): array
    {
        $company = Company::factory()->create();
        $inviter = User::factory()->create(['company_id' => $company->id]);

        return [
            'email' => $this->faker->unique()->safeEmail(),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'role' => 'host',
            'invited_by' => $inviter->id,
            'company_id' => $company->id,
            'invitation_token' => Str::random(40),
            'expires_at' => now()->addDays(7),
            'status' => 'pending',
        ];
    }
}
