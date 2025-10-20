<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvitationRequest;
use App\Models\Invitation;
use App\Services\InvitationService;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function index(Request $request)
    {
        // Placeholder: return invitations for the company/admin
        return response()->json(Invitation::query()->paginate(20));
    }

    public function store(StoreInvitationRequest $request, InvitationService $service)
    {
        $data = $request->validated();
        $invitation = $service->createAndSend($data);

        return response()->json($invitation, 201);
    }

    public function show(Invitation $invitation)
    {
        return response()->json($invitation);
    }

    public function accept($token)
    {
        // Token-based accept endpoint (public)
        $invitation = Invitation::where('invitation_token', $token)->first();
        if (! $invitation) {
            return response()->json(['message' => 'Invalid token'], 404);
        }

        if ($invitation->expires_at && now()->greaterThan($invitation->expires_at)) {
            return response()->json(['message' => 'Invitation expired'], 410);
        }

        // TODO: create user or finalize invitation acceptance
        $invitation->update(['status' => 'accepted', 'accepted_at' => now()]);

        return response()->json(['message' => 'Invitation accepted', 'invitation' => $invitation]);
    }

    public function destroy(Invitation $invitation)
    {
        $invitation->delete();
        return response()->json(null, 204);
    }
}

