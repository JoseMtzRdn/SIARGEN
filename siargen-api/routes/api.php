<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UnidadAdministrativaController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\Archivistica;
use Illuminate\Support\Facades\Route;


Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'check.status'])->group(function () {
    
    // auth & profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // unidades administrativas
    Route::patch('unidades-administrativas/{id}/status', [UnidadAdministrativaController::class, 'toggleStatus'])
        ->middleware('rol:admin_ti');
    Route::apiResource('unidades-administrativas', UnidadAdministrativaController::class)
        ->middleware('rol:admin_ti');

    // usuarios
    Route::get('usuarios/roles', [UserController::class, 'getRoles']);
    Route::get('usuarios/unidades', [UserController::class, 'getUnidades']);
    Route::get('usuarios/check-availability', [UserController::class, 'checkAvailability']);
    Route::apiResource('usuarios', UserController::class)
        ->middleware('rol:admin_ti,tua');
    Route::post('usuarios/{id}/generar-nombramiento', [\App\Http\Controllers\Api\DocumentoController::class, 'generarNombramiento'])
        ->middleware('rol:admin_ti,tua');
    Route::patch('usuarios/{id}/status', [UserController::class, 'toggleStatus'])
        ->middleware('rol:admin_ti,tua');

    // configuración archivística (cgca)
    Route::prefix('archivistica')->group(function () {
        // rutas de lectura: abiertas para todos los roles operativos
        Route::middleware('rol:admin_ti,coord_archivos,rat,tua,rac,rah,correspondencia,consulta')->group(function() {
            Route::get('fondos', [Archivistica\FondoController::class, 'index']);
            Route::get('fondos/{id}', [Archivistica\FondoController::class, 'show']);
            Route::get('secciones', [Archivistica\SeccionController::class, 'index']);
            Route::get('secciones/{id}', [Archivistica\SeccionController::class, 'show']);
            Route::get('series', [Archivistica\SerieDocumentalController::class, 'index']);
            Route::get('series/{id}', [Archivistica\SerieDocumentalController::class, 'show']);
            Route::get('subseries', [Archivistica\SubserieController::class, 'index']);
            Route::get('subseries/{id}', [Archivistica\SubserieController::class, 'show']);
        });

        // rutas de escritura: solo para ti y coordinador de archivos
        Route::middleware('rol:admin_ti,coord_archivos')->group(function () {
            Route::apiResource('fondos', Archivistica\FondoController::class)->except(['index', 'show']);
            Route::apiResource('secciones', Archivistica\SeccionController::class)->except(['index', 'show']);
            Route::apiResource('series', Archivistica\SerieDocumentalController::class)->except(['index', 'show']);
            Route::apiResource('subseries', Archivistica\SubserieController::class)->except(['index', 'show']);
        });
    });

    // correspondencia
    Route::post('correspondencia/{id}/archivar', [\App\Http\Controllers\Api\CorrespondenciaController::class, 'archivar'])
        ->middleware('rol:admin_ti,correspondencia,rat');
    Route::post('correspondencia/{id}/cambiar-expediente', [\App\Http\Controllers\Api\CorrespondenciaController::class, 'cambiarExpediente'])
        ->middleware('rol:admin_ti,correspondencia,rat');
    Route::post('correspondencia/{id}/desarchivar', [\App\Http\Controllers\Api\CorrespondenciaController::class, 'desarchivar'])
        ->middleware('rol:admin_ti,correspondencia,rat');
    Route::apiResource('correspondencia', \App\Http\Controllers\Api\CorrespondenciaController::class, ['parameters' => ['correspondencia' => 'id']])
        ->middleware('rol:admin_ti,correspondencia,rat');

    // expedientes
    Route::post('expedientes/{id}/cerrar', [\App\Http\Controllers\Api\ExpedienteController::class, 'cerrar'])
        ->middleware('rol:admin_ti,rat');
    Route::post('expedientes/{id}/reabrir', [\App\Http\Controllers\Api\ExpedienteController::class, 'reabrir'])
        ->middleware('rol:admin_ti,rat');
    Route::post('expedientes/{id}/reclasificar', [\App\Http\Controllers\Api\ExpedienteController::class, 'reclasificar'])
        ->middleware('rol:admin_ti,rat');
    Route::post('expedientes/{id}/ubicacion-subsanacion', [\App\Http\Controllers\Api\ExpedienteController::class, 'updateUbicacion'])
        ->middleware('rol:admin_ti,rat');
        
    Route::apiResource('expedientes', \App\Http\Controllers\Api\ExpedienteController::class)
        ->middleware('rol:admin_ti,rat,tua,rac,rah,correspondencia,coord_archivos');

    // notificaciones
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    // usamos el campo real 'read' para el patch o lo que el controlador espere
    Route::patch('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::patch('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

    // transferencias
    Route::post('transferencias/{id}/enviar-tua', [\App\Http\Controllers\Api\TransferenciaController::class, 'enviarATua'])
        ->middleware('rol:admin_ti,rat');
    Route::post('transferencias/{id}/autorizar-tua', [\App\Http\Controllers\Api\TransferenciaController::class, 'autorizarTua'])
        ->middleware('rol:admin_ti,tua');
    Route::post('transferencias/{id}/rechazar-tua', [\App\Http\Controllers\Api\TransferenciaController::class, 'rechazarTua'])
        ->middleware('rol:admin_ti,tua');
        
    Route::post('transferencias/{id}/validar', [\App\Http\Controllers\Api\TransferenciaController::class, 'validar'])
        ->middleware('rol:admin_ti,coord_archivos');
    Route::post('transferencias/{id}/rechazar-coordinador', [\App\Http\Controllers\Api\TransferenciaController::class, 'rechazarCoordinador'])
        ->middleware('rol:admin_ti,coord_archivos');
    Route::post('transferencias/{id}/enviar-rac', [\App\Http\Controllers\Api\TransferenciaController::class, 'enviarARac'])
        ->middleware('rol:admin_ti,rat');
    Route::post('transferencias/{id}/recibir', [\App\Http\Controllers\Api\TransferenciaController::class, 'recibir'])
        ->middleware('rol:admin_ti,rac');
    Route::post('transferencias/{id}/rechazar-rac', [\App\Http\Controllers\Api\TransferenciaController::class, 'rechazarRac'])
        ->middleware('rol:admin_ti,rac');
    Route::post('transferencias/{id}/resubmit', [\App\Http\Controllers\Api\TransferenciaController::class, 'resubmit'])
        ->middleware('rol:admin_ti,rat');
    Route::post('transferencias/{id}/update-subsanacion', [\App\Http\Controllers\Api\TransferenciaController::class, 'updateSubsanacion'])
        ->middleware('rol:admin_ti,rat');
        
    Route::get('/check-vigencias-transferencias', [\App\Http\Controllers\Api\VigenciaController::class, 'checkVigenciasTransferencias']);
    Route::get('/check-vigencias-prestamos', [\App\Http\Controllers\Api\VigenciaController::class, 'checkVigenciasPrestamos']);
    Route::get('/transferencias/{id}/detail', \App\Http\Controllers\Api\TransferenciaDetailController::class)
        ->middleware('rol:admin_ti,rat,tua,rac,rah,coord_archivos');
    Route::get('/transferencias/{id}/imprimir', [\App\Http\Controllers\Api\TransferenciaController::class, 'imprimir'])
        ->middleware('rol:admin_ti,rat,tua,rac,rah,coord_archivos');
        
    Route::apiResource('transferencias', \App\Http\Controllers\Api\TransferenciaController::class)
        ->middleware('rol:admin_ti,rat,tua,rac,coord_archivos');

    // préstamos
    Route::post('prestamos/{id}/devolver', [\App\Http\Controllers\Api\PrestamoController::class, 'devolver'])
        ->middleware('rol:admin_ti,rac,rat');
    Route::get('prestamos/{id}/imprimir', [\App\Http\Controllers\Api\PrestamoController::class, 'imprimir'])
        ->middleware('rol:admin_ti,rac,rat,tua,coord_archivos');
    Route::apiResource('prestamos', \App\Http\Controllers\Api\PrestamoController::class)
        ->middleware('rol:admin_ti,rac,rat,tua,coord_archivos');
});
