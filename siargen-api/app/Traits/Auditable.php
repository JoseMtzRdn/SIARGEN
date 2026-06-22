<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    // registra un evento de auditoría.
    protected function audit(Model $model, string $event, array $oldValues = null, array $newValues = null)
    {
        try {
            AuditLog::create([
                'user_id' => Auth::id() ?? 1, // Asigna el identificador del Administrador de TI por defecto en procesos de sistema.
                'event' => $event,
                'auditable_type' => get_class($model),
                'auditable_id' => $model->id,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'url' => Request::fullUrl(),
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error en bitácora de auditoría: " . $e->getMessage());
        }
    }
}
