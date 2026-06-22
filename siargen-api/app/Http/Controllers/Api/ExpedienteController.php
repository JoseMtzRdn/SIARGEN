<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ExpedienteRequest;
use App\Http\Resources\Api\ExpedienteResource;
use App\Services\ExpedienteService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use App\Models\Expediente;

class ExpedienteController extends Controller
{
    use ApiResponseTrait;

    protected $service;

    public function __construct(ExpedienteService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $perPage = $request->input('per_page', 10);
        $query = Expediente::with(['serie', 'unidadAdministrativa', 'creador'])->withCount('documentos');

        

        if ($user->isRat() || $user->isTua() || $user->isRespCorrespondencia()) {
            $query->where('unidad_administrativa_id', $user->unidad_administrativa_id);
        }


        if ($perPage != -1) {
            if ($user->isRat()) {
                if ($request->has('history') && $request->history === 'true') {
                    $query->whereIn('fase', [Expediente::FASE_CONCENTRACION, Expediente::FASE_HISTORICO]);
                } else {
                    $query->where('fase', Expediente::FASE_TRAMITE);
                }
            }
            elseif ($user->isRespCorrespondencia()) {
                $query->where('fase', Expediente::FASE_TRAMITE);
            }
            elseif ($user->isRac()) {
                if ($request->has('history') && $request->history === 'true') {
                    $query->where('fase', Expediente::FASE_HISTORICO);
                } else {
                    $query->where('fase', Expediente::FASE_CONCENTRACION);
                }
            }
            elseif ($user->isRah()) {
                $query->where('fase', Expediente::FASE_HISTORICO);
            }
        }


        if ($request->has('unidad_administrativa_id') && !empty($request->unidad_administrativa_id)) {
            // si el usuario no es de una unidad restringida, permitimos el filtro
            if (!$user->isRat() && !$user->isTua() && !$user->isRespCorrespondencia()) {
                $query->where('unidad_administrativa_id', $request->unidad_administrativa_id);
            }
        }

  
        if ($request->has('fase')) {
            $faseMap = [
                'tramite' => Expediente::FASE_TRAMITE,
                'concentracion' => Expediente::FASE_CONCENTRACION,
                'historico' => Expediente::FASE_HISTORICO,
                'baja' => Expediente::FASE_BAJA
            ];
            $faseValue = $faseMap[$request->fase] ?? $request->fase;
            $query->where('fase', $faseValue);
        }

        if ($request->has('estatus_disponibilidad')) {
            $statusMap = [
                'disponible' => Expediente::STATUS_DISPONIBLE,
                'prestado' => Expediente::STATUS_PRESTADO,
                'reservado' => Expediente::STATUS_RESERVADO,
                'en_transferencia' => Expediente::STATUS_EN_TRANSFERENCIA
            ];
            $statusValue = $statusMap[$request->estatus_disponibilidad] ?? $request->estatus_disponibilidad;
            $query->where('estatus_disponibilidad', $statusValue);
        }

        if ($request->has('estado_archivo')) {
            $stateMap = [
                'abierto' => Expediente::STATE_ABIERTO,
                'cerrado' => Expediente::STATE_CERRADO,
                'subsanacion' => Expediente::STATE_CERRADO_SUBSANACION
            ];
            
            $states = is_array($request->estado_archivo) ? $request->estado_archivo : [$request->estado_archivo];
            $stateValues = [];
            
            foreach ($states as $state) {
                if (isset($stateMap[$state])) {
                    $stateValues[] = $stateMap[$state];
                } elseif (is_numeric($state)) {
                    $stateValues[] = (int)$state;
                }
            }

            if (!empty($stateValues)) {
                $query->whereIn('estado_archivo', $stateValues);
            }
        }


        if ($request->has('exclude_subsanacion') && $request->exclude_subsanacion === 'true') {
            $query->whereDoesntHave('transferencias', function($q) {
                $q->whereIn('estatus', ['rechazada_tua', 'rechazada_coordinador', 'rechazada_rac', 'rechazada_rah']);
            });
        }

 
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('numero_expediente', 'LIKE', "%{$search}%")
                  ->orWhere('titulo', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('serie_id')) {
            $query->where('serie_id', $request->serie_id);
        }

        if ($request->has('subserie_id')) {
            $query->where('subserie_id', $request->subserie_id);
        }

        if ($perPage == -1) {
            $expedientes = $query->with([
                'documentos.unidadAdministrativa', 
                'serie', 
                'subserie',
                'transferencias'
            ])->orderBy('created_at', 'desc')->get();

            return $this->successResponse(
                ExpedienteResource::collection($expedientes)->resolve(),
                'Expedientes recuperados exitosamente'
            );
        }

        $expedientes = $query->with([
            'documentos.unidadAdministrativa', 
            'serie', 
            'subserie',
            'transferencias'
        ])->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->successResponse(
            ExpedienteResource::collection($expedientes)->response()->getData(true),
            'Expedientes recuperados exitosamente'
        );

        return $this->successResponse(
            ExpedienteResource::collection($expedientes)->response()->getData(true),
            'Expedientes recuperados exitosamente'
        );
    }

    protected function isReadOnlyUser($user)
    {
        return $user->isTua() || $user->isRespCorrespondencia();
    }

