<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }} Routes</title>

    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gray-100 text-gray-900">

    <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold mb-6">API Routes</h1>

        @php
            $routes = collect(Route::getRoutes())
                ->map(function ($route) {
                    return [
                        'method' => implode('|', $route->methods()),
                        'uri' => $route->uri(),
                        'name' => $route->getName(),
                        'action' => $route->getActionName(),
                    ];
                })
                ->sortBy('uri');
        @endphp

        <div class="overflow-x-auto bg-white rounded-lg shadow">
            <table class="min-w-full text-sm text-left border-collapse">
                <thead class="bg-gray-800 text-white">
                    <tr>
                        <th class="px-4 py-2">Method</th>
                        <th class="px-4 py-2">URI</th>
                        <th class="px-4 py-2">Name</th>
                        <th class="px-4 py-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($routes as $route)
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-2">
                                <span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                    {{ $route['method'] }}
                                </span>
                            </td>
                            <td class="px-4 py-2 font-mono">{{ $route['uri'] }}</td>
                            <td class="px-4 py-2 text-gray-600">{{ $route['name'] ?? '-' }}</td>
                            <td class="px-4 py-2 text-gray-500 text-xs">{{ $route['action'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

</body>

</html>
