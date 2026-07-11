<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Parking;
use App\Models\Service;
use App\Models\ServiceCenter;
use App\Models\Slot;
use App\Models\Team;
use App\Models\User;
use App\Services\ImageUploadService;
use App\Support\CacheKeys;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminBulkDeleteController extends Controller
{
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'resource' => ['required', 'string', Rule::in([
                'users',
                'parkings',
                'slots',
                'services',
                'messages',
                'team-members',
                'service-centers',
            ])],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', 'min:1'],
        ]);

        $result = DB::transaction(fn () => match ($validated['resource']) {
            'users' => $this->deleteUsers($validated['ids']),
            'parkings' => $this->deleteParkings($validated['ids']),
            'slots' => $this->deleteSlots($validated['ids']),
            'services' => $this->deleteServices($validated['ids']),
            'messages' => $this->deleteMessages($validated['ids']),
            'team-members' => $this->deleteTeamMembers($validated['ids']),
            'service-centers' => $this->deleteServiceCenters($validated['ids']),
        });

        return response()->json([
            'success' => true,
            'message' => $this->message($result['deleted'], $result['skipped']),
            ...$result,
        ]);
    }

    private function deleteUsers(array $ids): array
    {
        $deleted = User::whereIn('id', $ids)->where('role', 'user')->delete();

        return $this->result($deleted, count($ids) - $deleted);
    }

    private function deleteParkings(array $ids): array
    {
        $parkings = Parking::whereIn('id', $ids)->get();
        $imageService = app(ImageUploadService::class);

        foreach ($parkings as $parking) {
            $imageService->deletePublicImage($parking->image);
            $parking->slots()->delete();
            $parking->delete();
        }

        CacheKeys::bump('public-parkings');

        return $this->result($parkings->count(), count($ids) - $parkings->count());
    }

    private function deleteSlots(array $ids): array
    {
        $slots = Slot::whereIn('id', $ids)->get();
        $deleted = 0;

        foreach ($slots as $slot) {
            if ($slot->bookings()->whereIn('status', ['pending', 'confirmed', 'active'])->exists()) {
                continue;
            }

            $slot->delete();
            $deleted++;
        }

        CacheKeys::bump('public-parkings');

        return $this->result($deleted, count($ids) - $deleted);
    }

    private function deleteServices(array $ids): array
    {
        $services = Service::whereIn('id', $ids)->get();
        $imageService = app(ImageUploadService::class);
        $deleted = 0;

        foreach ($services as $service) {
            $activeOrders = $service->serviceOrders()
                ->whereIn('status', ['pending', 'confirmed', 'in_progress'])
                ->exists();

            if ($activeOrders) {
                continue;
            }

            $imageService->deletePublicImage($service->image);
            $service->delete();
            $deleted++;
        }

        CacheKeys::bump('public-services');

        return $this->result($deleted, count($ids) - $deleted);
    }

    private function deleteMessages(array $ids): array
    {
        $deleted = Message::whereIn('id', $ids)->delete();

        return $this->result($deleted, count($ids) - $deleted);
    }

    private function deleteTeamMembers(array $ids): array
    {
        $members = Team::whereIn('id', $ids)->get();
        $imageService = app(ImageUploadService::class);

        foreach ($members as $member) {
            $imageService->deletePublicImage($member->image);
            $member->delete();
        }

        Cache::forget('about-page:public');

        return $this->result($members->count(), count($ids) - $members->count());
    }

    private function deleteServiceCenters(array $ids): array
    {
        $centers = ServiceCenter::whereIn('id', $ids)->get();
        $imageService = app(ImageUploadService::class);

        foreach ($centers as $center) {
            $imageService->deletePublicImage($center->image);
            $center->delete();
        }

        CacheKeys::bump('public-service-centers');

        return $this->result($centers->count(), count($ids) - $centers->count());
    }

    private function result(int $deleted, int $skipped): array
    {
        return [
            'deleted' => max(0, $deleted),
            'skipped' => max(0, $skipped),
        ];
    }

    private function message(int $deleted, int $skipped): string
    {
        if ($deleted === 0 && $skipped > 0) {
            return 'No selected records could be deleted.';
        }

        if ($skipped > 0) {
            return "{$deleted} records deleted. {$skipped} skipped because they are protected or already removed.";
        }

        return "{$deleted} records deleted successfully.";
    }
}
