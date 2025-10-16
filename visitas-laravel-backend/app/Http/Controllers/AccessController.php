<?php

namespace App\Http\Controllers;

use App\Models\Access;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccessController extends Controller
{
    // Listar todos los accesos
    public function index()
    {
        return response()->json(Access::all());
    }

    // Mostrar un acceso específico
    public function show($id)
    {
        $access = Access::find($id);
        if (!$access) {
            return response()->json(['error' => 'Acceso no encontrado'], 404);
        }
        return response()->json($access);
    }

    // Crear un nuevo acceso
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'created_by' => 'required|exists:users,id',
            'company_id' => 'required|exists:companies,id',
            'access_code' => 'required|string|unique:accesses,access_code',
            'qr_code' => 'required|string|unique:accesses,qr_code',
            'schedule_start_date' => 'required|date',
            'schedule_end_date' => 'required|date',
            'schedule_start_time' => 'required|string',
            'schedule_end_time' => 'required|string',
            'schedule_recurrence' => 'in:none,daily,weekly,monthly',
            'status' => 'in:active,expired,cancelled',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $access = Access::create($request->all());
        return response()->json($access, 201);
    }

    // Actualizar un acceso
    public function update(Request $request, $id)
    {
        $access = Access::find($id);
        if (!$access) {
            return response()->json(['error' => 'Acceso no encontrado'], 404);
        }
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'created_by' => 'sometimes|required|exists:users,id',
            'company_id' => 'sometimes|required|exists:companies,id',
            'access_code' => 'sometimes|required|string|unique:accesses,access_code,' . $id,
            'qr_code' => 'sometimes|required|string|unique:accesses,qr_code,' . $id,
            'schedule_start_date' => 'sometimes|required|date',
            'schedule_end_date' => 'sometimes|required|date',
            'schedule_start_time' => 'sometimes|required|string',
            'schedule_end_time' => 'sometimes|required|string',
            'schedule_recurrence' => 'sometimes|in:none,daily,weekly,monthly',
            'status' => 'sometimes|in:active,expired,cancelled',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $access->update($request->all());
        return response()->json($access);
    }

    // Eliminar un acceso
    public function destroy($id)
    {
        $access = Access::find($id);
        if (!$access) {
            return response()->json(['error' => 'Acceso no encontrado'], 404);
        }
        $access->delete();
        return response()->json(['message' => 'Acceso eliminado correctamente']);
    }
}
