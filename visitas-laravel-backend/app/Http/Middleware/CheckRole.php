<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware('role:admin') or ->middleware('role:reception')
     */
    public function handle(Request $request, Closure $next, $role)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // roles can be comma separated
        $allowed = array_map('trim', explode(',', $role));
        if (! in_array($user->role, $allowed)) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        return $next($request);
    }
}
