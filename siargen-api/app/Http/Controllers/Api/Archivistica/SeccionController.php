<?php

namespace App\Http\Controllers\Api\Archivistica;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Seccion\StoreSeccionRequest;
use App\Http\Requests\Api\Seccion\UpdateSeccionRequest;
use App\Http\Resources\Api\Archivistica\SeccionResource;
use App\Services\SeccionService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class SeccionController extends Controller
{
    use ApiResponseTrait;

    protected $service;

    public function __construct(SeccionService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $searchTerm = $request->input('search');

        $query = \App\Models\Seccion::with('fondo')->withCount('series');
        
        if ($request->filled('fondo_id')) {
            $query->where('fondo_id', $request->fondo_id);
        }

        if ($searchTerm) {
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('codigo', 'LIKE', "%{$searchTerm}%");
            });
        }
        
        if ($perPage == -1) {
            $secciones = $query->orderBy('codigo')->get();
            return $this->successResponse(
                SeccionResource::collection($secciones)->response()->getData(true),
                'Secciones recuperadas exitosamente'
            );
        }

        $secciones = $query->paginate($perPage);

        return $this->successResponse(
            SeccionResource::collection($secciones)->response()->getData(true),
            'Secciones recuperadas exitosamente'
        );
    }

    public function store(StoreSeccionRequest $request)
    {
        if (!auth()->user()->isCoordArchivos()) {
            return $this->errorResponse('Solo el Coordinador de Archivos puede crear secciones.', 403);
        }
        $seccion = $this->service->create($request->validated());
        return $this->successResponse(
            new SeccionResource($seccion),
            'Sección creada exitosamente',
            201
        );
    }

    public function show($id)
    {
        $seccion = $this->service->find($id, ['*'], ['fondo']);
        return $this->successResponse(
            new SeccionResource($seccion),
            'Sección recuperada exitosamente'
        );
    }

    public function update(UpdateSeccionRequest $request, $id)
    {
        if (!auth()->user()->isCoordArchivos()) {
            return $this->errorResponse('Solo el Coordinador de Archivos puede actualizar secciones.', 403);
        }
        $this->service->update($id, $request->validated());
        $seccion = $this->service->find($id);
        return $this->successResponse(
            new SeccionResource($seccion),
            'Sección actualizada exitosamente'
        );
    }

    public function destroy($id)
    {
        if (!auth()->user()->isCoordArchivos()) {
            return $this->errorResponse('Solo el Coordinador de Archivos puede eliminar secciones.', 403);
        }
        $this->service->delete($id);
        return $this->successResponse(null, 'Sección eliminada exitosamente');
    }
}
