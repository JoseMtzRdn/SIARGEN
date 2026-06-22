<?php

namespace App\Http\Controllers\Api\Archivistica;

use App\Http\Controllers\Controller;
use App\Models\SerieDocumental;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use App\Http\Requests\Api\SerieDocumental\StoreSerieDocumentalRequest;
use App\Http\Requests\Api\SerieDocumental\UpdateSerieDocumentalRequest;
use App\Http\Resources\Api\Archivistica\SerieDocumentalResource;

class SerieDocumentalController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $query = SerieDocumental::with('seccion')->withCount(['subseries', 'expedientes']);

        if ($request->filled('seccion_id')) {
            $query->where('seccion_id', $request->seccion_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('codigo', 'LIKE', "%{$search}%");
            });
        }

        $series = $request->get('per_page') == -1 ? $query->get() : $query->paginate($request->get('per_page', 15));

        return $this->successResponse(
            $request->get('per_page') == -1 
                ? SerieDocumentalResource::collection($series) 
                : SerieDocumentalResource::collection($series)->response()->getData(true),
            'Series documentales recuperadas exitosamente'
        );
    }

    public function store(StoreSerieDocumentalRequest $request)
    {
        $serie = SerieDocumental::create($request->validated());
        return $this->successResponse(new SerieDocumentalResource($serie), 'Serie documental creada exitosamente', 201);
    }

    public function show($id)
    {
        $serie = SerieDocumental::with(['seccion', 'subseries'])->findOrFail($id);
        return $this->successResponse(new SerieDocumentalResource($serie), 'Serie documental recuperada exitosamente');
    }

    public function update(UpdateSerieDocumentalRequest $request, $id)
    {
        $serie = SerieDocumental::findOrFail($id);
        $serie->update($request->validated());
        return $this->successResponse(new SerieDocumentalResource($serie->load('seccion')), 'Serie documental actualizada exitosamente');
    }

    public function destroy($id)
    {
        $serie = SerieDocumental::findOrFail($id);
        
        if ($serie->subseries()->count() > 0) {
            return $this->errorResponse("No se puede eliminar la serie '{$serie->codigo}' porque tiene Subseries vinculadas. Elimine primero las subseries.", 422);
        }

        if ($serie->expedientes()->count() > 0) {
            return $this->errorResponse("No se puede eliminar la serie '{$serie->codigo}' porque tiene Expedientes registrados. Elimine o reasigne los expedientes primero.", 422);
        }

        $serie->delete();
        return $this->successResponse(null, 'Serie documental eliminada exitosamente');
    }
}
