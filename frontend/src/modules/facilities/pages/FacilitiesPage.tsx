import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faChevronDown, faDoorOpen, faLayerGroup, faMagnifyingGlass, faPenToSquare, faPlus, faTrash, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBuildings, removeBuilding, removeFloor, removeRoom } from "@/modules/locations/api/locationApi.ts";
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
  const totalCapacity = allRooms.reduce((total, room) => total + (room.capacity || 0), 0);
  const hasRoomFilters = Boolean(search.trim() || roomType || roomStatus);

  const filterRooms = (rooms: RoomLocation[]) => rooms.filter((room) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${room.name} ${room.code || ""} ${room.room_type || ""}`.toLowerCase().includes(term);
    return matchesSearch && (!roomType || room.room_type === roomType) && (!roomStatus || room.status === roomStatus);
  });
  const visibleFloors = hasRoomFilters ? floors.filter((floor) => filterRooms(floor.rooms || []).length > 0) : floors;
  const roomCountForBuilding = (building: BuildingLocation) => (building.floors || []).reduce((total, floor) => total + (floor.rooms?.length || 0), 0);

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
    { label: "Total buildings", value: buildings.length, icon: faBuilding, color: "text-violet-600 dark:text-violet-300" },
    { label: "Total floors", value: floorCount, icon: faLayerGroup, color: "text-blue-600 dark:text-blue-300" },
    { label: "Total rooms", value: allRooms.length, icon: faDoorOpen, color: "text-orange-600 dark:text-orange-300" },
    { label: "Total capacity", value: totalCapacity || "—", icon: faUsers, color: "text-sky-600 dark:text-sky-300" },
  ];

  const openCreateBuilding = () => navigate(`/admin/facilities/buildings/create${selectedBuildingId ? `?buildingId=${selectedBuildingId}` : ""}`);

  return <div className="mx-auto w-full max-w-[1800px] space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Campus facilities</p><h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Buildings &amp; Rooms</h1><p className="mb-0 mt-1 text-sm text-secondary">Manage floors and rooms for each building.</p></div><button type="button" onClick={openCreateBuilding} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} />Add building</button></header>

    {success && <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{success}<button type="button" onClick={() => setSuccess("")} aria-label="Dismiss message" className="grid size-7 place-items-center rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900"><FontAwesomeIcon icon={faXmark} /></button></div>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><span>{error}</span><div className="flex items-center gap-2"><button type="button" onClick={() => void loadFacilities()} className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-900">Try again</button><button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="grid size-7 place-items-center rounded-md hover:bg-rose-100 dark:hover:bg-rose-900"><FontAwesomeIcon icon={faXmark} /></button></div></div>}

    <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside aria-label="Buildings" className="h-fit overflow-hidden rounded-xl border border-border bg-surface lg:sticky lg:top-4">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-3"><h2 className="m-0 text-[11px] font-bold uppercase tracking-[1px] text-muted">Buildings</h2><button type="button" onClick={openCreateBuilding} aria-label="Add building" title="Add building" className="grid size-8 place-items-center rounded-lg border border-border text-secondary hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPlus} /></button></div>
        {loading ? <div className="px-3.5 py-4 text-xs text-muted">Loading buildings…</div> : buildings.length ? <nav className="flex gap-2 overflow-x-auto p-2 lg:block lg:space-y-1 lg:overflow-visible">{buildings.map((building) => {
          const active = String(building.id) === selectedBuildingId;
          const buildingFloors = building.floors?.length || 0;
          const buildingRooms = roomCountForBuilding(building);
          return <button type="button" key={building.id} aria-current={active ? "page" : undefined} onClick={() => { setSelectedBuildingId(String(building.id)); setExpandedFloorId(null); setSearch(""); setRoomType(""); setRoomStatus(""); }} className={`flex min-w-[210px] items-center gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2.5 text-left transition lg:w-full lg:min-w-0 ${active ? "border-brand bg-brand-soft/70" : "border-transparent hover:bg-app-bg/50"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-md ${active ? "bg-brand text-white" : "border border-border bg-app-bg text-secondary"}`}><FontAwesomeIcon icon={faBuilding} className="text-xs" /></span><span className="min-w-0 flex-1"><span className={`block truncate text-sm font-semibold ${active ? "text-brand-strong" : "text-primary"}`}>{building.name}</span><span className="block truncate text-[11px] text-muted">{buildingFloors} {buildingFloors === 1 ? "floor" : "floors"} · {buildingRooms} {buildingRooms === 1 ? "room" : "rooms"}</span></span><span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${building.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"}`}>{building.status}</span></button>;
        })}</nav> : <div className="px-3.5 py-4 text-xs text-muted">No buildings yet.</div>}
      </aside>

      <section className="min-w-0 space-y-4">
        <div aria-label="Facility statistics" className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="min-h-[92px] rounded-xl border border-border bg-surface p-3.5 shadow-card"><FontAwesomeIcon icon={stat.icon} className={`mb-2 text-sm ${stat.color}`} /><p className="m-0 text-xl font-bold leading-none text-primary">{loading ? "—" : stat.value}</p><p className="mb-0 mt-1.5 text-xs text-secondary">{stat.label}</p></article>)}</div>

        {loading ? <div className="grid min-h-56 place-items-center rounded-xl border border-border bg-surface text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading selected building…</span></div> : !selectedBuilding ? <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border bg-surface px-5 text-center"><div><span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faBuilding} /></span><h2 className="m-0 text-base font-semibold text-primary">No building selected</h2><p className="mb-4 mt-1 text-sm text-secondary">Add a building to start organizing floors and rooms.</p><button type="button" onClick={openCreateBuilding} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} className="mr-2" />Add building</button></div></div> : <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"><div className="min-w-0"><h2 className="m-0 truncate text-base font-semibold text-primary">{selectedBuilding.name}</h2><div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-secondary"><span className="rounded border border-border px-2 py-0.5">{selectedBuilding.code || "No code assigned"}</span><span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">{floors.length} {floors.length === 1 ? "floor" : "floors"}</span><span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">{roomCountForBuilding(selectedBuilding)} {roomCountForBuilding(selectedBuilding) === 1 ? "room" : "rooms"}</span><span className={`rounded-full px-2 py-0.5 font-medium ${selectedBuilding.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"}`}>{selectedBuilding.status}</span></div>{selectedBuilding.description && <p className="mb-0 mt-1.5 line-clamp-1 text-xs text-muted">{selectedBuilding.description}</p>}</div><div className="flex shrink-0 gap-1.5"><button type="button" onClick={() => navigate(`/admin/facilities/buildings/${selectedBuilding.id}/edit?buildingId=${selectedBuilding.id}`)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-secondary hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} />Edit</button><button type="button" onClick={() => void deleteLocation("building", selectedBuilding)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-secondary hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"><FontAwesomeIcon icon={faTrash} />Delete</button></div></section>

          <section className="overflow-hidden rounded-xl border border-border bg-surface"><header className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-3"><div><h2 className="m-0 text-sm font-semibold text-primary">Floors &amp; Rooms <span className="font-normal text-muted">· {floors.length} {floors.length === 1 ? "floor" : "floors"}, {roomCountForBuilding(selectedBuilding)} {roomCountForBuilding(selectedBuilding) === 1 ? "room" : "rooms"}</span></h2></div><button type="button" onClick={() => navigate(`/admin/facilities/floors/create?buildingId=${selectedBuilding.id}`)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} />Add floor</button></header>
            {floors.length > 0 && <div className="grid gap-2 border-y border-border bg-app-bg/25 p-2.5 md:grid-cols-[minmax(180px,1fr)_180px_140px]"><div className="relative"><FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted" /><input type="search" value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Search rooms by name or code…" aria-label="Search rooms" className="min-h-9 w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div><select value={roomType} onChange={(event) => setRoomType(event.currentTarget.value)} aria-label="Filter by room type" className="min-h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"><option value="">All room types</option>{Object.entries(roomTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={roomStatus} onChange={(event) => setRoomStatus(event.currentTarget.value)} aria-label="Filter by room status" className="min-h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>}
            {floors.length === 0 ? <div className="grid min-h-28 place-items-center px-4 text-center"><p className="m-0 text-sm text-secondary">No floors in this building yet. Add a floor to get started.</p></div> : visibleFloors.length ? <div className="space-y-2 p-2.5">{visibleFloors.map((floor) => <FloorAccordion key={floor.id} floor={floor} expanded={expandedFloorId === floor.id || (hasRoomFilters && filterRooms(floor.rooms || []).length > 0)} rooms={filterRooms(floor.rooms || [])} hasFilters={hasRoomFilters} onToggle={() => setExpandedFloorId(expandedFloorId === floor.id ? null : floor.id)} onAddRoom={() => navigate(`/admin/facilities/rooms/create?floorId=${floor.id}`)} onEditFloor={() => navigate(`/admin/facilities/floors/${floor.id}/edit?buildingId=${selectedBuilding.id}`)} onDeleteFloor={() => void deleteLocation("floor", floor)} onEditRoom={(room) => navigate(`/admin/facilities/rooms/${room.id}/edit?buildingId=${selectedBuilding.id}`)} onDeleteRoom={(room) => void deleteLocation("room", room)} onViewRoom={(room) => navigate(`/admin/facilities/rooms/${room.id}?buildingId=${selectedBuilding.id}`)} />)}</div> : <div className="grid min-h-24 place-items-center px-4 text-center"><p className="m-0 text-sm text-secondary">No rooms match your search and filters.</p></div>}
          </section>
        </>}
      </section>
    </div>
  </div>;
}

