import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBuilding, faDoorOpen, faFloppyDisk, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getBuildings, saveBuilding, saveFloor, saveRoom } from "@/modules/locations/api/locationApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { BuildingLocation, BuildingPayload, FloorLocation, FloorPayload, LocationStatus, RoomLocation, RoomPayload, RoomType } from "@/modules/locations/types/location";

type Kind = "building" | "floor" | "room";
type Draft = { name: string; code: string; description: string; status: LocationStatus; building_id: string; floor_id: string; floor_number: string; room_type: RoomType; capacity: string };

const roomTypes: { label: string; value: RoomType }[] = [
  { label: "Classroom", value: "classroom" }, { label: "Computer lab", value: "computer_lab" }, { label: "Office", value: "office" },
  { label: "Meeting room", value: "meeting_room" }, { label: "Library", value: "library" }, { label: "Other", value: "other" },
];
const initialDraft: Draft = { name: "", code: "", description: "", status: "active", building_id: "", floor_id: "", floor_number: "", room_type: "classroom", capacity: "" };

export default function FacilitiesFormPage({ kind }: { kind: Kind }) {
  const { id } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<BuildingLocation[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const record = useMemo(() => {
    const floors = buildings.flatMap((building) => building.floors || []);
    if (!id) return undefined;
    if (kind === "building") return buildings.find((item) => item.id === Number(id));
    if (kind === "floor") return floors.find((item) => item.id === Number(id));
    return floors.flatMap((floor) => floor.rooms || []).find((item) => item.id === Number(id));
  }, [buildings, id, kind]);
  const parentFloor = kind === "room" && query.get("floorId") ? buildings.flatMap((building) => building.floors || []).find((floor) => floor.id === Number(query.get("floorId"))) : undefined;
  const editingRoomFloor = kind === "room" && id ? buildings.flatMap((building) => building.floors || []).find((floor) => floor.id === (record as RoomLocation | undefined)?.floor_id) : undefined;
  const parentBuildingId = kind === "floor" ? Number(query.get("buildingId") || (record as FloorLocation | undefined)?.building_id) : parentFloor?.building_id || editingRoomFloor?.building_id;
  const returnBuildingId = kind === "building" ? (id || query.get("buildingId")) : parentBuildingId;

  useEffect(() => {
    let alive = true;
    getBuildings().then((response) => {
      if (alive) setBuildings(response.data || []);
    }).catch((requestError) => {
      console.error(requestError);
      if (alive) setError("Could not load facility data. Please return to Facilities and try again.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (id && !record) return;
    const building = kind === "building" ? record as BuildingLocation | undefined : undefined;
    const floor = kind === "floor" ? record as FloorLocation | undefined : undefined;
    const room = kind === "room" ? record as RoomLocation | undefined : undefined;
    const roomFloor = room ? buildings.flatMap((item) => item.floors || []).find((item) => item.id === room.floor_id) : undefined;
    setDraft({
      ...initialDraft,
      name: building?.name || floor?.name || room?.name || "",
      code: building?.code || floor?.code || room?.code || "",
      description: building?.description || "",
      status: building?.status || floor?.status || room?.status || "active",
      building_id: String(building?.id || floor?.building_id || parentBuildingId || roomFloor?.building_id || ""),
      floor_id: String(floor?.id || room?.floor_id || query.get("floorId") || parentFloor?.id || ""),
      floor_number: floor?.floor_number != null ? String(floor.floor_number) : "",
      room_type: room?.room_type || "classroom",
      capacity: room?.capacity != null ? String(room.capacity) : "",
    });
  }, [buildings, id, kind, loading, parentBuildingId, parentFloor?.id, record]);

  const floors = buildings.find((building) => building.id === Number(draft?.building_id))?.floors || [];
  const title = `${id ? "Edit" : "Create"} ${kind}`;
  const icon = kind === "building" ? faBuilding : kind === "floor" ? faLayerGroup : faDoorOpen;
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setDraft((current) => current ? { ...current, [name]: value, ...(name === "building_id" ? { floor_id: "" } : {}) } : current);
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };
  const cancel = () => navigate(`/admin/facilities${returnBuildingId ? `?buildingId=${returnBuildingId}` : ""}`);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true); setError(""); setFieldErrors({});
    try {
      if (kind === "building") {
        const payload: BuildingPayload = { name: draft.name.trim(), code: draft.code.trim(), description: draft.description.trim(), status: draft.status };
        const response = await saveBuilding(payload, id ? Number(id) : undefined);
        const savedId = response.data?.data?.id || id;
        navigate(`/admin/facilities?buildingId=${savedId}&notice=${encodeURIComponent(id ? "Building updated successfully." : "Building created successfully.")}`);
      } else if (kind === "floor") {
        const payload: FloorPayload = { building_id: Number(draft.building_id), name: draft.name.trim(), floor_number: draft.floor_number ? Number(draft.floor_number) : null, code: draft.code.trim(), status: draft.status };
        await saveFloor(payload, id ? Number(id) : undefined);
        navigate(`/admin/facilities?buildingId=${payload.building_id}&notice=${encodeURIComponent(id ? "Floor updated successfully." : "Floor created successfully.")}`);
      } else {
        const payload: RoomPayload = { floor_id: Number(draft.floor_id), name: draft.name.trim(), room_type: draft.room_type, code: draft.code.trim(), capacity: draft.capacity ? Number(draft.capacity) : null, status: draft.status };
        await saveRoom(payload, id ? Number(id) : undefined);
        navigate(`/admin/facilities?buildingId=${draft.building_id}&notice=${encodeURIComponent(id ? "Room updated successfully." : "Room created successfully.")}`);
      }
    } catch (requestError) {
      console.error(requestError);
      if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(requestError)) {
        setError(requestError.response?.data?.message || "Could not save this record.");
        setFieldErrors(Object.fromEntries(Object.entries(requestError.response?.data?.errors || {}).map(([key, messages]) => [key, messages[0] || "Invalid value."])));
      } else setError("Could not save this record.");
    } finally { setSaving(false); }
  };

  if (loading || (id && !record && !error)) return <div className="grid min-h-64 place-items-center text-sm text-secondary">Loading facility form…</div>;
  if (id && !record) return <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-surface p-6"><p role="alert" className="mb-4 text-sm text-rose-600">{error || `${kind} was not found.`}</p><Link to="/admin/facilities" className="font-semibold text-brand-strong">Back to Facilities</Link></div>;
  if (!draft) return null;

  return <main className="w-full space-y-4">
    <Link to={`/admin/facilities${returnBuildingId ? `?buildingId=${returnBuildingId}` : ""}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-semibold text-secondary hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faArrowLeft} />Back to Facilities</Link>
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <header className="flex items-center gap-4 border-b border-border bg-brand-soft/20 px-5 py-5 sm:px-7"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white"><FontAwesomeIcon icon={icon} /></span><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">Facilities record</p><h1 className="m-0 text-xl font-bold capitalize text-primary sm:text-2xl">{title}</h1><p className="mb-0 mt-1 text-sm text-secondary">Enter the {kind}'s information below. Fields marked optional can be left blank.</p></div></header>
      {error && <p role="alert" className="mx-5 mt-5 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 sm:mx-7">{error}</p>}
      <form onSubmit={submit}>
        <div className="space-y-6 p-5 sm:p-7">
          {kind === "building" ? <section className="space-y-4"><FormSection title="Building information" description="Name the building and set its code and availability." /><div className="grid gap-4 md:grid-cols-2"><AppInput label="Building name" name="name" required value={draft.name} onChange={change} placeholder="e.g. Building A" error={fieldErrors.name} /><AppInput label="Building code (optional)" name="code" value={draft.code} onChange={change} placeholder="e.g. BLDA" error={fieldErrors.code} /><AppSelect label="Status" name="status" value={draft.status} onChange={change} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={fieldErrors.status} /><div className="md:col-span-2"><label htmlFor="facility-description" className="mb-1.5 block text-[13px] font-semibold text-secondary">Description (optional)</label><textarea id="facility-description" name="description" rows={4} value={draft.description} onChange={change} placeholder="Add notes about this building" className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div></div></section> : null}
          {kind === "floor" ? <section className="space-y-4"><FormSection title="Floor information" description="Choose the parent building and identify this floor." /><div className="grid gap-4 md:grid-cols-2"><AppSelect label="Building" name="building_id" required value={draft.building_id} onChange={change} disabled={!id && Boolean(query.get("buildingId"))} options={buildings.filter((building) => building.status === "active" || building.id === Number(draft.building_id)).map((building) => ({ label: `${building.name}${building.code ? ` · ${building.code}` : ""}`, value: String(building.id) }))} placeholder="Select a building" error={fieldErrors.building_id} /><AppInput label="Floor name" name="name" required value={draft.name} onChange={change} placeholder="e.g. Ground Floor" error={fieldErrors.name} /><AppInput label="Floor number (optional)" name="floor_number" type="number" value={draft.floor_number} onChange={change} placeholder="e.g. 1" error={fieldErrors.floor_number} /><AppInput label="Floor code (optional)" name="code" value={draft.code} onChange={change} placeholder="e.g. F1" error={fieldErrors.code} /><AppSelect label="Status" name="status" value={draft.status} onChange={change} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={fieldErrors.status} /></div></section> : null}
          {kind === "room" ? <section className="space-y-4"><FormSection title="Room information" description="Rooms are always associated with a floor in a building." /><div className="grid gap-4 md:grid-cols-2"><AppSelect label="Building" name="building_id" required value={draft.building_id} onChange={change} disabled={Boolean(parentFloor)} options={buildings.filter((building) => building.status === "active" || building.id === Number(draft.building_id)).map((building) => ({ label: `${building.name}${building.code ? ` · ${building.code}` : ""}`, value: String(building.id) }))} placeholder="Select a building" /><AppSelect label="Floor" name="floor_id" required value={draft.floor_id} onChange={change} disabled={Boolean(parentFloor)} options={floors.filter((floor) => floor.status === "active" || floor.id === Number(draft.floor_id)).map((floor) => ({ label: floor.floor_number != null ? `Floor ${floor.floor_number} · ${floor.name}` : floor.name, value: String(floor.id) }))} placeholder="Select a floor" error={fieldErrors.floor_id} /><AppInput label="Room name / number" name="name" required value={draft.name} onChange={change} placeholder="e.g. Room 101" error={fieldErrors.name} /><AppSelect label="Room type" name="room_type" required value={draft.room_type} onChange={change} options={roomTypes} error={fieldErrors.room_type} /><AppInput label="Capacity (optional)" name="capacity" type="number" value={draft.capacity} onChange={change} placeholder="e.g. 30" error={fieldErrors.capacity} /><AppInput label="Room code (optional)" name="code" value={draft.code} onChange={change} placeholder="e.g. R101" error={fieldErrors.code} /><AppSelect label="Status" name="status" value={draft.status} onChange={change} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={fieldErrors.status} /></div></section> : null}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/25 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={cancel} disabled={saving} className="min-h-10 rounded-lg border border-border px-5 text-sm font-semibold text-secondary hover:bg-brand-soft">Cancel</button><button type="submit" disabled={saving || !draft.name.trim() || (kind !== "building" && !draft.building_id) || (kind === "room" && !draft.floor_id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : id ? `Save ${kind}` : `Create ${kind}`}</button></footer>
      </form>
    </section>
  </main>;
}

function FormSection({ title, description }: { title: string; description: string }) { return <header className="border-b border-border pb-3"><h2 className="m-0 text-base font-semibold text-primary">{title}</h2><p className="mb-0 mt-1 text-sm text-secondary">{description}</p></header>; }
