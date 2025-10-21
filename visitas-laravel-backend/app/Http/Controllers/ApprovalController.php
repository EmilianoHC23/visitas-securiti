<?php

namespace App\Http\Controllers;

use App\Http\Requests\DecisionApprovalRequest;
use App\Models\Approval;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index(Request $request)
    {
        // Placeholder: return approvals for the authenticated host
        return response()->json(Approval::query()->paginate(20));
    }

    public function show(Approval $approval)
    {
        return response()->json($approval);
    }

    public function decision(DecisionApprovalRequest $request, $token)
    {
        $data = $request->validated();

        $approval = Approval::where('token', $token)->first();
        if (! $approval) {
            return response()->json(['message' => 'Invalid token'], 404);
        }

        if ($approval->expires_at && now()->greaterThan($approval->expires_at)) {
            return response()->json(['message' => 'Approval token expired'], 410);
        }

        // TODO: check other business rules
        $approval->update(['status' => $data['decision'], 'decision' => $data['decision'], 'decided_at' => now()]);

        // TODO: update related visit status

        return response()->json(['message' => 'Decision recorded', 'approval' => $approval]);
    }
}