    public function store(ExpedienteRequest $request)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('No tienes permisos para crear expedientes. Rol de solo lectura.', 403);
        }

        try {
            $expediente = $this->service->create($request->validated());
            return $this->successResponse(
                new ExpedienteResource($expediente->load(['serie', 'subserie', 'unidadAdministrativa'])),
                'Expediente creado exitosamente',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function show($id)
    {
        $expediente = $this->service->find($id)->load([
            'serie.seccion.fondo', 
            'subserie.serie.seccion.fondo',
            'unidadAdministrativa', 
            'creador', 
            'documentos.unidadAdministrativa',
            'documentos.usuario',
            'documentos.serie',
            'documentos.subserie',
            'documentos.seccion'
        ]);
        return $this->successResponse(new ExpedienteResource($expediente), 'Expediente recuperado');
    }

    public function update(ExpedienteRequest $request, $id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('No tienes permisos para editar expedientes. Rol de solo lectura.', 403);
        }

        $expediente = $this->service->find($id);

        if ((int)$expediente->estatus_disponibilidad === Expediente::STATUS_EN_TRANSFERENCIA) {
            return $this->errorResponse('No se puede modificar un expediente que se encuentra en proceso de transferencia.', 422);
        }

        try {
            $expediente = $this->service->updateRecord($id, $request->validated());
            return $this->successResponse(
                new ExpedienteResource($expediente->load(['serie', 'subserie', 'unidadAdministrativa'])),
                'Expediente actualizado exitosamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function destroy($id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('No tienes permisos para eliminar expedientes. Rol de solo lectura.', 403);
        }

        $expediente = $this->service->find($id)->loadCount('documentos');

        if ((int)$expediente->estatus_disponibilidad === Expediente::STATUS_EN_TRANSFERENCIA) {
            return $this->errorResponse('No se puede eliminar un expediente que se encuentra en proceso de transferencia.', 422);
        }

        if ($expediente->documentos_count > 0) {
            return $this->errorResponse("No se puede eliminar el expediente porque contiene {$expediente->documentos_count} documentos archivados. Debe desarchivarlos o eliminarlos primero para proceder.", 422);
        }

        $this->service->delete($id);
        return $this->successResponse(null, 'Expediente eliminado');
    }

    public function cerrar($id)
    {
        $user = auth()->user();
        if (!$user->isRat() && !$user->isAdminTi()) {
            return $this->errorResponse('No tienes autorización para cerrar este expediente.', 403);
        }

        try {
            $expediente = $this->service->close($id);
            return $this->successResponse(
                new ExpedienteResource($expediente->load(['serie', 'subserie'])), 
                'Expediente cerrado exitosamente. El plazo de conservación ha iniciado.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function reabrir(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user->isRat() && !$user->isAdminTi()) {
            return $this->errorResponse('No tienes autorización para reabrir este expediente.', 403);
        }

        $expediente = $this->service->find($id);

        if ((int)$expediente->estatus_disponibilidad === Expediente::STATUS_EN_TRANSFERENCIA) {
            return $this->errorResponse('No es posible reabrir un expediente que se encuentra bloqueado por un proceso de transferencia en curso.', 422);
        }

        $request->validate([
            'motivo' => 'required|string|min:10'
        ], [
            'motivo.required' => 'La justificación es obligatoria.',
            'motivo.min' => 'La justificación es demasiado corta (mínimo 10 caracteres).'
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($id, $user, $request) {
                $expediente = $this->service->reopen($id);
                
                // registrar la justificación técnica
                \App\Models\ExpedienteReapertura::create([
                    'expediente_id' => $id,
                    'user_id' => $user->id,
                    'motivo' => $request->motivo,
                    'fecha_reapertura' => now()
                ]);
                
                // notificar al coordinador de archivos
                $coordinadores = \App\Models\User::whereHas('role', function($q) {
                    $q->where('slug', 'coord_archivos');
                })->get();

                foreach ($coordinadores as $coord) {
                    \App\Http\Controllers\Api\NotificationController::push(
                        $coord->id,
                        'Expediente Reabierto',
                        "El usuario {$user->nombre} reabrió el expediente {$expediente->numero_expediente}.",
                        'warning',
                        "/tramite/expedientes?search={$expediente->numero_expediente}"
                    );
                }

                return $this->successResponse(
                    new ExpedienteResource($expediente->load(['serie', 'subserie'])), 
                    'Expediente reabierto exitosamente.'
                );
            });
        } catch (\Illuminate\Database\QueryException $e) {
            \Illuminate\Support\Facades\Log::error("Error SQL en reapertura: " . $e->getMessage());
            return $this->errorResponse('Ocurrió un error en la base de datos al registrar la reapertura. Por favor, contacte a soporte.', 500);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function reclasificar(Request $request, $id)
    {
        $request->validate([
            'serie_id' => 'required|exists:series_documentales,id',
            'subserie_id' => 'nullable|exists:subseries,id'
        ]);

        try {
            $expediente = $this->service->reclasificarSubsanacion($id, $request->only('serie_id', 'subserie_id'));
            return $this->successResponse(new ExpedienteResource($expediente), 'Expediente reclasificado en cascada exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function updateUbicacion(Request $request, $id)
    {
        $request->validate([
            'ubicacion_seccion' => 'nullable|string',
            'ubicacion_bateria' => 'nullable|string',
            'ubicacion_modulo' => 'nullable|string',
            'ubicacion_entrepaño' => 'nullable|string',
            'ubicacion_caja' => 'nullable|string',
            'numero_cajas' => 'nullable|integer',
        ]);

        try {
            $expediente = $this->service->updateUbicacionSubsanacion($id, $request->all());
            return $this->successResponse(new ExpedienteResource($expediente), 'Ubicación topográfica actualizada exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
