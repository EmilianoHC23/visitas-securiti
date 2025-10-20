<?php

namespace App\Services;

use App\Models\Invitation;
use Illuminate\Support\Str;
use App\Jobs\SendInvitationEmailJob;

class InvitationService
{
    /**
     * Create an invitation, generate token and send email.
     * Returns the created Invitation.
     */
    public function createAndSend(array $data): Invitation
    {
        $token = Str::random(40);
        $data['invitation_token'] = $token;
        if (! isset($data['expires_at'])) {
            $data['expires_at'] = now()->addDays(7);
        }
        $data['status'] = $data['status'] ?? 'pending';

        $invitation = Invitation::create($data);

        // Dispatch job to send email
        try {
            SendInvitationEmailJob::dispatch($invitation);
        } catch (\Exception $e) {
            // Log error in real app
        }

        return $invitation;
    }
}
