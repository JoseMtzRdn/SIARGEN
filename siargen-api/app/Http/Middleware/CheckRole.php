<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $user = $request->user();

        
        if ($user->isAdminTi()) {
            return $next($request);
        }

        
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'No tienes permisos suficientes para realizar esta acción.',
            'error' => 'FORBIDDEN_ROLE'
        ], 403);
    }
}
