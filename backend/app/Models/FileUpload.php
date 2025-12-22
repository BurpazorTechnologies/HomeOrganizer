<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FileUpload extends Model
{
    protected $table = 'file_uploads';

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'file_path',
        'file_name',
        'original_file_name',
        'storage_type',
        'file_type',
        'file_category',
        'file_size',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'file_size' => 'integer',
    ];

    public function getHumanFileSizeAttribute()
    {
        $bytes = $this->file_size;

        if ($bytes < 1024) {
            return $bytes . ' B';
        } elseif ($bytes < 1048576) {
            return round($bytes / 1024, 2) . ' KB';
        } elseif ($bytes < 1073741824) {
            return round($bytes / 1048576, 2) . ' MB';
        } else {
            return round($bytes / 1073741824, 2) . ' GB';
        }
    }
}
