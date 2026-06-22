<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transferencia;
use App\Http\Resources\Api\TransferenciaResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class TransferenciaDetailController extends Controller
{
    use ApiResponseTrait;

    public function __invoke($id)
    {
        try {
            $transferId = (int)$id;
            
            $transferencia = Transferencia::with([
                'unidadOrigen', 
                'usuarioEnvia', 
                'usuarioRecibe', 
                'usuarioTua',
                'expedientes.serie',
                'expedientes.unidadAdministrativa',
            ])->find($transferId);

            if (!$transferencia) {
                return $this->errorResponse("La transferencia #{$id} no existe en la base de datos.", 404);
            }

            return $this->successResponse(
                new TransferenciaResource($transferencia), 
                'Detalle de transferencia recuperado'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al procesar el detalle: ' . $e->getMessage(), 500);
        }
    }
}
