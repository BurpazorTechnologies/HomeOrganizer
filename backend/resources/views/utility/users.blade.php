<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }} Users</title>

    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .tag {
            display: inline-block;
            padding: 0.125rem 0.375rem;
            font-size: 0.75rem;
            line-height: 1rem;
            border-radius: 0.375rem;
            white-space: nowrap;
        }

        .tag-blue {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .tag-green {
            background-color: #dcfce7;
            color: #166534;
        }

        .tag-yellow {
            background-color: #fef9c3;
            color: #854d0e;
        }

        .tag-red {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .tag-purple {
            background-color: #ede9fe;
            color: #5b21b6;
        }

        .tag-gray {
            background-color: #e5e7eb;
            color: #374151;
        }
    </style>
</head>

<body class="bg-gray-100 text-gray-900">

    <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold mb-6">Users (Debug)</h1>

        <div class="overflow-x-auto bg-white rounded-lg shadow">
            <table class="min-w-full text-sm text-left border-collapse">
                <thead class="bg-gray-800 text-white">
                    <tr>
                        <th class="px-4 py-2">ID</th>
                        <th class="px-4 py-2">Name</th>
                        <th class="px-4 py-2">Email</th>
                        <th class="px-4 py-2">Roles</th>
                        <th class="px-4 py-2">Permissions</th>
                        <th class="px-4 py-2">Created</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($users as $user)
                        @php
                            $roleNames = $user->roles->pluck('name')->sort()->values();
                            $permissionNames = $user->roles
                                ->flatMap(fn($r) => $r->permissions->pluck('name'))
                                ->merge($user->getPermissionNames())
                                ->unique()
                                ->sort()
                                ->values();
                        @endphp
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-2 font-mono">{{ $user->id }}</td>
                            <td class="px-4 py-2">{{ $user->name ?? '-' }}</td>
                            <td class="px-4 py-2">{{ $user->email }}</td>
                            <td class="px-4 py-2 text-gray-700">
                                @if ($roleNames->isEmpty())
                                    <span class="text-gray-400">-</span>
                                @else
                                    {{ $roleNames->join(', ') }}
                                @endif
                            </td>
                            <td class="px-4 py-2 text-gray-700">
                                @if ($permissionNames->isEmpty())
                                    <span class="text-gray-400">-</span>
                                @else
                                    @php $colors = ['blue','green','yellow','red','purple','gray']; @endphp
                                    <div class="tag-list">
                                        @foreach ($permissionNames as $perm)
                                            @php $color = $colors[$loop->index % count($colors)]; @endphp
                                            <span class="tag tag-{{ $color }}">{{ $perm }}</span>
                                        @endforeach
                                    </div>
                                @endif
                            </td>
                            <td class="px-4 py-2 text-gray-600">{{ optional($user->created_at)->toDateString() }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-gray-500">No users found.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

</body>

</html>
