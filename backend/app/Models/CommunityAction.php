<?php

namespace App\Models;

use App\Models\BaseModel as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityAction extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'action_type',
        'weight',
        'source_ref_id',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'integer',
            'occurred_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
