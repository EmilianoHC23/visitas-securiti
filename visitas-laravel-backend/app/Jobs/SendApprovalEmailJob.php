<?php

namespace App\Jobs;

use App\Mail\ApprovalMail;
use App\Models\Approval;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendApprovalEmailJob implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public Approval $approval;

    public function __construct(Approval $approval)
    {
        $this->approval = $approval;
    }

    public function handle()
    {
        if (! $this->approval->host || ! $this->approval->host->email) {
            return;
        }

        Mail::to($this->approval->host->email)->send(new ApprovalMail($this->approval));
    }
}
