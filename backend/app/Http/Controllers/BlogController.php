<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Spatie\LaravelMarkdown\MarkdownRenderer;

class BlogController extends Controller
{
    private MarkdownRenderer $markdownRenderer;
    private string $basePath;

    public function __construct(MarkdownRenderer $markdownRenderer)
    {
        $this->basePath = resource_path('markdown/blog');
        $this->markdownRenderer = $markdownRenderer;
    }

    private function getPosts()
    {
        return collect(File::allFiles($this->basePath))
            ->filter(fn($file) => Str::endsWith($file->getFilename(), '.md'))
            ->map(function ($file) {
                $fullPath = $file->getPathname();
                $relativePath = Str::after($fullPath, $this->basePath . DIRECTORY_SEPARATOR);
                $slug = str_replace(['\\', '.md'], ['/', ''], $relativePath);
                $title = Str::title(str_replace(['-', '_'], ' ', basename($slug)));

                return [
                    'slug' => $slug,
                    'title' => $title,
                ];
            })
            ->values();
    }

    public function index(): Response
    {
        return Inertia::render('Blog/Index', [
            'posts' => $this->getPosts()
        ]);
    }

    public function show(string $path)
    {
        $safePath = str_replace(['..', '//'], '', $path);
        $filePath = "{$this->basePath}/{$safePath}.md";

        if (!File::exists($filePath)) {
            abort(404);
        }

        $markdown = File::get($filePath);
        $html = $this->markdownRenderer->convertToHtml($markdown)->getContent();

        $segments = collect(explode('/', $safePath))->filter();
        $breadcrumbs = $segments->map(function ($segment, $index) use ($segments) {
            $slug = $segments->slice(0, $index + 1)->implode('/');
            return [
                'label' => Str::title(str_replace(['-', '_'], ' ', $segment)),
                'url' => "/blog/{$slug}"
            ];
        });
        
        return Inertia::render('Blog/Page', [
            'html' => $html,
            'title' => $breadcrumbs->last()['label'],
            'breadcrumbs' => $breadcrumbs,
            'posts' => $this->getPosts(),
            'currentPath' => $safePath
        ]);
    }
}
