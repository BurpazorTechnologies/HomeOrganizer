<?php

namespace App\Models;

use App\Models\BaseModel as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleChange extends Model
{
    protected $fillable = [
        'user_id',
        'from_roles',
        'to_roles',
        'reason_json',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'from_roles' => 'array',
            'to_roles' => 'array',
            'reason_json' => 'array',
            'changed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
