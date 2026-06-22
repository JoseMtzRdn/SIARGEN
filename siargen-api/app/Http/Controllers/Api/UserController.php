<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Http\Requests\Api\StoreUserRequest;
use App\Http\Requests\Api\UpdateUserRequest;
use App\Http\Resources\Api\UserResource;
use App\Http\Resources\Api\RoleResource;
use App\Models\Role;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponseTrait;

    protected $service;

    public function __construct(UserService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\User::class);
        $user = auth()->user();
        $filters = $request->only([
            'search', 
            'per_page', 
            'role_id', 
            'unidad_administrativa_id', 
            'activo',
            'sort_by', 
            'sort_order'
        ]);

        if ($user->isTua()) {
            $filters['unidad_administrativa_id'] = $user->unidad_administrativa_id;
        }

        $users = $this->service->getAll($filters);
        
        return $this->successResponse(
            UserResource::collection($users)->response()->getData(true),
            'Usuarios recuperados exitosamente'
        );
    }

    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', \App\Models\User::class);
        $user = $this->service->create($request->validated());
        
        return $this->successResponse(
            new UserResource($user->load(['role', 'unidadAdministrativa'])),
            'Usuario creado exitosamente',
            201
        );
    }

    public function show($id)
    {
        $user = $this->service->getById($id);
        $this->authorize('view', $user);
        
        return $this->successResponse(
            new UserResource($user),
            'Usuario recuperado exitosamente'
        );
    }

    public function update(UpdateUserRequest $request, $id)
    {
        $user = $this->service->getById($id);
        $this->authorize('update', $user);
        $user = $this->service->update($id, $request->validated(), $request->user());
        
        return $this->successResponse(
            new UserResource($user->load(['role', 'unidadAdministrativa'])),
            'Usuario actualizado exitosamente'
        );
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = $this->service->getById($id);
            $this->authorize('delete', $user);
            $this->service->delete($id, $request->user());
            return $this->successResponse(null, 'Operación realizada correctamente.');
        } catch (\Exception $e) {
            return $this->errorResponse('No se pudo procesar la solicitud en este momento.', 422);
        }
    }

    public function toggleStatus(Request $request, $id)
    {
        try {
            $user = $this->service->getById($id);
            $this->authorize('update', $user);
            $user = $this->service->toggleStatus($id, $request->user());
            
            return $this->successResponse(
                new UserResource($user->load(['role', 'unidadAdministrativa'])),
                'Estado del usuario actualizado exitosamente'
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422, ['errors' => $e->errors()]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function getRoles()
    {
        $roles = Role::orderBy('nombre')->get();
        return $this->successResponse(
            RoleResource::collection($roles)->resolve(),
            'Roles recuperados exitosamente'
        );
    }

    public function getUnidades()
    {
        $unidades = \App\Models\UnidadAdministrativa::with('titular')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get();

        return $this->successResponse(
            \App\Http\Resources\Api\UnidadAdministrativaResource::collection($unidades)->resolve(),
            'Unidades administrativas recuperadas exitosamente'
        );
    }

    public function checkAvailability(Request $request)
    {
        $field = $request->query('field');
        $value = $request->query('value');
        $excludeId = $request->query('exclude');

        if (!in_array($field, ['username', 'email'])) {
            return $this->successResponse(['available' => true]);
        }

        $query = \App\Models\User::where($field, $value);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $exists = $query->exists();

        return $this->successResponse([
            'available' => !$exists,
            'message' => $exists ? "Este " . ($field === 'username' ? 'usuario' : 'correo') . " ya está en uso." : null
        ], 'Disponibilidad verificada');
    }
}
