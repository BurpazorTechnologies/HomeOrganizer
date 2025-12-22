<?php

namespace App\Enums;

enum FileCategory: string
{
    case RESUME = 'resume';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        return [
            self::RESUME->value => 'Resume',
        ];
    }

    public function label(): string
    {
        return match($this) {
            self::RESUME => 'Resume',
        };
    }
}
