<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UnidadAdministrativaService;
use App\Http\Requests\Api\StoreUnidadAdministrativaRequest;
use App\Http\Requests\Api\UpdateUnidadAdministrativaRequest;
use App\Http\Resources\Api\UnidadAdministrativaResource;
use App\Http\Resources\Api\UserResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class UnidadAdministrativaController extends Controller
{
    use ApiResponseTrait;

    protected $service;

    public function __construct(UnidadAdministrativaService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $unidades = $this->service->getAll($request->all());
        
        return $this->successResponse(
            UnidadAdministrativaResource::collection($unidades)->response()->getData(true),
            'Unidades administrativas recuperadas exitosamente'
        );
    }

    public function store(StoreUnidadAdministrativaRequest $request)
    {
        $unidad = $this->service->create($request->validated());
        return $this->successResponse(
            new UnidadAdministrativaResource($unidad),
            'Unidad administrativa creada exitosamente',
            201
        );
    }

    public function show($id)
    {
        $unidad = $this->service->getById($id);
        return $this->successResponse(
            new UnidadAdministrativaResource($unidad),
            'Unidad administrativa recuperada exitosamente'
        );
    }

    public function update(UpdateUnidadAdministrativaRequest $request, $id)
    {
        $unidad = $this->service->update($id, $request->validated());
        return $this->successResponse(
            new UnidadAdministrativaResource($unidad),
            'Unidad administrativa actualizada exitosamente'
        );
    }

    public function destroy($id)
    {
        try {
            $this->service->delete($id);
            return $this->successResponse(null, 'Unidad administrativa eliminada exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function toggleStatus($id)
    {
        try {
            $unidad = $this->service->toggleStatus($id);
            return $this->successResponse(
                new UnidadAdministrativaResource($unidad),
                'Estado de la unidad actualizado exitosamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('No se pudo cambiar el estado de la unidad.', 422);
        }
    }
}
