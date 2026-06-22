<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TransferenciaService;
use App\Http\Resources\Api\TransferenciaResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

use App\Services\PdfConverterService;

class TransferenciaController extends Controller
{
    use ApiResponseTrait;

    protected $service;
    protected $pdfConverter;

    public function __construct(TransferenciaService $service, PdfConverterService $pdfConverter)
    {
        $this->service = $service;
        $this->pdfConverter = $pdfConverter;
    }

    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $query = \App\Models\Transferencia::with(['unidadOrigen', 'usuarioEnvia', 'usuarioRecibe', 'expedientes.serie']);

            // aislamiento y visibilidad por rol
            
            if ($user->isAdminTi() || $user->isCoordArchivos()) {
                // administradores y coordinadores: ven todo por defecto.
                if ($request->has('tipo')) {
                    $query->where('tipo', $request->tipo);
                }
                // Filtra por unidad administrativa.
                if ($request->has('unidad_administrativa_id')) {
                    $query->where('unidad_origen_id', $request->unidad_administrativa_id);
                }
            } elseif ($user->isRac()) {
                // Filtro de visualización para perfil RAC.
                $query->where('tipo', 'primaria')
                      ->whereIn('estatus', ['autorizada', 'en_transito', 'recibida', 'rechazada_rac']);
            } elseif ($user->isRah()) {
                // Filtro de visualización para perfil RAH.
                $query->where('tipo', 'secundaria')
                      ->whereIn('estatus', ['autorizada', 'en_transito', 'recibida', 'rechazada_rah']);
            } elseif ($user->isTua() || $user->isRat()) {
                // tua y rat: aislamiento estricto por unidad administrativa de origen.
                $query->where('unidad_origen_id', $user->unidad_administrativa_id);
                if ($request->has('tipo')) {
                    $query->where('tipo', $request->tipo);
                }
            } else {
                // otros roles (consulta, etc.): no ven nada a menos que pertenezcan a la unidad.
                $query->where('unidad_origen_id', $user->unidad_administrativa_id);
            }

            // filtro opcional por estatus (aplica sobre el filtrado previo)
            if ($request->has('estatus') && $request->estatus !== 'todos') {
                $query->where('estatus', $request->estatus);
            }

            $perPage = $request->input('per_page', 10);

            if ($perPage == -1) {
                $transferencias = $query->orderBy('created_at', 'desc')->get();
                return $this->successResponse(
                    TransferenciaResource::collection($transferencias)->resolve(),
                    'Transferencias recuperadas'
                );
            }

