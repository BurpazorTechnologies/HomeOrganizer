# 🛠️ Goal

Create a simple system for Blog Posting + a page index for all posts.

---

## ✍️ Planning

**HomeOrganizer** is my personal playground — a portfolio-slash-dev-diary where I showcase all the nerdy, 
techy, and sometimes chaotic things I do in software development.

From the start, I knew I wanted to include blogging. Not some generic productivity fluff, 
but **actual dev logs** — centralized notes of how I engineer stuff, debug weird issues, and 
piece together cool systems from scratch.

For the MVP, here’s what I needed:

- A **simple and convenient** way to write posts  
- A **popular format** that AI tools can understand easily and generate from  

💡 Naturally, Markdown popped into mind. It’s everywhere: used in README files, blogs, 
note-taking tools, and loved by devs (and GPTs) alike.

---

## ✅ Markdown to the Rescue

Thanks to Laravel’s amazing ecosystem, I found exactly what I needed:  
➡️ [spatie/laravel-markdown](https://github.com/spatie/laravel-markdown)

It supports code formatting out of the box via **Shiki**, and uses **CommonMark**, a widely-supported PHP parser:  
[thephpleague/commonmark](https://github.com/thephpleague/commonmark)

I needed syntax highlighting because… let’s be honest, 80% of my posts will include code snippets. 
This setup ticked all the boxes.

---

## ⚙️ Setup Notes

Install was smooth… except one hiccup. `shiki` requires `node`, and my Docker setup didn’t have it globally for the `root` user (which my container runs as).

### 🐳 Fixing Docker

As mentioned in the [docs](https://spatie.be/docs/laravel-markdown/v1/requirements), `node` is required globally. So I fixed that by updating my Dockerfile:

![Docker Snippet](https://i.imgur.com/kgx4IKv.png)

---

## 🧪 Quick Test

To confirm Shiki works, I created a quick utility route:

```php
Route::get('/check-code-highlighter', [UtilityController::class, 'checkCodeHighlighter'])->name('utility.ui.checkCodeHighlighter');

// UtilityController

public function checkCodeHighlighter()
{
    return Shiki::highlight(
        code: '<?php echo "Hello World"; ?>',
        language: 'php',
        theme: 'github-light',
    );
}
```

Nice. Clean. Highlighted. ✅

---

## 📄 Blog Component Setup

Next, I scaffolded the Inertia page: `Blog/Index.vue`, and set up a basic layout to render Markdown-powered blog pages.

![Component Directory](https://i.imgur.com/96QZHUC.png)

Then, I wired up routes:

```php
Route::prefix('blog')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('blog.index');
    Route::get('/{path}', [BlogController::class, 'show'])
        ->where('path', '.*')
        ->name('blog.show');
});
```

---

## 📦 BlogController Logic

Here’s the breakdown of how posts are fetched and parsed:

```php
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
}
```

The concept is simple:

- Place a `.md` file inside `resources/markdown/blog`
- The filename (and folders) become the post URL

Yes, renaming files will break links. It’s a trade-off I’m willing to accept for now.

---

## 📚 Viewing Individual Blog Posts

This handles rendering + breadcrumb generation:

```php
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
```

And voilà. It works.

---

## 🧠 Final Thoughts

### 🧵 The Blogging Flow:

- Drop a `.md` file into `resources/markdown/blog/*`
- File name = slug  
- Folder path = category  
- It shows up instantly with hot reload

Fast, clean, and no CMS bloat. Just dev-friendly content editing.

---

## 🚀 Roadmap & Feature Wishlist

- [ ] Categorize blog posts properly  
- [ ] Add support for tags  
- [ ] Option to migrate posts into DB (for performance + scaling)  
- [ ] Auto-backup system for Markdown files  
- [ ] Version control for content (Git-powered maybe?)  
- [ ] N+ more...
---

## 🧩 Closing Thoughts

In the world of software engineering, nothing is ever *truly* done.  
Your imagination is the only limit — that and how much free time you can scavenge between debugging, deployments, and existential dread. 😅

**Thanks for reading!**
