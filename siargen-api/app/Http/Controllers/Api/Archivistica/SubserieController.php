<?php

namespace App\Http\Controllers\Api\Archivistica;

use App\Http\Controllers\Controller;
use App\Models\Subserie;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use App\Http\Requests\Api\Archivistica\StoreSubserieRequest;
use App\Http\Requests\Api\Archivistica\UpdateSubserieRequest;
use App\Http\Resources\Api\Archivistica\SubserieResource;

class SubserieController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $query = Subserie::with('serie')->withCount('expedientes');

        if ($request->filled('serie_id')) {
            $query->where('serie_id', $request->serie_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('codigo', 'LIKE', "%{$search}%");
            });
        }

        $subseries = $request->get('per_page') == -1 ? $query->get() : $query->paginate($request->get('per_page', 15));

        return $this->successResponse(
            $request->get('per_page') == -1 
                ? SubserieResource::collection($subseries) 
                : SubserieResource::collection($subseries)->response()->getData(true),
            'Subseries recuperadas exitosamente'
        );
    }

    public function store(StoreSubserieRequest $request)
    {
        $subserie = Subserie::create($request->validated());
        return $this->successResponse(new SubserieResource($subserie), 'Subserie creada exitosamente', 201);
    }

    public function show($id)
    {
        $subserie = Subserie::with('serie')->findOrFail($id);
        return $this->successResponse(new SubserieResource($subserie), 'Subserie recuperada exitosamente');
    }

    public function update(UpdateSubserieRequest $request, $id)
    {
        // en apiresource el parámetro puede ser 'subseries' o 'subserie'
        $subserieIdFromRoute = $request->route('subseries') ?: $request->route('subserie');
        $idToFind = is_object($subserieIdFromRoute) ? $subserieIdFromRoute->id : ($subserieIdFromRoute ?: $id);

        $subserie = Subserie::findOrFail($idToFind);
        $subserie->update($request->validated());
        return $this->successResponse(new SubserieResource($subserie->load('serie')), 'Subserie actualizada exitosamente');
    }

    public function destroy($id)
    {
        $subserieIdFromRoute = request()->route('subseries') ?: request()->route('subserie');
        $idToFind = is_object($subserieIdFromRoute) ? $subserieIdFromRoute->id : ($subserieIdFromRoute ?: $id);

        $subserie = Subserie::findOrFail($idToFind);
        
        if ($subserie->expedientes()->count() > 0) {
            return $this->errorResponse("No se puede eliminar la subserie '{$subserie->codigo}' porque tiene Expedientes vinculados. Elimine o reasigne los expedientes primero.", 422);
        }

        $subserie->delete();
        return $this->successResponse(null, 'Subserie eliminada exitosamente');
    }
}