            $transferencias = $query->orderBy('created_at', 'desc')->paginate($perPage);
            return $this->successResponse(
                TransferenciaResource::collection($transferencias)->response()->getData(true),
                'Transferencias recuperadas'
            );
        } catch (\Illuminate\Database\QueryException $e) {
            \Illuminate\Support\Facades\Log::error("Error SQL en listado de transferencias: " . $e->getMessage());
            return $this->errorResponse('Error de base de datos al recuperar las transferencias.', 500);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    protected function isReadOnlyUser($user)
    {
        // Permite acciones operativas para Coordinador o TUA.
        return $user->isRespCorrespondencia() || $user->isConsulta();
    }

    public function store(Request $request)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('No tiene permisos para realizar esta operación.', 403);
        }

        $request->validate([
            'tipo' => 'required|in:primaria,secundaria',
            'expediente_ids' => 'required|array',
            'expediente_ids.*' => 'exists:expedientes,id',
            'observaciones' => 'nullable|string|max:500'
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
                $transferencia = $this->service->createTransfer($request->only('tipo', 'observaciones'), $request->expediente_ids);
                return $this->successResponse(
                    new TransferenciaResource($transferencia->load(['unidadOrigen', 'usuarioEnvia', 'expedientes'])), 
                    'Transferencia iniciada en fase de elaboración', 
                    201
                );
            });
        } catch (\Illuminate\Database\QueryException $e) {
            \Illuminate\Support\Facades\Log::error("Error SQL en registro de transferencia: " . $e->getMessage());
            return $this->errorResponse('Ocurrió un error en la base de datos al procesar la transferencia. Por favor, contacte a soporte técnico.', 500);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function show($id)
    {
        try {
            $transferencia = \App\Models\Transferencia::with([
                'unidadOrigen', 
                'usuarioEnvia', 
                'usuarioRecibe', 
                'expedientes.serie'
            ])->findOrFail($id);

            return $this->successResponse(new TransferenciaResource($transferencia), 'Detalle recuperado');
        } catch (\Exception $e) {
            return $this->errorResponse('Transferencia no encontrada', 404);
        }
    }

    public function enviarATua($id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        try {
            $transferencia = $this->service->sendToTua($id);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia enviada para autorización del Titular');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function autorizarTua($id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        try {
            $transferencia = $this->service->authorizeByTua($id);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia autorizada por el Titular y enviada al Coordinador');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function rechazarTua(Request $request, $id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        $request->validate(['motivo' => 'required|string|min:5']);
        try {
            $transferencia = $this->service->rejectByTua($id, $request->motivo);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia rechazada por el Titular');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function validar($id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('El Coordinador de Archivos tiene perfil de solo lectura y no puede realizar validaciones técnicas.', 403);
        }

        try {
            $transferencia = $this->service->validateByCoordinator($id);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia validada técnicamente correctamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function rechazarCoordinador(Request $request, $id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('El Coordinador de Archivos tiene perfil de solo lectura y no puede realizar rechazos técnicos.', 403);
        }

        $request->validate(['motivo' => 'required|string|min:5']);
        try {
            $transferencia = $this->service->rejectByCoordinator($id, $request->motivo);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia rechazada por el Coordinador');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function enviarARac($id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        try {
            $transferencia = $this->service->sendToConcentracion($id);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia enviada físicamente al RAC');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function recibir($id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        try {
            $transferencia = $this->service->receiveTransfer($id);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia recibida y expedientes actualizados');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function rechazarRac(Request $request, $id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        $request->validate(['motivo' => 'required|string|min:5']);
        try {
            $transferencia = $this->service->rejectByRac($id, $request->motivo);
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia rechazada por el RAC');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function resubmit(Request $request, $id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        
        $request->validate([
            'expediente_ids' => 'nullable|array',
            'expediente_ids.*' => 'exists:expedientes,id',
            'subsanacion_ids' => 'nullable|array',
            'subsanacion_ids.*' => 'exists:expedientes,id',
            'observaciones' => 'nullable|string'
        ]);

        try {
            $transferencia = $this->service->resubmitAfterSubsanacion(
                $id, 
                $request->expediente_ids ?? [], 
                $request->subsanacion_ids ?? [],
                $request->observaciones
            );
            return $this->successResponse(new TransferenciaResource($transferencia), 'Transferencia corregida y re-enviada exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function updateSubsanacion(Request $request, $id)
    {
        if ($this->isReadOnlyUser(auth()->user())) {
            return $this->errorResponse('Acción no permitida para perfil de solo lectura.', 403);
        }
        
        // log para depuración
        \Log::info("UpdateSubsanacion Request for ID {$id}", $request->all());

        $validator = \Validator::make($request->all(), [
            'expediente_ids' => 'required|array|min:1',
            'expediente_ids.*' => 'integer|exists:expedientes,id',
            'subsanacion_ids' => 'nullable|array',
            'subsanacion_ids.*' => 'integer|exists:expedientes,id',
            'observaciones' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación de datos',
                'errors' => $validator->errors(),
                'first_error' => $validator->errors()->first()
            ], 422);
        }

        try {
            $transferencia = $this->service->updateSubsanacion(
                $id, 
                $request->expediente_ids, 
                $request->subsanacion_ids ?? [],
                $request->observaciones
            );
            return $this->successResponse(new TransferenciaResource($transferencia), 'Cambios guardados exitosamente');
        } catch (\Exception $e) {
            \Log::error("Error en updateSubsanacion: " . $e->getMessage());
            return $this->errorResponse('Fallo interno: ' . $e->getMessage(), 422);
        }
    }

    public function imprimir($id)
    {
        $transferencia = \App\Models\Transferencia::with([
            'unidadOrigen', 
            'usuarioEnvia', 
            'usuarioRecibe', 
            'expedientes.serie'
        ])->findOrFail($id);

        $tempDocx = null;
        $tempPdf = null;

        try {
            $templatePath = storage_path('app/templates/inv_ADC_transferencias.docx');
            
            if (!file_exists($templatePath)) {
                return $this->errorResponse('La plantilla del Anexo 4 no se encuentra.', 404);
            }

            $templateProcessor = new \PhpOffice\PhpWord\TemplateProcessor($templatePath);

            $primerExpediente = $transferencia->expedientes->first();
            $nombreFondo = $primerExpediente?->serie?->seccion?->fondo?->nombre ?? 'Instituto de Salud del Estado de México';
            
            $templateProcessor->setValue('fondo', $nombreFondo);
            $templateProcessor->setValue('unidad_transfiere', $transferencia->unidadOrigen?->nombre ?? '');
            
            $fechaEnvio = $transferencia->fecha_envio;
            $fechaEnvStr = ($fechaEnvio instanceof \Carbon\Carbon) ? $fechaEnvio->format('d/m/Y') : (is_string($fechaEnvio) ? \Carbon\Carbon::parse($fechaEnvio)->format('d/m/Y') : '');
            $templateProcessor->setValue('fecha_solicitud_transferencia', $fechaEnvStr);

            $fechaRec = $transferencia->fecha_recepcion;
            $fechaRecStr = ($fechaRec instanceof \Carbon\Carbon) ? $fechaRec->format('d/m/Y') : (is_string($fechaRec) ? \Carbon\Carbon::parse($fechaRec)->format('d/m/Y') : '');
            $templateProcessor->setValue('fecha_rac_recibe_transferencia', $fechaRecStr);

            // tabla de expedientes
            $numExpedientes = count($transferencia->expedientes);
            $templateProcessor->cloneRow('prog', $numExpedientes);

            foreach ($transferencia->expedientes as $index => $exp) {
                $i = $index + 1;
                $templateProcessor->setValue('prog#' . $i, $i);
                
                // mapeo exacto de datos para el inventario respetando formato original
                $templateProcessor->setValue('seccion_expediente#' . $i, $exp->serie?->seccion?->nombre ?? '');
                $templateProcessor->setValue('serie_expediente#' . $i, $exp->serie?->nombre ?? '');
                
                $templateProcessor->setValue('clave_expediente#' . $i, $exp->numero_expediente);
                $templateProcessor->setValue('nombre_expediente#' . $i, $exp->titulo);
                
                // cálculo del periodo con meses (formato: mes año)
                $meses = [
                    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril', 
                    5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto', 
                    9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
                ];

                $f_apertura = $exp->created_at;
                $p_inicio = $meses[$f_apertura->month] . " " . $f_apertura->year;

                if ($exp->fecha_cierre) {
                    $f_cierre = $exp->fecha_cierre;
                    $p_fin = $meses[$f_cierre->month] . " " . $f_cierre->year;
                    $periodo = $p_inicio . " - " . $p_fin;
                } else {
                    $periodo = $p_inicio;
                }

                $templateProcessor->setValue('periodo_expediente#' . $i, $periodo);
                
                $templateProcessor->setValue('tiempo_expediente_concentracion#' . $i, $exp->serie?->vigencia_concentracion ?? '');
                $templateProcessor->setValue('legajos_expediente#' . $i, $exp->num_legajos);
                $templateProcessor->setValue('no_documentos_expediente#' . $i, $exp->documentos()->count());
                
                // uso del detalle del expediente en la columna de descripción/observaciones
                $templateProcessor->setValue('descripcion_expediente#' . $i, $exp->observaciones ?? 'S/D');
            }

            // firmas
            $ratNombre = trim($transferencia->usuarioEnvia?->nombre . ' ' . $transferencia->usuarioEnvia?->apellido_paterno . ' ' . $transferencia->usuarioEnvia?->apellido_materno);
            $templateProcessor->setValue('nombre_RAT', $ratNombre);
            $templateProcessor->setValue('cargo_RAT', $transferencia->usuarioEnvia?->cargo ?? 'Responsable de Archivo de Trámite');

            $tua = $transferencia->unidadOrigen?->titular;
            $tuaNombre = $tua ? trim($tua->nombre . ' ' . $tua->apellido_paterno . ' ' . $tua->apellido_materno) : '';
            $templateProcessor->setValue('nombre_TUA', $tuaNombre);
            $templateProcessor->setValue('cargo_TUA', $tua?->cargo ?? 'Titular de la Unidad Administrativa');

            $racNombre = trim($transferencia->usuarioRecibe?->nombre . ' ' . $transferencia->usuarioRecibe?->apellido_paterno . ' ' . $transferencia->usuarioRecibe?->apellido_materno);
            $templateProcessor->setValue('nombre_RAC', $racNombre);
            $templateProcessor->setValue('cargo_RAC', 'Responsable de Archivo de Concentración');

            // procesamiento
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            
            $fileName = 'inventario_ADC_' . str_replace('/', '_', $transferencia->numero_transferencia) . '_' . time();
            $tempDocx = $tempDir . DIRECTORY_SEPARATOR . $fileName . '.docx';
            $templateProcessor->saveAs($tempDocx);

            $tempPdf = $tempDir . DIRECTORY_SEPARATOR . $fileName . '.pdf';
            $this->pdfConverter->convertToPdf($tempDocx, $tempPdf);

            return response()->download($tempPdf, "Inventario_Concentracion_{$transferencia->numero_transferencia}.pdf")->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error("Error en imprimir inventario ADC: " . $e->getMessage());
            return $this->errorResponse('Error al generar el PDF del Anexo 4. Detalles: ' . $e->getMessage(), 500);
        } finally {
            if ($tempDocx && file_exists($tempDocx)) @unlink($tempDocx);
        }
    }
}
