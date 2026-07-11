<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Slot;
use App\Support\CacheKeys;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    public function store(Request $request) {
        $slot = Slot::create($request->all());
        CacheKeys::bump('public-parkings');
        return response()->json($slot, 201);
    }

    public function update(Request $request, $id) {
        $slot = Slot::findOrFail($id);
        $slot->update($request->all());
        CacheKeys::bump('public-parkings');
        return response()->json($slot, 200);
    }

    public function destroy($id) {
        Slot::destroy($id);
        CacheKeys::bump('public-parkings');
        return response()->json(null, 204);
    }
}
