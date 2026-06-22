<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'username',
        'email',
        'password',
        'role_id',
        'unidad_administrativa_id',
        'cargo',
        'telefono',
        'extension',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'activo' => 'boolean',
    ];

    // atributo para obtener el nombre completo.
    public function getFullNameAttribute()
    {
        return "{$this->nombre} {$this->apellido_paterno} {$this->apellido_materno}";
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function unidadAdministrativa()
    {
        return $this->belongsTo(UnidadAdministrativa::class, 'unidad_administrativa_id');
    }

    
    public function hasRole($slug)
    {
        return $this->role && $this->role->slug === $slug;
    }

    public function isAdminTi() { return $this->hasRole('admin_ti'); }
    public function isTua() { return $this->hasRole('tua'); }
    public function isRat() { return $this->hasRole('rat'); }
    public function isCoordArchivos() { return $this->hasRole('coord_archivos'); }
    public function isRac() { return $this->hasRole('rac'); }
    public function isRah() { return $this->hasRole('rah'); }
    public function isRespCorrespondencia() { return $this->hasRole('correspondencia'); }
    public function isConsulta() { return $this->hasRole('consulta'); }
}
