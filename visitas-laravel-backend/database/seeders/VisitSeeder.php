<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Visit;
use App\Models\User;
use App\Models\Company;

class VisitSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();
        $host = User::where('role', 'admin')->first();
        Visit::create([
            'visitor_name' => 'Juan Pérez',
            'visitor_company' => 'Empresa X',
            'visitor_photo' => null,
            'host_id' => $host->id,
            'reason' => 'Reunión de negocios',
            'destination' => 'SecurITI',
            'status' => 'approved',
            'visit_type' => 'spontaneous',
            'access_code' => null,
            'access_id' => null,
            'scheduled_date' => now(),
            'check_in_time' => null,
            'check_out_time' => null,
            'company_id' => $company->id,
            'notes' => null,
            'visitor_email' => 'juan.perez@empresax.com',
            'visitor_phone' => '555-1234',
        ]);
    }
}
