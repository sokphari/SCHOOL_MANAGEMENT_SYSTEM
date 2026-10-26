import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faChevronDown, faDoorOpen, faLayerGroup, faMagnifyingGlass, faPenToSquare, faPlus, faTrash, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBuildings, removeBuilding, removeFloor, removeRoom } from "@/modules/locations/api/locationApi.ts";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { BuildingLocation, FloorLocation, RoomLocation } from "@/modules/locations/types/location";

const roomTypeLabels = { classroom: "Classroom", computer_lab: "Computer lab", office: "Office", meeting_room: "Meeting room", library: "Library", other: "Other" };

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [buildings, setBuildings] = useState<BuildingLocation[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(searchParams.get("buildingId") || "");
  const [expandedFloorId, setExpandedFloorId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roomType, setRoomType] = useState("");
  const [roomStatus, setRoomStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(searchParams.get("notice") || "");

  const loadFacilities = useCallback(async (preserveBuildingId?: string) => {
    setLoading(true);
    try {
      const response = await getBuildings();
      const nextBuildings = response.data || [];
      setBuildings(nextBuildings);
      setSelectedBuildingId((current) => {
        const requested = preserveBuildingId || current;
        return nextBuildings.some((item) => String(item.id) === requested)
          ? requested
          : String(nextBuildings.find((item) => item.status === "active")?.id || nextBuildings[0]?.id || "");
      });
      setError("");
    } catch (requestError) {
      console.error(requestError);
      setError("Could not load facilities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFacilities(); }, [loadFacilities]);
  useEffect(() => {
    const notice = searchParams.get("notice");
    if (!notice) return;
    setSuccess(notice);
    const next = new URLSearchParams(searchParams);
    next.delete("notice");
    navigate({ search: next.toString() }, { replace: true });
  }, [navigate, searchParams]);

  const selectedBuilding = buildings.find((building) => String(building.id) === selectedBuildingId) || null;
  const floors = selectedBuilding?.floors || [];
  const floorCount = useMemo(() => buildings.reduce((total, building) => total + (building.floors?.length || 0), 0), [buildings]);
  const allRooms = useMemo(() => buildings.flatMap((building) => (building.floors || []).flatMap((floor) => floor.rooms || [])), [buildings]);
  const roomsWithCapacity = allRooms.filter((room) => room.capacity != null);
  const totalCapacity = roomsWithCapacity.length ? roomsWithCapacity.reduce((total, room) => total + (room.capacity || 0), 0) : "—";
  const hasRoomFilters = Boolean(search.trim() || roomType || roomStatus);

  const filterRooms = (rooms: RoomLocation[]) => rooms.filter((room) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${room.name} ${room.code || ""} ${room.room_type || ""}`.toLowerCase().includes(term);
    return matchesSearch && (!roomType || room.room_type === roomType) && (!roomStatus || room.status === roomStatus);
  });
  const visibleFloors = hasRoomFilters ? floors.filter((floor) => filterRooms(floor.rooms || []).length > 0) : floors;

  const deleteLocation = async (kind: "building" | "floor" | "room", record: BuildingLocation | FloorLocation | RoomLocation) => {
    if (!window.confirm(`Delete ${record.name}?`)) return;
    setError(""); setSuccess("");
    try {
      if (kind === "building") await removeBuilding(record.id);
      else if (kind === "floor") await removeFloor(record.id);
      else await removeRoom(record.id);
      setSuccess(`${kind[0].toUpperCase()}${kind.slice(1)} deleted.`);
      await loadFacilities(kind === "building" ? undefined : selectedBuildingId);
    } catch (requestError) {
      console.error(requestError);
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || `Could not delete ${kind}.` : `Could not delete ${kind}.`);
    }
  };

  const stats = [
    { label: "Total buildings", value: buildings.length, icon: faBuilding, color: "text-violet-600 bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300" },
    { label: "Total floors", value: floorCount, icon: faLayerGroup, color: "text-sky-700 bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300" },
    { label: "Total rooms", value: allRooms.length, icon: faDoorOpen, color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300" },
    { label: "Total capacity", value: totalCapacity || "—", icon: faUsers, color: "text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300" },
  ];

  return <div className="mx-auto w-full max-w-[1800px] space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Campus facilities</p><h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Buildings &amp; Rooms</h1><p className="mb-0 mt-1 text-sm text-secondary">Manage school buildings, floors, and rooms.</p></div><button type="button" onClick={() => navigate(`/admin/facilities/buildings/create${selectedBuildingId ? `?buildingId=${selectedBuildingId}` : ""}`)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} /> Add building</button></header>

    {success && <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{success}<button type="button" onClick={() => setSuccess("")} aria-label="Dismiss message" className="grid size-7 place-items-center rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900"><FontAwesomeIcon icon={faXmark} /></button></div>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><span>{error}</span><div className="flex items-center gap-2"><button type="button" onClick={() => void loadFacilities()} className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-900">Try again</button><button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="grid size-7 place-items-center rounded-md hover:bg-rose-100 dark:hover:bg-rose-900"><FontAwesomeIcon icon={faXmark} /></button></div></div>}

    <section aria-label="Facility statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="flex min-h-[86px] items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"><span className={`grid size-11 place-items-center rounded-xl ${stat.color}`}><FontAwesomeIcon icon={stat.icon} /></span><div><p className="m-0 text-xs text-secondary">{stat.label}</p><p className="mb-0 mt-1 text-xl font-bold text-primary">{loading ? "—" : stat.value}</p></div></article>)}</section>

    {loading ? <div className="grid min-h-64 place-items-center rounded-2xl border border-border bg-surface text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading facilities…</span></div> : buildings.length === 0 ? <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-surface px-5 text-center"><div><span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faBuilding} /></span><h2 className="m-0 text-base font-semibold text-primary">No buildings yet</h2><p className="mb-4 mt-1 text-sm text-secondary">Create a building to start organizing floors and rooms.</p><button type="button" onClick={() => navigate("/admin/facilities/buildings/create")} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} className="mr-2" />Add building</button></div></section> : <>
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5"><div className="grid gap-4 lg:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.25fr)] lg:items-end"><AppSelect label="Select building" name="facility-building" value={selectedBuildingId} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setSelectedBuildingId(event.currentTarget.value); setExpandedFloorId(null); }} options={buildings.map((building) => ({ label: `${building.name}${building.code ? ` · ${building.code}` : ""}`, value: String(building.id) }))} placeholder="Choose a building" /><div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-app-bg/40 p-3 text-center"><Metric label="Floors" value={selectedBuilding?.floors_count ?? floors.length} /><Metric label="Rooms" value={floors.reduce((total, floor) => total + (floor.rooms?.length || 0), 0)} /><Metric label="Status" value={selectedBuilding?.status || "—"} /></div></div>
        {selectedBuilding && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div><h2 className="m-0 text-lg font-semibold text-primary">{selectedBuilding.name}</h2><p className="mb-0 mt-1 text-sm text-secondary">{selectedBuilding.code ? `Code ${selectedBuilding.code}` : "No building code"}{selectedBuilding.description ? ` · ${selectedBuilding.description}` : ""}</p></div><div className="flex gap-2"><button type="button" onClick={() => navigate(`/admin/facilities/buildings/${selectedBuilding.id}/edit?buildingId=${selectedBuilding.id}`)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-secondary hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} />Edit building</button><button type="button" onClick={() => void deleteLocation("building", selectedBuilding)} aria-label="Delete building" className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900"><FontAwesomeIcon icon={faTrash} /></button></div></div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5"><div><h2 className="m-0 text-base font-semibold text-primary">Floors and rooms</h2><p className="mb-0 mt-1 text-xs text-muted">{visibleFloors.length} floors shown · {floors.reduce((n, f) => n + (f.rooms?.length || 0), 0)} rooms in {selectedBuilding?.name}</p></div><button type="button" disabled={!selectedBuilding} onClick={() => selectedBuilding && navigate(`/admin/facilities/floors/create?buildingId=${selectedBuilding.id}`)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"><FontAwesomeIcon icon={faPlus} />Add floor</button></div>
        {floors.length > 0 && <div className="grid gap-3 border-b border-border bg-app-bg/25 p-4 md:grid-cols-[minmax(200px,1fr)_220px_180px]"><div className="relative"><FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" /><input type="search" value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Search rooms by name or code" aria-label="Search rooms" className="min-h-10 w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div><select value={roomType} onChange={(event) => setRoomType(event.currentTarget.value)} aria-label="Filter by room type" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"><option value="">All room types</option>{Object.entries(roomTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={roomStatus} onChange={(event) => setRoomStatus(event.currentTarget.value)} aria-label="Filter by room status" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>}
        {visibleFloors.length ? <div className="space-y-3 p-3 sm:p-4">{visibleFloors.map((floor) => <FloorAccordion key={floor.id} floor={floor} expanded={expandedFloorId === floor.id || (hasRoomFilters && filterRooms(floor.rooms || []).length > 0)} rooms={filterRooms(floor.rooms || [])} hasFilters={hasRoomFilters} onToggle={() => setExpandedFloorId(expandedFloorId === floor.id ? null : floor.id)} onAddRoom={() => navigate(`/admin/facilities/rooms/create?floorId=${floor.id}`)} onEditFloor={() => navigate(`/admin/facilities/floors/${floor.id}/edit`)} onDeleteFloor={() => void deleteLocation("floor", floor)} onEditRoom={(room) => navigate(`/admin/facilities/rooms/${room.id}/edit`)} onDeleteRoom={(room) => void deleteLocation("room", room)} onViewRoom={(room) => navigate(`/admin/facilities/rooms/${room.id}`)} />)}</div> : <div className="grid min-h-36 place-items-center px-5 text-center"><p className="m-0 text-sm text-secondary">{hasRoomFilters ? "No rooms match your search and filters." : "No floors in this building yet. Add a floor to get started."}</p></div>}
      </section>
    </>}
  </div>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <div><p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mb-0 mt-1 truncate text-sm font-semibold capitalize text-primary">{value}</p></div>; }

function FloorAccordion({ floor, rooms, expanded, hasFilters, onToggle, onAddRoom, onEditFloor, onDeleteFloor, onEditRoom, onDeleteRoom, onViewRoom }: { floor: FloorLocation; rooms: RoomLocation[]; expanded: boolean; hasFilters: boolean; onToggle: () => void; onAddRoom: () => void; onEditFloor: () => void; onDeleteFloor: () => void; onEditRoom: (room: RoomLocation) => void; onDeleteRoom: (room: RoomLocation) => void; onViewRoom: (room: RoomLocation) => void }) {
  return <article className="overflow-hidden rounded-xl border border-border bg-surface-raised"><div className="flex flex-wrap items-center gap-3 p-3 sm:p-4"><button type="button" aria-expanded={expanded} onClick={onToggle} className="flex min-h-10 min-w-0 flex-1 items-center gap-3 text-left"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><FontAwesomeIcon icon={faLayerGroup} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-primary">{floor.floor_number != null ? `Floor ${floor.floor_number}` : floor.name}{floor.floor_number != null && floor.name && floor.name !== `Floor ${floor.floor_number}` ? ` · ${floor.name}` : ""}</span><span className="block text-xs text-muted">{floor.rooms?.length || 0} rooms{floor.code ? ` · ${floor.code}` : ""}</span></span><FontAwesomeIcon icon={faChevronDown} className={`ml-auto text-xs text-muted transition-transform ${expanded ? "rotate-180" : ""}`} /></button><div className="ml-auto flex items-center gap-1.5"><button type="button" onClick={onAddRoom} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-brand/20 px-2.5 text-xs font-semibold text-brand-strong hover:bg-brand-soft"><FontAwesomeIcon icon={faPlus} />Room</button><button type="button" onClick={onEditFloor} aria-label={`Edit ${floor.name}`} className="grid size-9 place-items-center rounded-lg border border-border text-secondary hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /></button><button type="button" onClick={onDeleteFloor} aria-label={`Delete ${floor.name}`} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900"><FontAwesomeIcon icon={faTrash} /></button></div></div>
    {expanded && <div className="border-t border-border bg-app-bg/20 p-3 sm:p-4">{rooms.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">{rooms.map((room) => <RoomCard key={room.id} room={room} onView={() => onViewRoom(room)} onEdit={() => onEditRoom(room)} onDelete={() => onDeleteRoom(room)} />)}</div> : <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-border px-3 text-center text-sm text-muted">{hasFilters ? "No rooms match the current filters on this floor." : "No rooms on this floor yet."}</div>}</div>}
  </article>;
}

function RoomCard({ room, onView, onEdit, onDelete }: { room: RoomLocation; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return <article className="rounded-xl border border-border bg-surface p-4 transition hover:border-brand/30"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><FontAwesomeIcon icon={faDoorOpen} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 truncate text-sm font-semibold text-primary">{room.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${room.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{room.status}</span></div><p className="mb-0 mt-1 text-xs text-secondary">{(room.room_type && roomTypeLabels[room.room_type]) || "Other"}{room.code ? ` · ${room.code}` : ""}{room.capacity ? ` · Capacity ${room.capacity}` : ""}</p></div></div><div className="mt-3 flex items-center justify-between border-t border-border pt-2.5"><button type="button" onClick={onView} className="text-xs font-semibold text-brand-strong hover:underline">View details</button><div className="flex gap-1.5"><button type="button" onClick={onEdit} aria-label={`Edit ${room.name}`} className="grid size-8 place-items-center rounded-lg border border-border text-secondary hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /></button><button type="button" onClick={onDelete} aria-label={`Delete ${room.name}`} className="grid size-8 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900"><FontAwesomeIcon icon={faTrash} /></button></div></div></article>;
}

