<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PrestamoService;
use App\Http\Resources\Api\PrestamoResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;

use App\Services\PdfConverterService;

class PrestamoController extends Controller
{
    use ApiResponseTrait;

    protected $service;
    protected $pdfConverter;

    public function __construct(PrestamoService $service, PdfConverterService $pdfConverter)
    {
        $this->service = $service;
        $this->pdfConverter = $pdfConverter;
    }

    public function index(Request $request)
    {
        $query = \App\Models\Prestamo::with([
            'detalles.expediente' => function($q) {
                $q->withCount('documentos')->with(['serie', 'subserie']);
            }, 
            'unidadAdministrativa', 
            'usuarioPresta'
        ]);

        if ($request->has('estatus') && $request->estatus !== 'todos') {
            $query->where('estatus', $request->estatus);
        }

        // filtrar por fase (tramite o concentracion)
        if ($request->has('fase')) {
            $faseFilter = $request->fase;
            if ($faseFilter === 'tramite' || $faseFilter == \App\Models\Expediente::FASE_TRAMITE) {
                $query->where('fase', \App\Models\Expediente::FASE_TRAMITE);
            } elseif ($faseFilter === 'concentracion' || $faseFilter == \App\Models\Expediente::FASE_CONCENTRACION) {
                $query->where('fase', \App\Models\Expediente::FASE_CONCENTRACION);
            }
        }

        // Filtra por unidad administrativa.
        if ($request->has('unidad_administrativa_id')) {
            $query->where('unidad_administrativa_id', $request->unidad_administrativa_id);
        }

        $perPage = $request->input('per_page', 15);

        if ($perPage == -1) {
            $prestamos = $query->orderBy('fecha_prestamo', 'desc')->get();
            return $this->successResponse(
                PrestamoResource::collection($prestamos)->resolve(),
                'Préstamos recuperados'
            );
        }

        $prestamos = $query->orderBy('fecha_prestamo', 'desc')->paginate($perPage);

        return $this->successResponse(
            PrestamoResource::collection($prestamos)->response()->getData(true),
            'Préstamos recuperados'
        );
    }

