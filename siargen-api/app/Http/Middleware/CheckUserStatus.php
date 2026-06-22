<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && !$request->user()->activo) {
            // Revoca tokens de sesión del usuario para forzar el cierre de sesión.
            $request->user()->tokens()->delete();
            
            return response()->json([
                'message' => 'Tu cuenta ha sido desactivada. Por favor, contacta al administrador.',
                'error' => 'ACCOUNT_INACTIVE'
            ], 401);
        }

        return $next($request);
    }
}
