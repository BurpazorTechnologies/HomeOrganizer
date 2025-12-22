@php
    $defaultMeta = config('meta.defaults.social', []);
    $environmentMeta = config('meta.' . app()->environment() . '.social', []);
    $meta = array_merge($defaultMeta, $environmentMeta);
@endphp

<!-- Open Graph Meta Tags -->
<meta property="og:title" content="{{ $meta['og:title'] ?? 'Default Title' }}">
<meta property="og:description" content="{{ $meta['og:description'] ?? 'Default Description' }}">
<meta property="og:type" content="{{ $meta['og:type'] ?? 'website' }}">
<meta property="og:image" content="{{ asset($meta['og:image'] ?? 'default-image.png') }}">
<meta property="og:url" content="{{ $meta['og:url'] ?? url()->current() }}">
<meta property="og:site_name" content="{{ $meta['og:site_name'] ?? config('app.name') }}">

<!-- Twitter Meta Tags -->
<meta name="twitter:title" content="{{ $meta['twitter:title'] ?? $meta['og:title'] ?? 'Default Title' }}">
<meta name="twitter:description" content="{{ $meta['twitter:description'] ?? $meta['og:description'] ?? 'Default Description' }}">
<meta name="twitter:card" content="{{ $meta['twitter:card'] ?? 'summary_large_image' }}">
<meta name="twitter:image" content="{{ asset($meta['twitter:image'] ?? $meta['og:image'] ?? 'default-image.png') }}">
