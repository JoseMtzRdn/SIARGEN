<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    
    protected $dontReport = [
        
    ];

    
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            
        });

        $this->renderable(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                return $this->handleApiExceptions($e);
            }
        });
    }

    private function handleApiExceptions(Throwable $e)
    {
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            $errors = $e->errors();
            $firstError = collect($errors)->flatten()->first();
            
            return response()->json([
                'message' => $firstError ?: 'Los datos proporcionados no son válidos.',
                'errors' => $errors,
            ], 422);
        }

        if ($e instanceof \Illuminate\Auth\AuthenticationException) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if ($e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException || 
            $e instanceof \Illuminate\Auth\Access\AuthorizationException) {
            return response()->json(['message' => 'No tienes permisos para realizar esta acción.'], 403);
        }

        if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
            return response()->json(['message' => 'Recurso no encontrado.'], 404);
        }

        
        $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
        
        return response()->json([
            'message' => 'Ha ocurrido un error interno en el servidor. Por favor, contacte al administrador.',
            'error' => config('app.debug') ? $e->getMessage() : 'INTERNAL_SERVER_ERROR',
        ], $status);
    }
}
