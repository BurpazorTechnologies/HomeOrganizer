<?php

namespace App\Http\Controllers\Client;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Project;
use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreProjectRequest;

class ProjectController extends Controller
{
    public function show(string $project_uuid): Response
    {
        $project = Project::where('uuid', $project_uuid)->firstOrFail();
        $user = Auth::user()->load('userInformation');
        
        return Inertia::render('Client/Project/Show', [
            'auth' => [
                'user' => $user,
            ],
            'project' => $project,
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Project::create([
            'name' => $request->name,
        ]);

        return back();
    }
}
