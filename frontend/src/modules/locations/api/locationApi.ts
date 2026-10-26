import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type { BuildingLocation, BuildingPayload, FloorLocation, FloorPayload, RoomLocation, RoomPayload } from "@/modules/locations/types/location";

export const getBuildings = (): Promise<AxiosResponse<BuildingLocation[]>> => api.get("/locations/buildings");
export const getFloors = (): Promise<AxiosResponse<FloorLocation[]>> => api.get("/locations/floors");
export const getRooms = (): Promise<AxiosResponse<RoomLocation[]>> => api.get("/locations/rooms");

export const saveBuilding = (payload: BuildingPayload, id?: number) => id
  ? api.put(`/locations/buildings/${id}`, payload)
  : api.post("/locations/buildings", payload);
export const removeBuilding = (id: number) => api.delete(`/locations/buildings/${id}`);

export const saveFloor = (payload: FloorPayload, id?: number) => id
  ? api.put(`/locations/floors/${id}`, payload)
  : api.post("/locations/floors", payload);
export const removeFloor = (id: number) => api.delete(`/locations/floors/${id}`);

export const saveRoom = (payload: RoomPayload, id?: number) => id
  ? api.put(`/locations/rooms/${id}`, payload)
  : api.post("/locations/rooms", payload);
export const removeRoom = (id: number) => api.delete(`/locations/rooms/${id}`);
