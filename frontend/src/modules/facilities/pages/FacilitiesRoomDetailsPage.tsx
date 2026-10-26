import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faDoorOpen, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBuildings } from "@/modules/locations/api/locationApi.ts";
import type { BuildingLocation, RoomLocation } from "@/modules/locations/types/location";

const roomTypeLabels = { classroom: "Classroom", computer_lab: "Computer lab", office: "Office", meeting_room: "Meeting room", library: "Library", other: "Other" };

export default function FacilitiesRoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomLocation | null>(null);
  const [building, setBuilding] = useState<BuildingLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getBuildings().then(({ data }) => {
      if (!alive) return;
      const foundBuilding = (data || []).find((item) => item.floors?.some((floor) => floor.rooms?.some((candidate) => candidate.id === Number(id))));
      const foundFloor = foundBuilding?.floors?.find((floor) => floor.rooms?.some((candidate) => candidate.id === Number(id)));
      const foundRoom = foundFloor?.rooms?.find((candidate) => candidate.id === Number(id));
      if (!foundRoom || !foundBuilding) setError("Room not found.");
      else { setRoom(foundRoom); setBuilding(foundBuilding); }
    }).catch((requestError) => {
      console.error(requestError);
      if (alive) setError("Could not load room details. Please try again.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const floor = building?.floors?.find((item) => item.id === room?.floor_id);
  const backUrl = `/admin/facilities${building ? `?buildingId=${building.id}` : ""}`;
  if (loading) return <div className="grid min-h-64 place-items-center text-sm text-secondary">Loading room details…</div>;
  if (!room) return <main className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-surface p-6"><p role="alert" className="mb-4 text-sm text-rose-600">{error || "Room not found."}</p><Link to="/admin/facilities" className="font-semibold text-brand-strong">Back to Facilities</Link></main>;

  return <main className="w-full space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to={backUrl} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-semibold text-secondary hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faArrowLeft} />Back to Facilities</Link><button type="button" onClick={() => navigate(`/admin/facilities/rooms/${room.id}/edit`)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"><FontAwesomeIcon icon={faPenToSquare} />Edit room</button></div>
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"><header className="flex flex-wrap items-center gap-4 border-b border-border bg-brand-soft/20 px-5 py-5 sm:px-7"><span className="grid size-12 place-items-center rounded-xl bg-brand text-white"><FontAwesomeIcon icon={faDoorOpen} /></span><div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">Room details</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">{room.name}</h1><p className="mb-0 mt-1 text-sm text-secondary">{building?.name || "Building"} · {floor?.floor_number != null ? `Floor ${floor.floor_number}` : floor?.name || "Floor"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${room.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{room.status}</span></header>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-7"><Detail label="Room type" value={(room.room_type && roomTypeLabels[room.room_type]) || "Other"} /><Detail label="Room code" value={room.code || "Not set"} /><Detail label="Capacity" value={room.capacity ?? "Not set"} /><Detail label="Building" value={building?.name || "—"} /><Detail label="Floor" value={floor?.floor_number != null ? `Floor ${floor.floor_number} · ${floor.name}` : floor?.name || "—"} /><Detail label="Status" value={room.status} /></div>
    </section>
  </main>;
}

function Detail({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border bg-app-bg/25 p-4"><p className="m-0 text-xs font-medium text-muted">{label}</p><p className="mb-0 mt-1 text-sm font-semibold capitalize text-primary">{value}</p></div>; }
