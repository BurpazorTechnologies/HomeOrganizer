<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class PgMigrateCommand extends Command
{
    protected $signature = 'pg:migrate {--fresh : Drop pg tables before migrating}';

    protected $description = 'Run Postgres migrations';

    public function handle(): int
    {
        $fresh = (bool) $this->option('fresh');

        $this->components->info(sprintf(
            'Running migrations on pgsql (%s)...',
            $fresh ? 'fresh' : 'standard'
        ));

        $command = $fresh ? 'migrate:fresh' : 'migrate';

        $options = [
            '--database' => 'pgsql',
            '--path' => 'database/migrations/postgres',
            '--force' => true,
        ];

        $exitCode = Artisan::call($command, $options);

        $output = trim(Artisan::output());
        if ($output !== '') {
            $this->line($output);
        }

        $this->components->info('Postgres migrations completed.');

        return $exitCode === 0 ? Command::SUCCESS : Command::FAILURE;
    }
}

