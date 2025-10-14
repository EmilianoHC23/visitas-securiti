<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccessInvitedEmail;
use App\Models\Access;

class AccessInvitedEmailSeeder extends Seeder
{
    public function run(): void
    {
        $access = Access::first();
        AccessInvitedEmail::create([
            'access_id' => $access->id,
            'email' => 'invitado@correo.com',
            'sent_at' => now(),
            'status' => 'sent',
        ]);
    }
}
