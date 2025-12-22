<?php

namespace App\Console\Commands;

use App\Services\Rbac\RbacSyncService;
use Illuminate\Console\Command;
use InvalidArgumentException;

class SyncRbacCommand extends Command
{
    protected $signature = 'rbac:sync {guard? : Limit the sync process to a single guard}';

    protected $description = 'Synchronize configured roles and permissions into the database.';

    public function __construct(private readonly RbacSyncService $rbacSyncService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $guard = $this->argument('guard');

        try {
            $stats = $this->rbacSyncService->sync($guard);
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Synced %d guard(s), %d role(s), and %d permission(s).',
            $stats['guards_processed'],
            $stats['roles_synced'],
            $stats['permissions_synced'],
        ));

        return self::SUCCESS;
    }
}

