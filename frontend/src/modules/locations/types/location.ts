export type LocationStatus = "active" | "inactive";
export type RoomType = "classroom" | "computer_lab" | "office" | "meeting_room" | "library" | "other";

export interface RoomLocation {
  id: number;
  floor_id: number;
  name: string;
  room_type: RoomType | null;
  code: string | null;
  capacity: number | null;
  status: LocationStatus;
  floor?: FloorLocation & { building?: Pick<BuildingLocation, "id" | "name" | "code"> };
}

export interface FloorLocation {
  id: number;
  building_id: number;
  name: string;
  floor_number: number | null;
  code: string | null;
  status: LocationStatus;
  rooms?: RoomLocation[];
  rooms_count?: number;
  building?: Pick<BuildingLocation, "id" | "name" | "code">;
}

export interface BuildingLocation {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: LocationStatus;
  floors_count?: number;
  floors?: FloorLocation[];
}

export interface BuildingPayload { name: string; code: string; description: string; status: LocationStatus }
export interface FloorPayload { building_id: number; name: string; floor_number: number | null; code: string; status: LocationStatus }
export interface RoomPayload { floor_id: number; name: string; room_type: RoomType; code: string; capacity: number | null; status: LocationStatus }
