<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SetUserPassword extends Command
{
    protected $signature = 'user:set-password {email} {password}';
    protected $description = 'Actualiza la contraseña de un usuario por email';

    public function handle()
    {
        $email = $this->argument('email');
        $password = $this->argument('password');
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error('Usuario no encontrado');
            return 1;
        }
        $user->password = Hash::make($password);
        $user->save();
        $this->info('Contraseña actualizada correctamente para ' . $email);
        return 0;
    }
}
