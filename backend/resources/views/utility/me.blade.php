<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }} Me (Debug)</title>

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
        <h1 class="text-2xl font-bold mb-6">Current User (Debug)</h1>

        @if (!$user)
            <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-700">No Authenticated User.</p>
            </div>
        @else
            <div class="bg-white rounded-lg shadow p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <div class="text-gray-500 text-sm">ID</div>
                        <div class="font-mono">{{ $user->id }}</div>
                    </div>
                    <div>
                        <div class="text-gray-500 text-sm">Created</div>
                        <div class="text-gray-700">{{ optional($user->created_at)->toDateTimeString() }}</div>
                    </div>
                    <div>
                        <div class="text-gray-500 text-sm">Name</div>
                        <div class="text-gray-900">{{ $user->name ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="text-gray-500 text-sm">Email</div>
                        <div class="text-gray-900">{{ $user->email }}</div>
                    </div>
                </div>

                <div>
                    <div class="text-gray-500 text-sm mb-1">Roles</div>
                    @php $roleNames = isset($roleNames) ? $roleNames : ($user->roles->pluck('name')->sort()->values()); @endphp
                    @if ($roleNames->isEmpty())
                        <span class="text-gray-400">-</span>
                    @else
                        <div class="text-gray-800">{{ $roleNames->join(', ') }}</div>
                    @endif
                </div>

                <div>
                    <div class="text-gray-500 text-sm mb-1">Permissions</div>
                    @php $permissionNames = isset($permissionNames) ? $permissionNames : ($user->roles->flatMap(fn($r) => $r->permissions->pluck('name'))->merge($user->getPermissionNames())->unique()->sort()->values()); @endphp
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
                </div>

                @if (!empty($token))
                    <div>
                        <div class="text-gray-500 text-sm mb-1">API Token (Debug)</div>
                        <div class="flex gap-2 items-stretch">
                            <input id="debugToken" type="text" readonly
                                class="w-full px-3 py-2 border rounded font-mono text-sm bg-gray-50"
                                value="{{ $token }}" />
                            <button id="copyBtn"
                                class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 active:bg-gray-900">Copy</button>
                        </div>
                        <div id="copyMsg" class="text-green-700 text-sm mt-1 hidden">Copied!</div>
                    </div>
                @endif
            </div>
        @endif
    </div>

    <script>
        (function() {
            var btn = document.getElementById('copyBtn');
            if (!btn) return;
            btn.addEventListener('click', function() {
                var input = document.getElementById('debugToken');
                if (!input) return;
                input.select();
                input.setSelectionRange(0, 99999);
                var text = input.value;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(showMsg, showMsg);
                } else {
                    try {
                        document.execCommand('copy');
                        showMsg();
                    } catch (e) {
                        showMsg();
                    }
                }
            });

            function showMsg() {
                var el = document.getElementById('copyMsg');
                if (!el) return;
                el.classList.remove('hidden');
                setTimeout(function() {
                    el.classList.add('hidden');
                }, 1200);
            }
        })();
    </script>
</body>

</html>
