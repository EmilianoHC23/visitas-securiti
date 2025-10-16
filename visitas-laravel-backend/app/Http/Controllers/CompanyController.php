<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    // Listar empresas
    public function index()
    {
        return response()->json(Company::all());
    }

    // Crear empresa
    public function store(Request $request)
    {
        $this->authorize('create', Company::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|string',
            'auto_approval' => 'boolean',
            'require_photo' => 'boolean',
            'enable_self_register' => 'boolean',
            'notification_email' => 'nullable|email',
            'qr_code' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Generar qr_code si no se proporciona (la columna es NOT NULL en la BD)
        if (empty($validated['qr_code'])) {
            $validated['qr_code'] = Str::random(12);
        }

        $company = Company::create($validated);
        return response()->json($company, 201);
    }

    // Mostrar empresa
    public function show($id)
    {
        $company = Company::findOrFail($id);
        $this->authorize('view', $company);
        return response()->json($company);
    }

    // Actualizar empresa
    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);
        $this->authorize('update', $company);
        $validated = $request->validate([
            'name' => 'string|max:255',
            'logo' => 'nullable|string',
            'auto_approval' => 'boolean',
            'require_photo' => 'boolean',
            'enable_self_register' => 'boolean',
            'notification_email' => 'nullable|email',
            'qr_code' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $company->update($validated);
        return response()->json($company);
    }

    // Eliminar empresa
    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        $this->authorize('delete', $company);
        $company->delete();
        return response()->json(['message' => 'Empresa eliminada']);
    }
}