function FloorAccordion({ floor, rooms, expanded, hasFilters, onToggle, onAddRoom, onEditFloor, onDeleteFloor, onEditRoom, onDeleteRoom, onViewRoom }: { floor: FloorLocation; rooms: RoomLocation[]; expanded: boolean; hasFilters: boolean; onToggle: () => void; onAddRoom: () => void; onEditFloor: () => void; onDeleteFloor: () => void; onEditRoom: (room: RoomLocation) => void; onDeleteRoom: (room: RoomLocation) => void; onViewRoom: (room: RoomLocation) => void }) {
  const floorCapacity = rooms.reduce((total, room) => total + (room.capacity || 0), 0);
  return <article className="overflow-hidden rounded-lg border border-border bg-surface-raised"><div className="flex flex-wrap items-center gap-2 p-2 sm:p-2.5"><button type="button" aria-expanded={expanded} onClick={onToggle} className="flex min-h-9 min-w-0 flex-1 items-center gap-2.5 text-left"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-soft text-xs font-bold text-brand-strong">{floor.floor_number ?? "—"}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-primary">{floor.floor_number != null ? `Floor ${floor.floor_number}${floor.name && floor.name !== `Floor ${floor.floor_number}` ? ` — ${floor.name}` : ""}` : floor.name}</span><span className="block text-[11px] text-muted">{rooms.length} {rooms.length === 1 ? "room" : "rooms"}{floorCapacity ? ` · capacity ${floorCapacity}` : ""}{floor.code ? ` · ${floor.code}` : ""}</span></span><span className="ml-auto hidden rounded-full border border-border px-2 py-0.5 text-[10px] text-secondary sm:inline-flex">{rooms.length} {rooms.length === 1 ? "room" : "rooms"}</span><FontAwesomeIcon icon={faChevronDown} className={`ml-1 text-[10px] text-muted transition-transform ${expanded ? "rotate-180" : ""}`} /></button><div className="ml-auto flex items-center gap-1"><button type="button" onClick={onAddRoom} className="inline-flex min-h-8 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-secondary hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPlus} />Room</button><button type="button" onClick={onEditFloor} aria-label={`Edit ${floor.name}`} className="grid size-8 place-items-center rounded-md border border-border text-secondary hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} className="text-xs" /></button><button type="button" onClick={onDeleteFloor} aria-label={`Delete ${floor.name}`} className="grid size-8 place-items-center rounded-md border border-border text-secondary hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"><FontAwesomeIcon icon={faTrash} className="text-xs" /></button></div></div>
    {expanded && <div className="border-t border-border bg-app-bg/20 p-2.5 sm:p-3">{rooms.length ? <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">{rooms.map((room) => <RoomCard key={room.id} room={room} onView={() => onViewRoom(room)} onEdit={() => onEditRoom(room)} onDelete={() => onDeleteRoom(room)} />)}</div> : <div className="grid min-h-20 place-items-center rounded-lg border border-dashed border-border px-3 text-center text-xs text-muted">{hasFilters ? "No rooms match the current filters on this floor." : "No rooms on this floor yet."}</div>}</div>}
  </article>;
}

function RoomCard({ room, onView, onEdit, onDelete }: { room: RoomLocation; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return <article className="rounded-lg border border-border bg-surface p-3"><div className="flex items-start gap-2"><span className="mt-0.5 size-2 shrink-0 rounded-full bg-brand" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="m-0 truncate text-xs font-semibold text-primary">{room.name}</h3><span className={`size-1.5 shrink-0 rounded-full ${room.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} title={room.status} /></div><p className="mb-0 mt-1 text-[11px] text-muted">{room.code || (room.room_type && roomTypeLabels[room.room_type]) || "Room"}</p></div><div className="flex gap-1"><button type="button" onClick={onView} aria-label={`View ${room.name}`} className="grid size-6 place-items-center rounded border border-border text-brand-strong hover:bg-brand-soft"><FontAwesomeIcon icon={faDoorOpen} className="text-[10px]" /></button><button type="button" onClick={onDelete} aria-label={`Delete ${room.name}`} className="grid size-6 place-items-center rounded border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"><FontAwesomeIcon icon={faXmark} className="text-[10px]" /></button></div></div><div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[10px]"><span className="text-muted">Capacity</span><span className="font-semibold text-primary">{room.capacity != null ? `${room.capacity} seats` : "Not set"}</span><button type="button" onClick={onEdit} aria-label={`Edit ${room.name}`} className="ml-2 text-secondary hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /></button></div></article>;
}
