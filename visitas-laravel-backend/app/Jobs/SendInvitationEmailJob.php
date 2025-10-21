<?php

namespace App\Jobs;

use App\Mail\InvitationMail;
use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInvitationEmailJob implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public Invitation $invitation;

    public function __construct(Invitation $invitation)
    {
        $this->invitation = $invitation;
        // The model will be serialized by id and re-retrieved on the worker
    }

    public function handle()
    {
        if (! $this->invitation->email) {
            return;
        }

        Mail::to($this->invitation->email)->send(new InvitationMail($this->invitation));
    }
}
