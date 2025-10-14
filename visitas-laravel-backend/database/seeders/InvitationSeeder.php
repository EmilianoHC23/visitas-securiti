<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Company;

class InvitationSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();
        $admin = User::where('role', 'admin')->first();
        Invitation::create([
            'email' => 'nuevo@securiti.com',
            'first_name' => 'Nuevo',
            'last_name' => 'Usuario',
            'role' => 'host',
            'invited_by' => $admin->id,
            'company_id' => $company->id,
            'invitation_token' => 'TOKEN123',
            'expires_at' => now()->addDays(7),
            'status' => 'pending',
            'accepted_at' => null,
        ]);
    }
}
