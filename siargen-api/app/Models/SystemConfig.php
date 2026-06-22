<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemConfig extends Model
{
    use HasFactory;

    protected $table = 'system_configs';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
    ];
}
