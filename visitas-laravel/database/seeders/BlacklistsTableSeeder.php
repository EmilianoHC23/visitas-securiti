<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Blacklist;
use App\Models\User;
use App\Models\Company;

class BlacklistsTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/blacklists.json'));
        $lines = explode("\n", trim($json));
        $data = array_map(fn($line) => json_decode($line, true), $lines);

        $userMap = User::pluck('id', 'mongo_id')->toArray();
        $companyMap = Company::pluck('id', 'company_id')->toArray();

        foreach ($data as $item) {
            Blacklist::create([
                'identifier_type' => $item['identifierType'] ?? 'email',
                'identifier' => $item['identifier'],
                'email' => $item['email'] ?? null,
                'name' => $item['name'] ?? null,
                'reason' => $item['reason'] ?? null,
                'notes' => $item['notes'] ?? null,
                'added_by' => $userMap[$item['addedBy']['$oid']] ?? null,
                'company_id' => $companyMap[$item['companyId']] ?? null,
                'is_active' => $item['isActive'] ?? true,
            ]);
        }
    }
}
