<?php

namespace App\Http\Controllers\Api\Archivistica;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Fondo\StoreFondoRequest;
use App\Http\Requests\Api\Fondo\UpdateFondoRequest;
use App\Http\Resources\Api\Archivistica\FondoResource;
use App\Services\FondoService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class FondoController extends Controller
{
    use ApiResponseTrait;

    protected $service;

    public function __construct(FondoService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $searchTerm = $request->input('search');

        $query = \App\Models\Fondo::withCount('secciones');

        if ($searchTerm) {
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('codigo', 'LIKE', "%{$searchTerm}%");
            });
        }

        if ($perPage == -1) {
            $fondos = $query->orderBy('codigo')->get();
            return $this->successResponse(
                FondoResource::collection($fondos)->response()->getData(true),
                'Fondos recuperados exitosamente'
            );
        }

        $fondos = $query->paginate($perPage);

        return $this->successResponse(
            FondoResource::collection($fondos)->response()->getData(true),
            'Fondos recuperados exitosamente'
        );
    }

    public function store(StoreFondoRequest $request)
    {
        if (!auth()->user()->isCoordArchivos()) {
            return $this->errorResponse('Solo el Coordinador de Archivos puede crear fondos.', 403);
        }
        $fondo = $this->service->create($request->validated());
        return $this->successResponse(
            new FondoResource($fondo),
            'Fondo creado exitosamente',
            201
        );
    }

    public function show($id)
    {
        $fondo = $this->service->find($id);
        return $this->successResponse(
            new FondoResource($fondo),
            'Fondo recuperado exitosamente'
        );
    }

    public function update(UpdateFondoRequest $request, $id)
    {
        if (!auth()->user()->isCoordArchivos()) {
            return $this->errorResponse('Solo el Coordinador de Archivos puede actualizar fondos.', 403);
        }
        $this->service->update($id, $request->validated());
        $fondo = $this->service->find($id);
        return $this->successResponse(
            new FondoResource($fondo),
            'Fondo actualizado exitosamente'
        );
    }

    public function destroy($id)
    {
        if (!auth()->user()->isCoordArchivos()) {
            return $this->errorResponse('Solo el Coordinador de Archivos puede eliminar fondos.', 403);
        }
        $this->service->delete($id);
        return $this->successResponse(null, 'Fondo eliminado exitosamente');
    }
}
