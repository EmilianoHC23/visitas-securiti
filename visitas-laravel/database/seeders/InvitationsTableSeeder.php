<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Company;

class InvitationsTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/invitations.json'));
        $lines = explode("\n", trim($json));
        $data = array_map(fn($line) => json_decode($line, true), $lines);

        $userMap = User::pluck('id', 'mongo_id')->toArray();
        $companyMap = Company::pluck('id', 'company_id')->toArray();

        foreach ($data as $item) {
            Invitation::create([
                'email' => $item['email'],
                'first_name' => $item['firstName'],
                'last_name' => $item['lastName'],
                'role' => $item['role'],
                'invited_by' => $userMap[$item['invitedBy']['$oid']] ?? null,
                'company_id' => $companyMap[$item['companyId']] ?? null,
                'invitation_token' => $item['invitationToken'],
                'status' => $item['status'] ?? 'pending',
                'expires_at' => isset($item['expiresAt']['$date']) ? date('Y-m-d H:i:s', strtotime($item['expiresAt']['$date'])) : null,
            ]);
        }
    }
}
