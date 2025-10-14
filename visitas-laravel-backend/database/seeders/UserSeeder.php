<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Company;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();
        User::create([
            'email' => 'admin@securiti.com',
            'password' => Hash::make('password'),
            'first_name' => 'Admin',
            'last_name' => 'Principal',
            'role' => 'admin',
            'company_id' => $company->id,
            'profile_image' => null,
            'is_active' => true,
            'invitation_status' => 'registered',
        ]);
    }
}
