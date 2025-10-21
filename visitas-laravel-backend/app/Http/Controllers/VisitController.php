<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVisitRequest;
use App\Http\Requests\UpdateVisitRequest;
use App\Models\Visit;
use App\Models\VisitEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\VisitCreated;
use App\Mail\VisitApproved;

class VisitController extends Controller
{
    public function index(Request $request)
    {
        // Basic listing with pagination and optional filters
        $query = Visit::query();
        if ($request->has('company_id')) {
            $query->where('company_id', $request->get('company_id'));
        }
        if ($request->has('host_id')) {
            $query->where('host_id', $request->get('host_id'));
        }
        return response()->json($query->paginate(20));
    }

    public function store(StoreVisitRequest $request)
    {
        $data = $request->validated();

        // Map visit_date + visit_time to scheduled_date if needed
        if (empty($data['scheduled_date']) && !empty($data['visit_date'])) {
            $time = $data['visit_time'] ?? '00:00:00';
            $data['scheduled_date'] = \Illuminate\Support\Carbon::parse($data['visit_date'].' '.$time)->toDateTimeString();
        }

        // Deduce company_id from host or authenticated user if missing
        if (empty($data['company_id'])) {
            $companyId = null;
            if (!empty($data['host_id'])) {
                $host = \App\Models\User::find($data['host_id']);
                if ($host && !empty($host->company_id)) {
                    $companyId = $host->company_id;
                }
            }
            if (empty($companyId) && $request->user() && !empty($request->user()->company_id)) {
                $companyId = $request->user()->company_id;
            }
            if (!empty($companyId)) {
                $data['company_id'] = $companyId;
            }
        }

        // Validate access_id if provided
        if (!empty($data['access_id']) && !\App\Models\Access::where('id', $data['access_id'])->exists()) {
            return response()->json(['errors' => ['access_id' => ['access_id no existe']]], 422);
        }

        // Authorization: allow admin and reception (tests expect this behavior)
        $this->authorize('create', Visit::class);

        $visit = Visit::create($data);

        // create a VisitEvent for creation
        VisitEvent::create(['visit_id' => $visit->id, 'type' => 'created', 'timestamp' => now()]);

        // Notify company if configured
        try {
            if (!empty($visit->company_id) && $visit->company && !empty($visit->company->notification_email)) {
                Mail::to($visit->company->notification_email)->queue((new VisitCreated($visit))->onQueue('emails'));
            }
        } catch (\Exception $e) {
            // don't block creation on mail errors
        }

        return response()->json($visit, 201);
    }

    public function show(Visit $visit)
    {
        return response()->json($visit->load('approvals', 'events'));
    }

    public function update(UpdateVisitRequest $request, Visit $visit)
    {
        // explicit authorization to match policy expected behavior in tests
        try {
            $user = \Tymon\JWTAuth\Facades\JWTAuth::parseToken()->authenticate();
        } catch (\Exception $e) {
            $user = $request->user();
        }

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $allowed = false;
        if ($user->role === 'admin') {
            $allowed = true;
        } elseif (!empty($user->company_id) && $user->company_id === $visit->company_id && in_array($user->role, ['admin', 'reception'])) {
            $allowed = true;
        } elseif ($user->id === $visit->host_id) {
            $allowed = true;
        }

        if (!$allowed) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $oldStatus = $visit->status;
        $visit->update($request->validated());

        // If it was just approved, notify visitor
        try {
            if ($oldStatus !== 'approved' && $visit->status === 'approved' && !empty($visit->visitor_email)) {
                Mail::to($visit->visitor_email)->queue((new VisitApproved($visit))->onQueue('emails'));
            }
        } catch (\Exception $e) {
            // ignore mailing errors
        }

        return response()->json($visit);
    }

    public function destroy(Visit $visit)
    {
        $this->authorize('delete', $visit);
        $visit->delete();
        return response()->json(['message' => 'Visita eliminada correctamente'], 200);
    }

    // Actions: checkin, checkout, cancel
    public function checkin(Visit $visit)
    {
        $visit->update(['check_in_time' => now(), 'status' => 'checked-in']);
        VisitEvent::create(['visit_id' => $visit->id, 'type' => 'checkin', 'timestamp' => now()]);
        return response()->json($visit);
    }

    public function checkout(Visit $visit)
    {
        $visit->update(['check_out_time' => now(), 'status' => 'completed']);
        VisitEvent::create(['visit_id' => $visit->id, 'type' => 'checkout', 'timestamp' => now()]);
        return response()->json($visit);
    }

    public function cancel(Visit $visit)
    {
        $visit->update(['status' => 'cancelled']);
        VisitEvent::create(['visit_id' => $visit->id, 'type' => 'cancel', 'timestamp' => now()]);
        return response()->json($visit);
    }

    // Scan QR token to find a visit or company public data (frontend expects this)
    public function scanQr(Request $request)
    {
        // Accept either 'qrToken' or a more generic 'code' field used by frontend
        $token = $request->input('qrToken') ?? $request->input('code');
        if (! $token) {
            return response()->json(['message' => 'qrToken required'], 422);
        }

        // Try to find visit by qr_token
        $visit = Visit::where('qr_token', $token)->first();
        if ($visit) {
            return response()->json(['message' => 'visit found', 'visit' => $visit]);
        }

        // Optionally, look for a company by qr_code
        $company = \App\Models\Company::where('qr_code', $token)->first();
        if ($company) {
            return response()->json(['message' => 'company found', 'company' => $company]);
        }

        return response()->json(['message' => 'Not found'], 404);
    }

    // Public visit registration (no auth required)
    public function storePublic(Request $request)
    {
        // Reuse validation rules from StoreVisitRequest
        $validator = \Validator::make($request->all(), (new StoreVisitRequest())->rules());
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Map visit_date + visit_time to scheduled_date if needed
        if (empty($data['scheduled_date']) && !empty($data['visit_date'])) {
            $time = $data['visit_time'] ?? '00:00:00';
            $data['scheduled_date'] = \Illuminate\Support\Carbon::parse($data['visit_date'].' '.$time)->toDateTimeString();
        }

        // Deduce company_id from host if provided
        if (empty($data['company_id']) && !empty($data['host_id'])) {
            $host = \App\Models\User::find($data['host_id']);
            if ($host && !empty($host->company_id)) {
                $data['company_id'] = $host->company_id;
            }
        }

        $visit = Visit::create($data);
        VisitEvent::create(['visit_id' => $visit->id, 'type' => 'created', 'timestamp' => now()]);

        return response()->json($visit, 201);
    }
}
