<?php

namespace App\Console\Commands\Chat;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * Options mirror the core migrate commands so teams can request a "fresh" rebuild
     * or seed data in one shot: `php artisan chat:migrate --fresh --seed`.
     */
    protected $signature = 'chat:migrate {--fresh : Drop chat tables before migrating}';

    /**
     * The console command description.
     */
    protected $description = 'Run chat/Postgres migrations';

    public function handle(): int
    {
        $fresh = (bool) $this->option('fresh');

        $this->components->info(sprintf(
            'Running chat migrations on pgsql (%s)...',
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

        $this->components->info('Chat migrations completed.');

        return $exitCode === 0 ? Command::SUCCESS : Command::FAILURE;
    }
}

