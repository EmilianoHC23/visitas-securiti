<?php

namespace App\Mail;

use App\Models\Approval;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApprovalMail extends Mailable
{
    use Queueable, SerializesModels;

    public Approval $approval;

    public function __construct(Approval $approval)
    {
        $this->approval = $approval;
    }

    public function build()
    {
        return $this->subject('Solicitud de aprobación de visita')
            ->view('emails.approval')
            ->with(['approval' => $this->approval]);
    }
}
