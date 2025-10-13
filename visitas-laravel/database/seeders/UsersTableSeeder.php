<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\User;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Cargar el archivo JSON
        $json = file_get_contents(database_path('seeders/data/users.json'));
        $data = json_decode($json, true);

        if (!$data) {
            dd('Error leyendo users.json', $json);
        }

        // Crear un mapa de companyId lógico a ID real de MySQL
        $companyMap = Company::pluck('id', 'company_id')->toArray();

        foreach ($data as $item) {
            User::create([
                'mongo_id' => $item['_id']['$oid'],
                'email' => $item['email'],
                'password' => $item['password'], // Si necesitas hashear, usa bcrypt($item['password'])
                'first_name' => $item['firstName'],
                'last_name' => $item['lastName'],
                'role' => $item['role'],
                'company_id' => $companyMap[$item['companyId']] ?? null,
                'is_active' => $item['isActive'],
                'invitation_status' => $item['invitationStatus'] ?? null,
                'profile_image' => $item['profileImage'] ?? null,
            ]);
        }
    }
}
