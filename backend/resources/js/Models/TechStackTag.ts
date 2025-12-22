interface TechStyle {
    bgColor: string;
    color: string;
}

interface TechColors {
    [key: string]: TechStyle;
}

const techColors: TechColors = {
    Laravel: {
        bgColor: 'bg-orange-600',
        color: 'text-white'
    },
    Livewire: {
        bgColor: 'bg-sky-500',
        color: 'text-white'
    },
    Vue: {
        bgColor: 'bg-emerald-500',
        color: 'text-white'
    },
    Inertia: {
        bgColor: 'bg-purple-600',
        color: 'text-white'
    },
    AlpineJS: {
        bgColor: 'bg-indigo-500',
        color: 'text-white'
    },
    Node: {
        bgColor: 'bg-green-600',
        color: 'text-white'
    },
    Express: {
        bgColor: 'bg-neutral-800',
        color: 'text-white'
    },
    Redis: {
        bgColor: 'bg-red-700',
        color: 'text-white'
    },
    MySQL: {
        bgColor: 'bg-sky-700',
        color: 'text-white'
    },
    MongoDB: {
        bgColor: 'bg-green-700',
        color: 'text-white'
    },
    Python: {
        bgColor: 'bg-yellow-500',
        color: 'text-black'
    },
    Selenium: {
        bgColor: 'bg-gray-700',
        color: 'text-white'
    },
    Bootstrap: {
        bgColor: 'bg-indigo-600',
        color: 'text-white'
    },
    Tailwind: {
        bgColor: 'bg-cyan-500',
        color: 'text-white'
    },
    Docker: {
        bgColor: 'bg-blue-600',
        color: 'text-white'
    },
    AWS: {
        bgColor: 'bg-orange-500',
        color: 'text-white'
    },
    WordPress: {
        bgColor: 'bg-blue-800',
        color: 'text-white'
    },
    GitHubActions: {
        bgColor: 'bg-gray-800',
        color: 'text-white'
    },
    Jenkins: {
        bgColor: 'bg-red-800',
        color: 'text-white'
    }
};

// Create a case-insensitive lookup map
const techColorsLookup = Object.fromEntries(
    Object.entries(techColors).map(([key, value]) => [key.toLowerCase(), value])
);

export function getTechStyle(name: string): TechStyle {
    // Convert input to lowercase for case-insensitive lookup
    const lookupName = name.toLowerCase();

    // Return default styling if tech not found
    return techColorsLookup[lookupName] || {
        bgColor: 'bg-gray-500',
        color: 'text-white'
    };
}

export type { TechStyle };
