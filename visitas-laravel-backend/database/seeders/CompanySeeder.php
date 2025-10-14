<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        Company::create([
            'name' => 'SecurITI',
            'logo' => null,
            'auto_approval' => true,
            'require_photo' => true,
            'enable_self_register' => true,
            'notification_email' => 'admin@securiti.com',
            'qr_code' => 'QR_SEC_001',
            'is_active' => true,
        ]);
    }
}
