<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use App\Models\VisitEvent;
use Illuminate\Http\Request;

class VisitEventController extends Controller
{
    // List events for a visit
    public function index(Visit $visit)
    {
        return response()->json($visit->events()->orderBy('timestamp', 'asc')->get());
    }

    // Create an event for a visit (e.g., photos upload, note)
    public function store(Request $request, Visit $visit)
    {
        $data = $request->validate([
            'type' => 'required|string|max:100',
            'photos' => 'nullable|array',
            'photos.*' => 'string',
            'timestamp' => 'nullable|date',
        ]);

        $event = $visit->events()->create([
            'type' => $data['type'],
            'photos' => $data['photos'] ?? null,
            'timestamp' => $data['timestamp'] ?? now(),
        ]);

        return response()->json($event, 201);
    }
}
