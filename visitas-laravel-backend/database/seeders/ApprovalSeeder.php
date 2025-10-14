<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Approval;
use App\Models\Visit;
use App\Models\User;

class ApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $visit = Visit::first();
        $host = User::where('role', 'admin')->first();
        Approval::create([
            'visit_id' => $visit->id,
            'host_id' => $host->id,
            'token' => 'APPROVALTOKEN',
            'status' => 'pending',
            'decision' => null,
            'decided_at' => null,
            'expires_at' => now()->addHours(48),
        ]);
    }
}
