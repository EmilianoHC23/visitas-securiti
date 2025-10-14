<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Approval;
use App\Models\Visit;
use App\Models\User;

class ApprovalsTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/approvals.json'));
        $lines = explode("\n", trim($json));
        $data = array_map(fn($line) => json_decode($line, true), $lines);

        $visitMap = Visit::pluck('id', 'mongo_id')->toArray();
        $userMap = User::pluck('id', 'mongo_id')->toArray();

        foreach ($data as $item) {
            Approval::create([
                'visit_id' => $visitMap[$item['visitId']['$oid']] ?? null,
                'host_id' => $userMap[$item['hostId']['$oid']] ?? null,
                'token' => $item['token'],
                'status' => $item['status'] ?? 'pending',
                'decision' => $item['decision'] ?? null,
                'decided_at' => isset($item['decidedAt']['$date']) ? date('Y-m-d H:i:s', strtotime($item['decidedAt']['$date'])) : null,
                'expires_at' => isset($item['expiresAt']['$date']) ? date('Y-m-d H:i:s', strtotime($item['expiresAt']['$date'])) : null,
            ]);
        }
    }
}
