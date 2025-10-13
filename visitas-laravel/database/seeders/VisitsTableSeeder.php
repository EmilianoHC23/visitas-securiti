<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Visit;
use App\Models\User;
use App\Models\Company;
use App\Models\Access;

class VisitsTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/visits.json'));
        $lines = explode("\n", trim($json));
        $data = array_map(fn($line) => json_decode($line, true), $lines);

        $userMap = User::pluck('id', 'mongo_id')->toArray();
        $companyMap = Company::pluck('id', 'company_id')->toArray();
        $accessMap = Access::pluck('id', 'access_code')->toArray();

        foreach ($data as $item) {
            Visit::create([
                'mongo_id' => $item['_id']['$oid'],
                'visitor_name' => $item['visitorName'],
                'visitor_company' => $item['visitorCompany'] ?? null,
                'visitor_photo' => $item['visitorPhoto'] ?? null,
                'host_id' => $userMap[$item['host']['$oid']] ?? null,
                'reason' => $item['reason'] ?? null,
                'status' => $item['status'] ?? 'pending',
                'visit_type' => $item['visitType'] ?? null,
                'access_code' => $item['accessCode'] ?? null,
                'access_id' => isset($item['accessId']) && $item['accessId'] ? ($accessMap[$item['accessId']] ?? null) : null,
                'scheduled_date' => isset($item['scheduledDate']['$date']) ? date('Y-m-d H:i:s', strtotime($item['scheduledDate']['$date'])) : null,
                'check_in_time' => isset($item['checkInTime']['$date']) ? date('Y-m-d H:i:s', strtotime($item['checkInTime']['$date'])) : null,
                'check_out_time' => isset($item['checkOutTime']['$date']) ? date('Y-m-d H:i:s', strtotime($item['checkOutTime']['$date'])) : null,
                'company_id' => $companyMap[$item['companyId']] ?? null,
                'notes' => $item['notes'] ?? null,
                'visitor_email' => $item['visitorEmail'] ?? null,
                'visitor_phone' => $item['visitorPhone'] ?? null,
            ]);
        }
    }
}
