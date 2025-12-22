<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Laboratory Index | {{ config('app.name') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-[Inter]">
    <div class="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header class="mb-12">
            <p class="text-sm uppercase tracking-[0.2em] text-emerald-400 mb-2">Laboratory</p>
            <h1 class="text-3xl sm:text-4xl font-semibold text-white">Experiments Index</h1>
            <p class="mt-3 text-slate-400 max-w-3xl">
                Index of Laboratory Experiments, stand alone research and Flow study for this project.
            </p>
        </header>

        <div class="space-y-12">
            @foreach($sections as $section)
                <section>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 class="text-2xl font-semibold text-white">{{ $section['title'] }}</h2>
                            <p class="text-slate-400 mt-1">{{ $section['description'] }}</p>
                        </div>
                        <span class="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-sm text-slate-300">
                            {{ count($section['links']) }} experiment{{ count($section['links']) === 1 ? '' : 's' }}
                        </span>
                    </div>

                    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        @foreach($section['links'] as $link)
                            <div class="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 shadow-lg shadow-black/30 backdrop-blur">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-semibold text-white">{{ $link['label'] }}</h3>
                                    <span class="text-xs font-semibold rounded-md px-2 py-0.5 bg-slate-800 text-slate-300">
                                        {{ $link['method'] }}
                                    </span>
                                </div>
                                <p class="mt-2 text-sm text-slate-400 leading-relaxed">{{ $link['description'] }}</p>

                                <div class="mt-4">
                                    @if(strtoupper($link['method']) === 'GET')
                                        <a href="{{ $link['url'] }}"
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           class="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200 transition-colors">
                                            Open experiment
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5h10m0 0v10m0-10L9 15"></path>
                                            </svg>
                                        </a>
                                    @else
                                        <p class="text-xs text-slate-500">Invoke via {{ $link['method'] }} request (e.g., Postman/cURL).</p>
                                    @endif
                                </div>

                                <p class="mt-4 text-[11px] text-slate-500 break-words">
                                    {{ $link['url'] }}
                                </p>
                            </div>
                        @endforeach
                    </div>
                </section>
            @endforeach
        </div>

        <footer class="mt-16 border-t border-slate-800 pt-6 text-slate-500 text-sm flex flex-wrap items-center gap-4 justify-between">
            <span>Debug middleware enforced: <span class="font-semibold text-white">{{ app()->environment() }}</span></span>
            <span>&copy; {{ date('Y') }} {{ config('app.name') }}</span>
        </footer>
    </div>
</body>
</html>