    public function store(Request $request)
    {
        $data = $request->all();
        
        // Filtra campos nulos o vacíos en la petición.
        foreach(['telefono', 'extension', 'apellido_materno', 'cargo_solicitante', 'unidad_solicitante', 'observaciones'] as $field) {
            if (isset($data[$field]) && empty($data[$field])) {
                $data[$field] = null;
            }
        }

        $request->merge($data);

        $request->validate([
            'expedientes_ids' => 'required|array|min:1',
            'expedientes_ids.*' => 'exists:expedientes,id',
            'unidad_administrativa_id' => 'required|exists:unidades_administrativas,id',
            'fase' => 'nullable|in:tramite,concentracion,1,2',
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'required|string|max:100',
            'apellido_materno' => 'required|string|max:100',
            'cargo_solicitante' => 'required|string|max:255',
            'telefono' => 'required|string|digits:10',
            'extension' => 'nullable|string|max:6',
            'fecha_vencimiento' => 'required|date|after:today',
            'estado_salida' => 'nullable|in:bueno,completo,incompleto,regular,malo',
        ], [
            'expedientes_ids.required' => 'Debe seleccionar al menos un expediente.',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser al menos un día posterior a hoy.',
            'nombre.required' => 'El nombre es obligatorio.',
            'apellido_paterno.required' => 'El apellido paterno es obligatorio.',
            'apellido_materno.required' => 'El apellido materno es obligatorio.',
            'cargo_solicitante.required' => 'El cargo es obligatorio.',
            'telefono.required' => 'El teléfono de 10 dígitos es obligatorio.',
            'telefono.digits' => 'El teléfono debe ser de exactamente 10 dígitos.'
        ]);

        try {
            $prestamo = $this->service->createLoan($request->all());
            // cargar relaciones para el recurso
            $prestamo->load(['detalles.expediente.serie', 'detalles.expediente.subserie', 'unidadAdministrativa', 'usuarioPresta']);
            
            return $this->successResponse(
                new PrestamoResource($prestamo),
                'Vale de préstamo generado correctamente',
                201
            );
        } catch (\Illuminate\Database\QueryException $e) {
            \Illuminate\Support\Facades\Log::error("Database Error: " . $e->getMessage());
            return $this->errorResponse('Error de integridad en la base de datos.', 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function show($id)
    {
        $prestamo = \App\Models\Prestamo::with([
            'detalles.expediente' => function($q) {
                $q->withCount('documentos')->with(['serie', 'subserie']);
            }, 
            'unidadAdministrativa', 
            'usuarioPresta'
        ])->findOrFail($id);
        return $this->successResponse(new PrestamoResource($prestamo), 'Detalle del préstamo');
    }

    public function devolver(Request $request, $id)
    {
        // $id es el id del detalle individual
        $request->validate([
            'estado_devolucion' => 'required|in:bueno,completo,incompleto,regular,malo',
            'observaciones' => 'nullable|string'
        ]);

        try {
            $detalle = \App\Models\PrestamoDetalle::findOrFail($id);
            
            // jerarquía de estados (3: mejor, 0: peor)
            $ranks = [
                'bueno' => 3,
                'completo' => 3,
                'regular' => 2,
                'incompleto' => 1,
                'malo' => 0
            ];

            $estadoSalida = strtolower($detalle->estado_salida ?? 'bueno');
            $estadoEntrada = strtolower($request->estado_devolucion);

            $rankSalida = $ranks[$estadoSalida] ?? 3;
            $rankEntrada = $ranks[$estadoEntrada] ?? 3;

            if ($rankEntrada > $rankSalida) {
                throw new \Exception("Integridad de Estado: El expediente no puede regresar en un estado mejor al que salió (" . mb_strtoupper($estadoSalida) . ").");
            }

            $data = [
                'estado_devolucion' => $request->input('estado_devolucion'),
                'observaciones' => $request->input('observaciones')
            ];
            $prestamo = $this->service->returnExpediente($id, $data);
            return $this->successResponse(new PrestamoResource($prestamo), 'Expediente devuelto correctamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function imprimir($id)
    {
        $prestamo = \App\Models\Prestamo::with(['detalles.expediente', 'unidadAdministrativa', 'usuarioPresta'])->findOrFail($id);
        
        $tempDocx = null;
        $tempPdf = null;

        try {
            // Verifica la plantilla para el Anexo 6.
            $templatePath = storage_path('app/templates/vale_prestamo.docx');
            
            if (!file_exists($templatePath)) {
                // Ruta alternativa de plantilla en entorno local.
                $fallbackPath = base_path('../ANEXO 6 VALE DE PRESTAMO DE EXPEDIENTES.docx');
                if (file_exists($fallbackPath)) {
                    $templatePath = $fallbackPath;
                } else {
                    return $this->errorResponse('La plantilla del Anexo 6 no se encuentra.', 404);
                }
            }

            $templateProcessor = new TemplateProcessor($templatePath);

       
            $fondoNombre = \App\Models\Fondo::first()?->nombre ?? 'Instituto de Salud del Estado de México';
            $templateProcessor->setValue('fondo', $fondoNombre);
            $templateProcessor->setValue('folio_prestamo', $prestamo->folio_prestamo);
            $templateProcessor->setValue('fecha_prestamo', $prestamo->fecha_prestamo?->format('d/m/Y') ?? '');
            $templateProcessor->setValue('fecha_vencimiento', $prestamo->fecha_vencimiento?->format('d/m/Y') ?? '');
            
            // Asigna la fecha de devolución global únicamente al completar la entrega de todos los expedientes.
            $todosDevueltos = true;
            $ultimaFechaDevolucion = null;

            foreach ($prestamo->detalles as $detalle) {
                if (is_null($detalle->fecha_devolucion)) {
                    $todosDevueltos = false;
                    break; // si uno falta, no hay fecha global
                }
                
                if (is_null($ultimaFechaDevolucion) || $detalle->fecha_devolucion > $ultimaFechaDevolucion) {
                    $ultimaFechaDevolucion = $detalle->fecha_devolucion;
                }
            }

            $fechaDevolucionStr = ($todosDevueltos && $ultimaFechaDevolucion) ? $ultimaFechaDevolucion->format('d/m/Y') : '';
            $templateProcessor->setValue('fecha_ devolucion', $fechaDevolucionStr); // mantenemos espacio accidental por compatibilidad con plantilla
            
            $templateProcessor->setValue('unidad_que_presta', $prestamo->unidadAdministrativa?->nombre ?? '');
            $templateProcessor->setValue('observaciones_prestamo', $prestamo->observaciones ?? '');
            
            // TUA de la unidad solicitante: si pertenece al catálogo, se obtiene su titular.
            $tuaNombre = $prestamo->nombre_completo; // por defecto el solicitante (modo externo)
            $tuaCargo = $prestamo->cargo_solicitante;

            if ($prestamo->unidad_solicitante) {
                // Relaciona la unidad administrativa correspondiente mediante el catálogo.
                $unidadSolicitanteModel = \App\Models\UnidadAdministrativa::where('nombre', $prestamo->unidad_solicitante)->first();
                
                if ($unidadSolicitanteModel) {
                    $titular = $unidadSolicitanteModel->titular; 
                    if ($titular) {
                        // si es interna y tiene tua, usamos al tua
                        $tuaNombre = $titular->full_name;
                        $tuaCargo = $titular->cargo ?? '';
                    }
                }
            }

            // Reemplaza firmas y nombres de involucrados.
            $templateProcessor->setValue('tua_unidad_solicitante', $tuaNombre);
            $templateProcessor->setValue('cargo_tua_solicitante', $tuaCargo);
            $templateProcessor->setValue('unidad_solicitante', $prestamo->unidad_solicitante ?? '');
            
            // solicitante (el que físicamente recibe)
            $templateProcessor->setValue('representante_solicitante', $prestamo->nombre_completo);
            $templateProcessor->setValue('cargo_solicitante', $prestamo->cargo_solicitante ?? '');
            
            // rac (quien prestó)
            $racNombre = trim($prestamo->usuarioPresta?->nombre . ' ' . $prestamo->usuarioPresta?->apellido_paterno . ' ' . $prestamo->usuarioPresta?->apellido_materno);
            $templateProcessor->setValue('RAC_nombre', $racNombre);
            $templateProcessor->setValue('cargo_RAC', 'Responsable de Archivo de Concentración');

            // buscar al coordinador de archivos (si existe en el sistema)
            $coordinador = \App\Models\User::whereHas('role', function($q) { $q->where('slug', 'coord_archivos'); })->first();
            $coordNombre = $coordinador ? trim($coordinador->nombre . ' ' . $coordinador->apellido_paterno . ' ' . $coordinador->apellido_materno) : '';
            $templateProcessor->setValue('coordinador_archivos', $coordNombre);
            $templateProcessor->setValue('cargo_coordinador', 'Coordinador de Archivos');
            
            $numExpedientes = count($prestamo->detalles);

      
            $rowVariablesResumen = ['n_r', 'numero_progresivo_r', 'clave_r', 'clave_expediente_r'];
            foreach ($rowVariablesResumen as $rowVar) {
                try {
                    $templateProcessor->cloneRow($rowVar, $numExpedientes);
                    break;
                } catch (\Exception $e) { continue; }
            }


            try {
                $templateProcessor->cloneBlock('bloque_expediente', $numExpedientes, true, true);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("No se encontró el bloque 'bloque_expediente' en la plantilla.");
            }

            foreach ($prestamo->detalles as $index => $detalle) {
                $i = $index + 1;
                $numDoc = $detalle->expediente->documentos()->count();
                $legajos = $detalle->expediente->num_legajos ?? '1';
                $sec = $detalle->expediente->ubicacion_seccion ?? '';
                $bat = $detalle->expediente->ubicacion_bateria ?? '';
                $mod = $detalle->expediente->ubicacion_modulo ?? '';
                $ent = $detalle->expediente->ubicacion_entrepaño ?? '';
                $caj = $detalle->expediente->numero_cajas ?? '1';
                $esSal = $detalle->estado_salida ?? 'BUENO';
                $esDev = $detalle->estado_devolucion ?? '';
                $obs = $detalle->observaciones_devolucion ?? '';
                $ano = $detalle->expediente->año_apertura ?? $detalle->expediente->created_at->format('Y');

                // valores para tabla 1 (resumen - con sufijo _r)
                $templateProcessor->setValue('n_r#' . $i, $i);
                $templateProcessor->setValue('numero_progresivo_r#' . $i, $i);
                $templateProcessor->setValue('clave_r#' . $i, $detalle->expediente->numero_expediente);
                $templateProcessor->setValue('clave_expediente_r#' . $i, $detalle->expediente->numero_expediente);
                $templateProcessor->setValue('titulo_r#' . $i, $detalle->expediente->titulo);
                $templateProcessor->setValue('año_r#' . $i, $ano);
                $templateProcessor->setValue('numero_documentos_expediente_r#' . $i, $numDoc);
                $templateProcessor->setValue('legajos_expediente_r#' . $i, $legajos);
                $templateProcessor->setValue('numero_cajas_r#' . $i, $caj);

                // valores para tabla 2 (detalle / bloque)
                $templateProcessor->setValue('numero_progresivo#' . $i, $i);
                $templateProcessor->setValue('clave_expediente#' . $i, $detalle->expediente->numero_expediente);
                $templateProcessor->setValue('titulo#' . $i, $detalle->expediente->titulo);
                $templateProcessor->setValue('año#' . $i, $ano);
                $templateProcessor->setValue('numero_documentos_expediente#' . $i, $numDoc);
                $templateProcessor->setValue('legajos_expediente#' . $i, $legajos); 
                $templateProcessor->setValue('ubicacion_seccion#' . $i, $sec);
                $templateProcessor->setValue('ubicacion_bateria#' . $i, $bat);
                $templateProcessor->setValue('ubicacion_modulo#' . $i, $mod);
                $templateProcessor->setValue('ubicacion_entrepaño#' . $i, $ent);
                $templateProcessor->setValue('numero_cajas#' . $i, $caj);
                $templateProcessor->setValue('estado_salida#' . $i, $esSal);
                $templateProcessor->setValue('estado_devolucion#' . $i, $esDev);
                $templateProcessor->setValue('observaciones_prestamo_detalles#' . $i, $obs);
                
                // Manejo de variables sin índice para retrocompatibilidad.
                if ($i === 1) {
                    $templateProcessor->setValue('n_r', '1');
                    $templateProcessor->setValue('numero_progresivo_r', '1');
                    $templateProcessor->setValue('clave_r', $detalle->expediente->numero_expediente);
                    $templateProcessor->setValue('clave_expediente_r', $detalle->expediente->numero_expediente);
                    $templateProcessor->setValue('titulo_r', $detalle->expediente->titulo);
                    $templateProcessor->setValue('año_r', $ano);
                    $templateProcessor->setValue('numero_documentos_expediente_r', $numDoc);
                    $templateProcessor->setValue('legajos_expediente_r', $legajos);
                    $templateProcessor->setValue('numero_cajas_r', $caj);
                    
                    $templateProcessor->setValue('numero_progresivo', '1');
                    $templateProcessor->setValue('año', $ano);
                    $templateProcessor->setValue('numero_documentos_expediente', $numDoc);
                    $templateProcessor->setValue('legajos_expediente', $legajos);
                    $templateProcessor->setValue('ubicacion_seccion', $sec);
                    $templateProcessor->setValue('ubicacion_bateria', $bat);
                    $templateProcessor->setValue('ubicacion_modulo', $mod);
                    $templateProcessor->setValue('ubicacion_entrepaño', $ent);
                    $templateProcessor->setValue('numero_cajas', $caj);
                    $templateProcessor->setValue('estado_salida', $esSal);
                    $templateProcessor->setValue('estado_devolucion', $esDev);
                    $templateProcessor->setValue('observaciones_prestamo_detalles', $obs);
                }
            }

            // reemplazo global (opcional)
            $templateProcessor->setValue('clave_expediente', implode(', ', $prestamo->detalles->pluck('expediente.numero_expediente')->toArray()));
            $templateProcessor->setValue('titulo', implode(', ', $prestamo->detalles->pluck('expediente.titulo')->toArray()));

            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            
            $fileName = 'vale_prestamo_' . $prestamo->folio_prestamo . '_' . time();
            $tempDocx = $tempDir . DIRECTORY_SEPARATOR . $fileName . '.docx';
            $templateProcessor->saveAs($tempDocx);

            $tempPdf = $tempDir . DIRECTORY_SEPARATOR . $fileName . '.pdf';
            $this->pdfConverter->convertToPdf($tempDocx, $tempPdf);

            return response()->download($tempPdf, "Vale_Prestamo_{$prestamo->folio_prestamo}.pdf")->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error en imprimir vale: " . $e->getMessage());
            return $this->errorResponse('Error al generar el documento PDF del vale. Por favor, asegúrese de que la plantilla (.docx) contenga las variables correctas (ej. ${folio_prestamo}, ${numero_expediente}). Detalles: ' . $e->getMessage(), 500);
        } finally {
            if ($tempDocx && file_exists($tempDocx)) @unlink($tempDocx);
        }
    }
}
