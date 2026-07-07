<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Parking;
use Illuminate\Http\Request;

class ParkingController extends Controller
{
    public function index() {
        return Parking::all();
    }

    public function show($id) {
        return Parking::with('slots')->findOrFail($id);
    }

    // admin add parking
    public function store(Request $request) {
        $parking = Parking::create($request->all());
        return response()->json($parking, 201);
    }

    // update parking
    public function update(Request $request, $id) {
        $parking = Parking::findOrFail($id);
        $parking->update($request->all());
        return response()->json($parking, 200);
    }

    // delete parking
    public function destroy($id) {
        Parking::destroy($id);
        return response()->json(null, 204);
    }
}
