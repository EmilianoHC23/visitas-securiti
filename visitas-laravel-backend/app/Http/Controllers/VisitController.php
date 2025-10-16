<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\VisitCreated;
use App\Mail\VisitApproved;

class VisitController extends Controller
{
    // Listar todas las visitas
    public function index()
    {
        return response()->json(Visit::all());
    }

    // Mostrar una visita específica
    public function show($id)
    {
        $visit = Visit::find($id);
        if (!$visit) {
            return response()->json(['error' => 'Visita no encontrada'], 404);
        }
        $this->authorize('view', $visit);
        return response()->json($visit);
    }

    // Crear una nueva visita
    public function store(Request $request)
    {
        $this->authorize('create', Visit::class);
        $validator = Validator::make($request->all(), [
            'host_id' => 'required|exists:users,id',
            'access_id' => 'nullable|exists:accesses,id',
            'visitor_name' => 'required|string|max:255',
            'visitor_email' => 'required|email|max:255',
            'visit_date' => 'required|date',
            'visit_time' => 'required|string',
            'status' => 'in:pending,approved,rejected,completed',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $request->all();
        // Mapear visit_date + visit_time a scheduled_date (columna en la BD)
        if (!empty($data['visit_date']) && !empty($data['visit_time'])) {
            try {
                $data['scheduled_date'] = Carbon::parse($data['visit_date'].' '.$data['visit_time'])->toDateTimeString();
            } catch (\Exception $e) {
                $data['scheduled_date'] = $data['visit_date'];
            }
            // eliminar campos temporales
            unset($data['visit_date'], $data['visit_time']);
        }

        // Asegurar company_id: preferir la compañía del host si está disponible,
        // si no, usar la compañía del usuario autenticado (si existe)
        if (empty($data['company_id'])) {
            $companyId = null;
            if (!empty($data['host_id'])) {
                $host = User::find($data['host_id']);
                if ($host && !empty($host->company_id)) {
                    $companyId = $host->company_id;
                }
            }
            if (empty($companyId) && $request->user() && !empty($request->user()->company_id)) {
                $companyId = $request->user()->company_id;
            }
            if (!empty($companyId)) {
                $data['company_id'] = $companyId;
            } else {
                return response()->json(['errors' => ['company_id' => ['No se pudo deducir company_id desde host o usuario autenticado']]] , 422);
            }
        }

        // Validar access_id si es provisto
        if (!empty($data['access_id']) && !\App\Models\Access::where('id', $data['access_id'])->exists()) {
            return response()->json(['errors' => ['access_id' => ['access_id no existe']]], 422);
        }

        $visit = Visit::create($data);

        // Enviar notificación por email a la compañía si tiene notification_email
        try {
            $company = null;
            if (!empty($visit->company_id)) {
                $company = \App\Models\Company::find($visit->company_id);
            }
            if ($company && !empty($company->notification_email)) {
                Mail::to($company->notification_email)->queue((new VisitCreated($visit))->onQueue('emails'));
            }
        } catch (\Exception $e) {
            // no bloquear la creación por fallos de envío
        }
        return response()->json($visit, 201);
    }

    // Actualizar una visita
    public function update(Request $request, $id)
    {
        $visit = Visit::find($id);
        if (!$visit) {
            return response()->json(['error' => 'Visita no encontrada'], 404);
        }
        // Enforce explicit role rules here to avoid ambiguous Gate resolution in tests:
        // - admin: allowed
        // - reception: allowed only if same company
        // - host: allowed only if they are the host (own visit)
            // Resolve authenticated user prioritizing JWT token (more reliable in tests)
            try {
                $user = \Tymon\JWTAuth\Facades\JWTAuth::parseToken()->authenticate();
            } catch (\Exception $e) {
                $user = $request->user();
            }

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Authorization rules (strict):
            // - admin: allowed
            // - host: allowed only for their own visit
            // - reception: allowed only for visits in same company
            if ($user->role === 'admin') {
                // allowed
            } elseif ($user->role === 'host') {
                if ($user->id !== $visit->host_id) {
                    return response()->json(['message' => 'This action is unauthorized.'], 403);
                }
            } elseif ($user->role === 'reception') {
                if (empty($user->company_id) || $user->company_id !== $visit->company_id) {
                    return response()->json(['message' => 'This action is unauthorized.'], 403);
                }
            } else {
                return response()->json(['message' => 'This action is unauthorized.'], 403);
            }

        $this->authorize('update', $visit);
        $validator = Validator::make($request->all(), [
            'host_id' => 'sometimes|required|exists:users,id',
            'access_id' => 'sometimes|nullable|exists:accesses,id',
            'visitor_name' => 'sometimes|required|string|max:255',
            'visitor_email' => 'sometimes|required|email|max:255',
            'visit_date' => 'sometimes|required|date',
            'visit_time' => 'sometimes|required|string',
            'status' => 'sometimes|in:pending,approved,rejected,completed',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $request->all();
        if (!empty($data['visit_date']) && !empty($data['visit_time'])) {
            try {
                $data['scheduled_date'] = Carbon::parse($data['visit_date'].' '.$data['visit_time'])->toDateTimeString();
            } catch (\Exception $e) {
                $data['scheduled_date'] = $data['visit_date'];
            }
            unset($data['visit_date'], $data['visit_time']);
        }
        $oldStatus = $visit->status;
        $visit->update($data);

        // Si cambia a approved, notificar al visitante
        try {
            if ($oldStatus !== 'approved' && $visit->status === 'approved' && !empty($visit->visitor_email)) {
                Mail::to($visit->visitor_email)->queue((new VisitApproved($visit))->onQueue('emails'));
            }
        } catch (\Exception $e) {
            // no bloquear la actualización por fallos de envío
        }

        return response()->json($visit);
    }

    // Eliminar una visita
    public function destroy($id)
    {
        $visit = Visit::find($id);
        if (!$visit) {
            return response()->json(['error' => 'Visita no encontrada'], 404);
        }
        $this->authorize('delete', $visit);
        $visit->delete();
        return response()->json(['message' => 'Visita eliminada correctamente']);
    }
}
