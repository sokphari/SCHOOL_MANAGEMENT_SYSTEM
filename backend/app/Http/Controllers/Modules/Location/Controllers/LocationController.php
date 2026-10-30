<?php

namespace App\Http\Controllers\Modules\Location\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    public function buildings()
    {
        return response()->json(Building::with(['floors' => fn ($query) => $query->withCount('rooms')->orderBy('floor_number')->orderBy('name'), 'floors.rooms'])->withCount('floors')->orderBy('name')->get());
    }

    public function storeBuilding(Request $request)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:50', 'unique:buildings,code'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        return response()->json(['message' => 'Building created.', 'data' => Building::create($data)], 201);
    }

    public function updateBuilding(Request $request, Building $building)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('buildings', 'code')->ignore($building->id)],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        $building->update($data);

        return response()->json(['message' => 'Building updated.', 'data' => $building->fresh()]);
    }

    public function destroyBuilding(Building $building)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        if ($building->floors()->exists() || $building->classes()->exists()) {
            return response()->json(['message' => 'Remove this building’s floors and class assignments before deleting it.'], 409);
        }
        $building->delete();

        return response()->json(['message' => 'Building deleted.']);
    }

    public function floors()
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }

        return response()->json(Floor::with('building')->withCount('rooms')->orderBy('building_id')->orderBy('name')->get());
    }

    public function storeFloor(Request $request)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'building_id' => ['required', 'integer', 'exists:buildings,id'],
            'name' => ['required', 'string', 'max:100'],
            'floor_number' => ['nullable', 'integer', 'min:0', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);
        if (Floor::where('building_id', $data['building_id'])->where('name', $data['name'])->exists()) {
            return response()->json(['message' => 'This floor already exists in the selected building.'], 422);
        }
        if (isset($data['floor_number']) && Floor::where('building_id', $data['building_id'])->where('floor_number', $data['floor_number'])->exists()) {
            return response()->json(['message' => 'This floor number is already used in the selected building.'], 422);
        }

        return response()->json(['message' => 'Floor created.', 'data' => Floor::create($data)->load('building')], 201);
    }

    public function updateFloor(Request $request, Floor $floor)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'building_id' => ['required', 'integer', 'exists:buildings,id'],
            'name' => ['required', 'string', 'max:100'],
            'floor_number' => ['nullable', 'integer', 'min:0', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        if (Floor::where('building_id', $data['building_id'])->where('name', $data['name'])->where('id', '!=', $floor->id)->exists()) {
            return response()->json(['message' => 'This floor already exists in the selected building.'], 422);
        }
        if (isset($data['floor_number']) && Floor::where('building_id', $data['building_id'])->where('floor_number', $data['floor_number'])->where('id', '!=', $floor->id)->exists()) {
            return response()->json(['message' => 'This floor number is already used in the selected building.'], 422);
        }
        $floor->update($data);

        return response()->json(['message' => 'Floor updated.', 'data' => $floor->fresh()->load('building')]);
    }

    public function destroyFloor(Floor $floor)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        if ($floor->rooms()->exists() || $floor->classes()->exists()) {
            return response()->json(['message' => 'Remove this floor’s rooms and class assignments before deleting it.'], 409);
        }
        $floor->delete();

        return response()->json(['message' => 'Floor deleted.']);
    }

    public function rooms()
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }

        return response()->json(Room::with('floor.building')->orderBy('floor_id')->orderBy('name')->get());
    }

    public function storeRoom(Request $request)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'floor_id' => ['required', 'integer', 'exists:floors,id'],
            'name' => ['required', 'string', 'max:100'],
            'room_type' => ['required', 'in:classroom,computer_lab,office,meeting_room,library,other'],
            'code' => ['nullable', 'string', 'max:50'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);
        if (Room::where('floor_id', $data['floor_id'])->where('name', $data['name'])->exists()) {
            return response()->json(['message' => 'This room already exists on the selected floor.'], 422);
        }

        return response()->json(['message' => 'Room created.', 'data' => Room::create($data)->load('floor.building')], 201);
    }

    public function updateRoom(Request $request, Room $room)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        $data = $request->validate([
            'floor_id' => ['required', 'integer', 'exists:floors,id'],
            'name' => ['required', 'string', 'max:100'],
            'room_type' => ['required', 'in:classroom,computer_lab,office,meeting_room,library,other'],
            'code' => ['nullable', 'string', 'max:50'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        if (Room::where('floor_id', $data['floor_id'])->where('name', $data['name'])->where('id', '!=', $room->id)->exists()) {
            return response()->json(['message' => 'This room already exists on the selected floor.'], 422);
        }
        $room->update($data);

        return response()->json(['message' => 'Room updated.', 'data' => $room->fresh()->load('floor.building')]);
    }

    public function destroyRoom(Room $room)
    {
        if ($response = $this->adminOnly()) {
            return $response;
        }
        if ($room->classes()->exists()) {
            return response()->json(['message' => 'Remove this room’s class assignments before deleting it.'], 409);
        }
        $room->delete();

        return response()->json(['message' => 'Room deleted.']);
    }

    private function adminOnly()
    {
        if (auth()->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can manage locations.'], 403);
        }

        return null;
    }
}
