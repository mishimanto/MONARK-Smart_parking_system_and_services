<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $query = Team::query();

        if ($request->filled('q')) {
            $search = trim($request->input('q'));
            $query->where(function ($teamQuery) use ($search) {
                $teamQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhere('bio', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        if ($request->filled('role') && $request->input('role') === 'founder') {
            $query->where('is_founder', true);
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('is_founder')->orderBy('sort_order')->orderBy('id')->paginate($perPage),
            'stats' => [
                'total' => Team::count(),
                'active' => Team::where('is_active', true)->count(),
                'founders' => Team::where('is_founder', true)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        if (!empty($data['is_founder'])) {
            Team::where('is_founder', true)->update(['is_founder' => false]);
        }

        $team = Team::create($data);
        Cache::forget('about-page:public');

        return response()->json([
            'success' => true,
            'message' => 'Team member created successfully',
            'data' => $team,
        ], 201);
    }

    public function show(Team $team)
    {
        return response()->json([
            'success' => true,
            'data' => $team,
        ]);
    }

    public function update(Request $request, Team $team)
    {
        $data = $this->validatedData($request);

        if (!empty($data['is_founder'])) {
            Team::where('id', '!=', $team->id)->where('is_founder', true)->update(['is_founder' => false]);
        }

        $team->update($data);
        Cache::forget('about-page:public');

        return response()->json([
            'success' => true,
            'message' => 'Team member updated successfully',
            'data' => $team->fresh(),
        ]);
    }

    public function destroy(Team $team)
    {
        $team->delete();
        Cache::forget('about-page:public');

        return response()->json([
            'success' => true,
            'message' => 'Team member deleted successfully',
        ]);
    }

    public function toggleStatus(Team $team)
    {
        $team->update(['is_active' => !$team->is_active]);
        Cache::forget('about-page:public');

        return response()->json([
            'success' => true,
            'message' => 'Team member status updated successfully',
            'data' => $team->fresh(),
        ]);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $uploaded = app(ImageUploadService::class)->storePublicImage($request->file('image'), 'team', [
            'prefix' => 'team',
            'width' => 720,
            'height' => 720,
            'fit' => 'cover',
            'quality' => 84,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Team image uploaded successfully',
            'url' => $uploaded['url'],
            'path' => $uploaded['path'],
            'extension' => $uploaded['extension'],
            'size' => $uploaded['size'],
        ]);
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:150',
            'position' => 'required|string|max:150',
            'bio' => 'nullable|string|max:1000',
            'image' => 'nullable|string|max:500',
            'is_founder' => 'boolean',
            'sort_order' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'boolean',
            'linkedin_url' => 'nullable|string|max:500',
            'twitter_url' => 'nullable|string|max:500',
            'github_url' => 'nullable|string|max:500',
        ]);
    }
}
