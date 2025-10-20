<?php

namespace App\Services;

use App\Models\Approval;
use Illuminate\Support\Str;
use App\Jobs\SendApprovalEmailJob;

class ApprovalService
{
    public function createAndSend(array $data): Approval
    {
        $token = Str::random(40);
        $data['token'] = $token;
        if (! isset($data['expires_at'])) {
            $data['expires_at'] = now()->addDays(3);
        }
        $data['status'] = $data['status'] ?? 'pending';

        $approval = Approval::create($data);

        try {
            SendApprovalEmailJob::dispatch($approval);
        } catch (\Exception $e) {
            // log in production
        }

        return $approval;
    }
}
