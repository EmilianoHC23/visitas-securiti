<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Blacklist;
use App\Models\User;
use App\Models\Company;

class BlacklistSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();
        $admin = User::where('role', 'admin')->first();
        Blacklist::create([
            'identifier_type' => 'email',
            'identifier' => 'malicioso@correo.com',
            'email' => 'malicioso@correo.com',
            'name' => 'Usuario Malicioso',
            'reason' => 'Comportamiento sospechoso',
            'notes' => 'Bloqueado por seguridad',
            'added_by' => $admin->id,
            'company_id' => $company->id,
            'is_active' => true,
        ]);
    }
}
