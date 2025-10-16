<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTestMail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'send:test-mail {email=test@example.com}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to verify MAIL_FROM and delivery (uses configured mailer)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        try {
            Mail::raw('Prueba de correo desde comando send:test-mail', function ($m) use ($email) {
                $m->to($email)->subject('Prueba From - Visitas');
            });
            $this->info("Mail encolado/enviado a: {$email}");
            return 0;
        } catch (\Exception $e) {
            $this->error('Error enviando mail: ' . $e->getMessage());
            return 1;
        }
    }
}
