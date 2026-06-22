<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return $this->successResponse($notifications, 'Notificaciones recuperadas');
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', auth()->id())->findOrFail($id);
        $notification->update(['read' => true]);

        return $this->successResponse(null, 'Notificación marcada como leída');
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())->update(['read' => true]);
        return $this->successResponse(null, 'Todas las notificaciones marcadas como leídas');
    }

    // método estático para disparar notificaciones desde servicios
    public static function push($userId, $title, $message, $type = 'info', $link = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link
        ]);
    }
}
