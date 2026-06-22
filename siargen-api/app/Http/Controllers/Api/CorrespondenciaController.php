<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CorrespondenciaRequest;
use App\Http\Resources\Api\CorrespondenciaResource;
use App\Services\CorrespondenciaService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CorrespondenciaController extends Controller
{
    use ApiResponseTrait;

    protected $service;

    public function __construct(CorrespondenciaService $service)
    {
        $this->service = $service;
    }

    // Obtiene el listado de correspondencia aplicando filtros y aislamiento por unidad.
    public function index(Request $request)
    {
        try {
            // Define la consulta base con proyección explícita de campos.
            $query = \App\Models\Correspondencia::query()
                ->select([
                    'id', 'folio_sistema', 'tipo', 'num_oficio', 'fecha',
                    'remitente', 'destinatario', 'asunto', 'prioridad',
                    'clase_documento', 'num_fojas',
                    'fecha_limite_respuesta', 'documento_pdf_path',
                    'unidad_administrativa_id', 'user_id', 'expediente_id',
                    'seccion_id', 'serie_id', 'subserie_id', 'estatus', 'created_at', 'updated_at'
                ])
                ->with(['unidadAdministrativa', 'expediente', 'serie', 'subserie', 'usuario']);

            // filtro por tipo (entrada/salida)
            if ($request->filled('tipo')) {
                $query->where('tipo', strtoupper($request->tipo));
            }

            // filtro por estatus
            if ($request->filled('estatus')) {
                $query->where('estatus', $request->estatus);
            }

            // buscador global
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('folio_sistema', 'LIKE', "%{$search}%")
                      ->orWhere('asunto', 'LIKE', "%{$search}%")
                      ->orWhere('remitente', 'LIKE', "%{$search}%")
                      ->orWhere('destinatario', 'LIKE', "%{$search}%")
                      ->orWhere('num_oficio', 'LIKE', "%{$search}%");
                });
            }

            $user = auth()->user();
            if ($user->role?->slug === 'rat') {
                $query->where(function($q) {
                    $q->whereNull('expediente_id') // documentos no archivados
                      ->orWhereHas('expediente', function($qe) {
                          $qe->where('fase', \App\Models\Expediente::FASE_TRAMITE); // solo fase trámite
                      });
                });
            }

            $perPage = $request->get('per_page', 15);
            
            if ($perPage == -1) {
                $correspondencia = $query->orderBy('created_at', 'desc')->get();
            } else {
                $correspondencia = $query->orderBy('created_at', 'desc')->paginate($perPage);
            }

            return $this->successResponse(
                $perPage == -1 
                    ? CorrespondenciaResource::collection($correspondencia) 
                    : CorrespondenciaResource::collection($correspondencia)->response()->getData(true),
                'Correspondencia recuperada exitosamente'
            );
        } catch (\Throwable $e) {
            Log::error("Fallo Crítico en CorrespondenciaController@index: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return $this->errorResponse('Error interno al cargar correspondencia: ' . $e->getMessage(), 500);
        }
    }

    // Almacena un nuevo registro de correspondencia.
    public function store(CorrespondenciaRequest $request)
    {
        try {
            $correspondencia = $this->service->create($request->validated());
            return $this->successResponse(
                new CorrespondenciaResource($correspondencia->load(['unidadAdministrativa', 'serie', 'subserie', 'usuario'])),
                'Correspondencia registrada exitosamente',
                201
            );
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Error de Base de Datos al registrar correspondencia: " . $e->getMessage());
            return $this->errorResponse('No se pudo guardar el registro. Verifique que los textos no excedan los límites permitidos.', 422);
        } catch (\Exception $e) {
            Log::error("Error general al registrar correspondencia: " . $e->getMessage());
            return $this->errorResponse('Ocurrió un error inesperado al procesar el registro.', 422);
        }
    }

    // ver detalle de un registro.
    public function show($id)
    {
        $correspondencia = $this->service->find($id);
        return $this->successResponse(
            new CorrespondenciaResource($correspondencia->load(['unidadAdministrativa', 'expediente', 'serie', 'subserie', 'usuario'])),
            'Detalle de correspondencia recuperado'
        );
    }

    // actualizar registro.
    public function update(CorrespondenciaRequest $request, $id)
    {
        try {
            $correspondencia = $this->service->updateRecord($id, $request->validated());
            return $this->successResponse(
                new CorrespondenciaResource($correspondencia->load(['unidadAdministrativa', 'serie', 'subserie', 'usuario'])),
                'Registro actualizado correctamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    // eliminación lógica (auditada).
    public function destroy(Request $request, $id)
    {
        $request->validate(['motivo' => 'required|string|min:10']);
        
        try {
            $this->service->deleteWithReason($id, $request->motivo);
            return $this->successResponse(null, 'Registro eliminado exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    // acción de archivar vinculando a un expediente.
    public function archivar(Request $request, $id)
    {
        $request->validate(['expediente_id' => 'required|exists:expedientes,id']);

        try {
            $correspondencia = $this->service->archivar($id, $request->expediente_id);
            return $this->successResponse(
                new CorrespondenciaResource($correspondencia->load(['unidadAdministrativa', 'expediente', 'serie', 'subserie', 'usuario'])),
                'Documento archivado exitosamente en el expediente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    // mover documento de un expediente a otro (re-archivado).
    public function cambiarExpediente(Request $request, $id)
    {
        $request->validate([
            'nuevo_expediente_id' => 'required|exists:expedientes,id',
            'motivo' => 'required|string|min:10'
        ]);

        try {
            $correspondencia = $this->service->cambiarExpediente($id, $request->nuevo_expediente_id, $request->motivo);
            return $this->successResponse(
                new CorrespondenciaResource($correspondencia->load(['unidadAdministrativa', 'expediente', 'serie', 'subserie', 'usuario'])),
                'Expediente del documento cambiado exitosamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    // desarchivar un documento (regresar a pendiente).
    public function desarchivar(Request $request, $id)
    {
        $request->validate(['motivo' => 'required|string|min:10']);

        try {
            $correspondencia = $this->service->desarchivar($id, $request->motivo);
            return $this->successResponse(
                new CorrespondenciaResource($correspondencia->load(['unidadAdministrativa', 'serie', 'subserie', 'usuario'])),
                'Documento desarchivado y regresado a estatus pendiente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
