<?php

namespace App\Services;

use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;
use Illuminate\Support\Facades\Log;

class PdfConverterService
{
    // Convierte archivos DOCX a PDF mediante resolución de dependencias locales.
    public function convertToPdf(string $docxPath, string $pdfPath): bool
    {
        if (!file_exists($docxPath)) {
            throw new \Exception("El archivo origen no existe: {$docxPath}");
        }

        $tempDir = dirname($pdfPath);
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $converted = false;

        // 1.
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            try {
                $winDocxPath = str_replace("'", "''", str_replace('/', '\\', $docxPath));
                $winPdfPath = str_replace("'", "''", str_replace('/', '\\', $pdfPath));
                
                // ejecución vía powershell para evitar bloqueos de proceso
                $psCommand = "powershell -NoProfile -Command \"\$word = New-Object -ComObject Word.Application; \$word.Visible = \$false; \$doc = \$word.Documents.Open('{$winDocxPath}'); \$doc.SaveAs([ref]'{$winPdfPath}', [ref]17); \$doc.Close(); \$word.Quit();\"";
                
                exec($psCommand, $output, $returnVar);
                
                if ($returnVar === 0 && file_exists($pdfPath)) {
                    $converted = true;
                }
            } catch (\Exception $e) {
                Log::warning("PdfConverterService: Falló conversión por Word COM: " . $e->getMessage());
            }
        }

        // 2.
        if (!$converted) {
            try {
                $winDocxPath = str_replace('/', '\\', $docxPath);
                $command = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') 
                    ? 'soffice --headless --convert-to pdf --outdir ' . escapeshellarg($tempDir) . ' ' . escapeshellarg($winDocxPath)
                    : 'libreoffice --headless --convert-to pdf --outdir ' . escapeshellarg($tempDir) . ' ' . escapeshellarg($docxPath);
                
                exec($command, $output, $returnVar);
                
                if (file_exists($pdfPath)) {
                    $converted = true;
                }
            } catch (\Exception $e) {
                Log::warning("PdfConverterService: Falló conversión por LibreOffice: " . $e->getMessage());
            }
        }

        // 3.
        if (!$converted) {
            try {
                Settings::setPdfRendererName(Settings::PDF_RENDERER_DOMPDF);
                Settings::setPdfRendererPath(base_path('vendor/dompdf/dompdf'));
                
                $phpWord = IOFactory::load($docxPath);
                $pdfWriter = IOFactory::createWriter($phpWord, 'PDF');
                $pdfWriter->save($pdfPath);
                
                $converted = true;
            } catch (\Exception $e) {
                Log::error("PdfConverterService: Falló conversión por DomPDF: " . $e->getMessage());
                throw new \Exception("No se pudo convertir el documento a PDF por ningún método disponible.");
            }
        }

        return $converted;
    }
}
