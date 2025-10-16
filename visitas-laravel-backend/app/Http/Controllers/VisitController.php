<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
        return response()->json($visit);
    }

    // Crear una nueva visita
    public function store(Request $request)
    {
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
        $visit = Visit::create($request->all());
        return response()->json($visit, 201);
    }

    // Actualizar una visita
    public function update(Request $request, $id)
    {
        $visit = Visit::find($id);
        if (!$visit) {
            return response()->json(['error' => 'Visita no encontrada'], 404);
        }
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
        $visit->update($request->all());
        return response()->json($visit);
    }

    // Eliminar una visita
    public function destroy($id)
    {
        $visit = Visit::find($id);
        if (!$visit) {
            return response()->json(['error' => 'Visita no encontrada'], 404);
        }
        $visit->delete();
        return response()->json(['message' => 'Visita eliminada correctamente']);
    }
}
