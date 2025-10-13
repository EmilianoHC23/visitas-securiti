<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Access;
use App\Models\User;
use App\Models\Company;

class AccessesTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/accesses.json'));
        $data = json_decode($json, true);

    // Mapear mongo_id de users a id real
    $userMap = User::pluck('id', 'mongo_id')->toArray();
    // Mapear company_id lógico a id real
    $companyMap = Company::pluck('id', 'company_id')->toArray();

        foreach ($data as $item) {
            Access::create([
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'created_by' => $userMap[$item['createdBy']['$oid']] ?? null,
                'company_id' => $companyMap[$item['companyId']] ?? null,
                'auto_approval' => $item['settings']['autoApproval'] ?? false,
                'max_uses' => $item['settings']['maxUses'] ?? null,
                'allow_guests' => $item['settings']['allowGuests'] ?? false,
                'require_approval' => $item['settings']['requireApproval'] ?? false,
                'start_date' => isset($item['schedule']['startDate']['$date']) ? date('Y-m-d H:i:s', strtotime($item['schedule']['startDate']['$date'])) : null,
                'end_date' => isset($item['schedule']['endDate']['$date']) ? date('Y-m-d H:i:s', strtotime($item['schedule']['endDate']['$date'])) : null,
                'start_time' => $item['schedule']['startTime'] ?? null,
                'end_time' => $item['schedule']['endTime'] ?? null,
                'recurrence' => $item['schedule']['recurrence'] ?? null,
                'status' => $item['status'] ?? 'active',
                'usage_count' => $item['usageCount'] ?? 0,
                'access_code' => $item['accessCode'],
                'qr_code' => $item['qrCode'],
            ]);
        }
    }
}
