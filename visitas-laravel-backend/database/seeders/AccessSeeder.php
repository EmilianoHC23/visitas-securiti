<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Access;
use App\Models\User;
use App\Models\Company;

class AccessSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();
        $admin = User::where('role', 'admin')->first();
        Access::create([
            'title' => 'Acceso General',
            'description' => 'Acceso para visitantes generales',
            'created_by' => $admin->id,
            'company_id' => $company->id,
            'access_code' => 'ACC123',
            'qr_code' => 'QR_ACC123',
            'auto_approval' => true,
            'max_uses' => 10,
            'allow_guests' => false,
            'require_approval' => false,
            'schedule_start_date' => now()->toDateString(),
            'schedule_end_date' => now()->addMonth()->toDateString(),
            'schedule_start_time' => '08:00',
            'schedule_end_time' => '18:00',
            'schedule_recurrence' => 'none',
            'status' => 'active',
            'usage_count' => 0,
        ]);
    }
}
