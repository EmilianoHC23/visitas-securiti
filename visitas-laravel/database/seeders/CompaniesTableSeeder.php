<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Company;

class CompaniesTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/companies.json'));
        $data = json_decode($json, true);

        foreach ($data as $item) {
            Company::create([
                'company_id' => $item['companyId'],
                'name' => $item['name'],
                'logo' => $item['logo'] ?? null,
                'auto_approval' => $item['settings']['autoApproval'] ?? false,
                'require_photo' => $item['settings']['requirePhoto'] ?? false,
                'enable_self_register' => $item['settings']['enableSelfRegister'] ?? false,
                'notification_email' => $item['settings']['notificationEmail'] ?? null,
                'is_active' => $item['isActive'],
                'qr_code' => $item['qrCode'],
            ]);
        }
    }
}
