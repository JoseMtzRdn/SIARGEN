<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;

use App\Services\PdfConverterService;

class DocumentoController extends Controller
{
    use ApiResponseTrait;

    protected $pdfConverter;

    public function __construct(PdfConverterService $pdfConverter)
    {
        $this->pdfConverter = $pdfConverter;
    }

    public function generarNombramiento(Request $request, $id)
    {
        $targetUser = User::with(['role', 'unidadAdministrativa'])->findOrFail($id);
        $tua = auth()->user();

        // Valida permisos del TUA de la unidad o del Administrador de TI.
        if (!$tua->isAdminTi() && (!$tua->isTua() || $tua->unidad_administrativa_id !== $targetUser->unidad_administrativa_id)) {
            return $this->errorResponse('No tiene permisos para generar este nombramiento.', 403);
        }

        // Valida que el destinatario sea RAT o Correspondencia.
        if (!$targetUser->isRat() && !$targetUser->isRespCorrespondencia()) {
            return $this->errorResponse('El usuario seleccionado no tiene un rol válido para generar nombramiento.', 422);
        }

        // verificar que el usuario esté activo
        if (!$targetUser->activo) {
            return $this->errorResponse('No se puede generar un nombramiento para un usuario inactivo.', 422);
        }

        // determinar tipo de nombramiento según el rol
        $roleSlug = $targetUser->role->slug;
        $config = [
            'rat' => [
                'template' => 'nombramiento_rat.docx',
                'var_prefix' => 'rat',
                'label' => 'Responsable de Archivo de Tramite'
            ],
            'correspondencia' => [
                'template' => 'nombramiento_rdc.docx',
                'var_prefix' => 'rdc',
                'label' => 'Responsable de Correspondencia'
            ]
        ];

        if (!isset($config[$roleSlug])) {
            return $this->errorResponse('El usuario seleccionado no tiene un rol válido para generar nombramiento.', 422);
        }

        $currentConfig = $config[$roleSlug];
        $tempDocx = null;
        $tempPdf = null;

        try {
            $templatePath = storage_path('app/templates/' . $currentConfig['template']);
            
            if (!file_exists($templatePath)) {
                \Log::error("Plantilla no encontrada en: " . $templatePath);
                return $this->errorResponse('La plantilla de nombramiento no se encuentra en el servidor.', 404);
            }

            $templateProcessor = new TemplateProcessor($templatePath);

            // Reemplaza variables generales en la plantilla.
            $templateProcessor->setValue('fecha', now()->locale('es')->translatedFormat('d \d\e F \d\e Y'));
            $templateProcessor->setValue('Año', now()->format('Y'));
            $templateProcessor->setValue('unidad', $targetUser->unidadAdministrativa ? $targetUser->unidadAdministrativa->nombre : 'Unidad No Asignada');
            $templateProcessor->setValue('nombre_tua', $tua->full_name);
            $templateProcessor->setValue('cargo_tua', $tua->cargo);

            // Reemplaza variables del destinatario.
            $templateProcessor->setValue('nombre_' . $currentConfig['var_prefix'], $targetUser->full_name);
            $templateProcessor->setValue('cargo_' . $currentConfig['var_prefix'], $targetUser->cargo);

            // Inicializa rutas temporales de almacenamiento.
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            
            $fileName = 'nombramiento_' . $targetUser->username . '_' . time();
            $tempDocx = $tempDir . DIRECTORY_SEPARATOR . $fileName . '.docx';
            $templateProcessor->saveAs($tempDocx);

            $tempPdf = $tempDir . DIRECTORY_SEPARATOR . $fileName . '.pdf';
            $this->pdfConverter->convertToPdf($tempDocx, $tempPdf);

            return response()->download($tempPdf, "Nombramiento - {$currentConfig['label']}.pdf")->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error("Error en generarNombramiento: " . $e->getMessage());
            return $this->errorResponse('Error al generar el documento: ' . $e->getMessage(), 500);
        } finally {
            if ($tempDocx && file_exists($tempDocx)) @unlink($tempDocx);
        }
    }
}
