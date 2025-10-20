<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CompanyFactory extends Factory
{
    protected $model = \App\Models\Company::class;

    public function definition()
    {
        return [
            'name' => $this->faker->company(),
            'logo' => null,
            'auto_approval' => false,
            'require_photo' => true,
            'enable_self_register' => true,
            'notification_email' => $this->faker->companyEmail(),
            'qr_code' => Str::random(8),
            'is_active' => true,
        ];
    }
}
