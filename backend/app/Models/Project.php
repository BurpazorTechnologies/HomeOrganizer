<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $project) {
            if (empty($project->uuid)) {
                $project->uuid = (string) Str::uuid();
            }
        });
    }
}

