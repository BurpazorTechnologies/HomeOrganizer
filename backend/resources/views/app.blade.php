<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'Home Organizer') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-slate-950 text-slate-100 min-h-screen font-[Inter]">

    <div class="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header class="mb-12">
            <p class="text-sm uppercase tracking-[0.2em] text-emerald-400 mb-2">Routes</p>
            <h1 class="text-3xl sm:text-4xl font-semibold text-white">Laravel Routes</h1>
        </header>

        @php
            $allRoutes = collect(Route::getRoutes())
                ->map(function ($route) {
                    return [
                        'method' => implode('|', $route->methods()),
                        'uri' => $route->uri(),
                        'name' => $route->getName(),
                        'action' => $route->getActionName(),
                        'isApi' => str_starts_with($route->uri(), 'api/') || in_array('api', $route->middleware()),
                    ];
                })
                ->sortBy('uri');

            $apiRoutes = $allRoutes->filter(fn($route) => $route['isApi']);
            $webRoutes = $allRoutes->filter(fn($route) => !$route['isApi']);
        @endphp

        <!-- API Routes Section -->
        <div class="mb-12">
            <h2 class="text-2xl font-semibold text-white mb-4">API Routes</h2>
            <div class="overflow-x-auto rounded-2xl border border-slate-800/70 bg-slate-900/40 shadow-lg shadow-black/30 backdrop-blur">
                <table class="min-w-full text-sm text-left border-collapse">
                    <thead class="bg-slate-800/70">
                        <tr>
                            <th class="px-4 py-3 text-slate-200 font-semibold">Method</th>
                            <th class="px-4 py-3 text-slate-200 font-semibold">URI</th>
                            <th class="px-4 py-3 text-slate-200 font-semibold">Name</th>
                            <th class="px-4 py-3 text-slate-200 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($apiRoutes as $route)
                            <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td class="px-4 py-3">
                                    <span class="px-2 py-1 text-xs font-semibold rounded-md bg-slate-800 text-emerald-300">
                                        {{ $route['method'] }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 font-mono text-slate-200">{{ $route['uri'] }}</td>
                                <td class="px-4 py-3 text-slate-300">{{ $route['name'] ?? '-' }}</td>
                                <td class="px-4 py-3 text-slate-400 text-xs">{{ $route['action'] }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="px-4 py-4 text-center text-slate-400">No API routes found</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- WEB Routes Section -->
        <div>
            <h2 class="text-2xl font-semibold text-white mb-4">WEB Routes</h2>
            <div class="overflow-x-auto rounded-2xl border border-slate-800/70 bg-slate-900/40 shadow-lg shadow-black/30 backdrop-blur">
                <table class="min-w-full text-sm text-left border-collapse">
                    <thead class="bg-slate-800/70">
                        <tr>
                            <th class="px-4 py-3 text-slate-200 font-semibold">Method</th>
                            <th class="px-4 py-3 text-slate-200 font-semibold">URI</th>
                            <th class="px-4 py-3 text-slate-200 font-semibold">Name</th>
                            <th class="px-4 py-3 text-slate-200 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($webRoutes as $route)
                            <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td class="px-4 py-3">
                                    <span class="px-2 py-1 text-xs font-semibold rounded-md bg-slate-800 text-emerald-400">
                                        {{ $route['method'] }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 font-mono text-slate-200">{{ $route['uri'] }}</td>
                                <td class="px-4 py-3 text-slate-300">{{ $route['name'] ?? '-' }}</td>
                                <td class="px-4 py-3 text-slate-400 text-xs">{{ $route['action'] }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="px-4 py-4 text-center text-slate-400">No WEB routes found</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <footer class="mt-16 border-t border-slate-800 pt-6 text-slate-500 text-sm flex flex-wrap items-center gap-4 justify-between">
            <span>Environment: <span class="font-semibold text-white">{{ app()->environment() }}</span></span>
            <span>&copy; {{ date('Y') }} {{ config('app.name') }}</span>
        </footer>
    </div>

</body>

</html>
