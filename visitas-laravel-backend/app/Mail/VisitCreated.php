<?php

namespace App\Mail;

use App\Models\Visit;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class VisitCreated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $visit;

    public function __construct(Visit $visit)
    {
        $this->visit = $visit;
    }

    public function build()
    {
        return $this->from(config('mail.from.address'), config('mail.from.name'))
                    ->subject('Nueva visita registrada')
                    ->onQueue('emails')
                    ->view('emails.visit_created')
                    ->with(['visit' => $this->visit]);
    }
}
