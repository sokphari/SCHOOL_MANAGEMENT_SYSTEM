import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faChalkboardUser,
  faDoorOpen,
  faEye,
  faGrip,
  faPenToSquare,
  faPlus,
  faTableList,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { getClasses, deleteClass } from "@/modules/classes/api/classApi.ts";
import AppTable from "@/shared/components/AppTable.tsx";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";
import { useAuth } from "@/modules/auth/context/AuthContext";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import type { ClassFilters, ClassStatus, SchoolClass } from "@/modules/classes/types/class";

const PAGE_SIZE = 8;

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState<ClassFilters>({ search: "", status: "", page: 1 });
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchClasses = useCallback(async (currentFilters: ClassFilters) => {
    try {
      setLoading(true);
      const response = await getClasses({ ...currentFilters, per_page: PAGE_SIZE });
      setClasses(response.data.data || []);
      setPagination({
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
        total: response.data.total || 0,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchClasses(filters), filters.search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [filters, fetchClasses]);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => setFilters((current) => ({ ...current, page }));

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      await deleteClass(id);
      fetchClasses(filters);
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  const columns: AppTableColumn<SchoolClass>[] = [
    { key: "id", title: "ID" },
    { key: "name", title: "Class", render: (row) => <TagBadge tone="purple">{row.name}</TagBadge> },
    { key: "section", title: "Section", render: (row) => row.section ? <TagBadge tone="emerald">{row.section}</TagBadge> : "—" },
    { key: "academic_year", title: "Academic year" },
    { key: "room", title: "Room", render: (row) => row.room || "—" },
    { key: "teacher", title: "Teacher", render: (row) => row.teacher ? <TagBadge tone="blue">{row.teacher.first_name} {row.teacher.last_name}</TagBadge> : <span className="italic text-muted">Unassigned</span> },
    { key: "status", title: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions", title: "Actions", render: (row) => (
        <div className="flex items-center gap-1.5">
          <IconAction label="View class" onClick={() => navigate(`/admin/classes/${row.id}`)}><FontAwesomeIcon icon={faEye} /></IconAction>
          {user?.role === "admin" && <>
            <IconAction label="Edit class" onClick={() => navigate(`/admin/classes/${row.id}/edit`)}><FontAwesomeIcon icon={faPenToSquare} /></IconAction>
            <IconAction label="Delete class" danger onClick={() => handleDelete(row.id)}><FontAwesomeIcon icon={faTrash} /></IconAction>
          </>}
        </div>
      ),
    },
  ];

  const firstItem = pagination.total === 0 ? 0 : (pagination.current_page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(pagination.current_page * PAGE_SIZE, pagination.total);

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Learning groups</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Classes</h1>
          <p className="mb-0 mt-1 text-sm text-secondary">View classes and manage teacher assignments.</p>
        </div>
        {user?.role === "admin" && <button onClick={() => navigate("/admin/classes/create")} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} /> Add class</button>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid grid-cols-1 gap-x-3 gap-y-0 border-b border-border px-4 py-3 sm:grid-cols-[minmax(240px,2fr)_1fr_auto] sm:items-center sm:px-5">
          <AppInput containerClassName="mb-0" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search class, section, year, or room" />
          <AppSelect containerClassName="mb-0" name="status" value={filters.status} onChange={handleFilterChange} placeholder="All statuses" options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
          <div className="flex justify-end gap-1 rounded-lg border border-border bg-app-bg p-1">
            <button type="button" onClick={() => setViewMode("cards")} aria-label="Card view" aria-pressed={viewMode === "cards"} className={`grid size-9 place-items-center rounded-md transition ${viewMode === "cards" ? "bg-brand text-white shadow-sm" : "text-secondary hover:bg-brand-soft"}`}><FontAwesomeIcon icon={faGrip} /></button>
            <button type="button" onClick={() => setViewMode("table")} aria-label="Table view" aria-pressed={viewMode === "table"} className={`grid size-9 place-items-center rounded-md transition ${viewMode === "table" ? "bg-brand text-white shadow-sm" : "text-secondary hover:bg-brand-soft"}`}><FontAwesomeIcon icon={faTableList} /></button>
          </div>
        </div>

        {loading ? <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading classes…</span></div>
          : classes.length === 0 ? <div className="grid min-h-56 place-items-center px-4 text-center"><div><span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-brand-soft text-xl text-brand"><FontAwesomeIcon icon={faBookOpen} /></span><p className="m-0 font-semibold text-primary">No classes found</p><p className="mb-0 mt-1 text-sm text-muted">Try changing your filters or search terms.</p></div></div>
          : viewMode === "table" ? <AppTable columns={columns} data={classes} /> : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:p-5">
              {classes.map((classItem) => <ClassCard key={classItem.id} classItem={classItem} isAdmin={user?.role === "admin"} onView={() => navigate(`/admin/classes/${classItem.id}`)} onEdit={() => navigate(`/admin/classes/${classItem.id}/edit`)} onDelete={() => handleDelete(classItem.id)} />)}
            </div>
          )}

        {!loading && classes.length > 0 && <div className="flex flex-col gap-3 border-t border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{firstItem}–{lastItem}</span> of <span className="font-semibold text-primary">{pagination.total}</span> classes <span className="text-muted">· {PAGE_SIZE} per page</span></p>
          <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} showSinglePage />
        </div>}
      </section>
    </div>
  );
}

interface ClassCardProps { classItem: SchoolClass; isAdmin: boolean; onView: () => void; onEdit: () => void; onDelete: () => void }
function ClassCard({ classItem, isAdmin, onView, onEdit, onDelete }: ClassCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface-raised p-4 transition hover:border-brand/30 hover:shadow-card">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faBookOpen} /></span>
        <div className="min-w-0 flex-1"><h2 className="m-0 truncate text-base font-semibold text-primary"><TagBadge tone="purple">{classItem.name}</TagBadge></h2><p className="mb-0 mt-1 text-xs text-secondary">Class ID: <span className="font-semibold text-brand">{classItem.id}</span></p></div>
        <StatusBadge status={classItem.status} />
      </div>
      <dl className="mb-4 grid grid-cols-1 gap-0.5 text-sm">
        <InfoRow label="Section" value={classItem.section ? <TagBadge tone="emerald">{classItem.section}</TagBadge> : "—"} />
        <InfoRow label="Academic year" value={classItem.academic_year || "—"} />
        <InfoRow label="Students" value={<span className="inline-flex items-center gap-1.5"><span className="font-semibold text-brand">{classItem.students_count ?? 0}</span><span className="text-xs text-muted">enrolled</span></span>} />
        <InfoRow label="Room" value={<span className="inline-flex items-center gap-1.5"><FontAwesomeIcon icon={faDoorOpen} className="text-xs text-brand" />{classItem.room || "Not assigned"}</span>} />
        <InfoRow label="Teacher" value={classItem.teacher ? <TagBadge tone="blue"><FontAwesomeIcon icon={faChalkboardUser} />{classItem.teacher.first_name} {classItem.teacher.last_name}</TagBadge> : "Unassigned"} />
        {classItem.description && <InfoRow label="Description" value={classItem.description} />}
      </dl>
      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <button type="button" onClick={onView} className="flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-brand-strong transition hover:border-brand/30 hover:bg-brand-soft"><FontAwesomeIcon icon={faEye} /> View class</button>
        {isAdmin && <>
          <IconAction label="Edit class" onClick={onEdit}><FontAwesomeIcon icon={faPenToSquare} /></IconAction>
          <IconAction label="Delete class" danger onClick={onDelete}><FontAwesomeIcon icon={faTrash} /></IconAction>
        </>}
      </div>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="grid grid-cols-[minmax(105px,0.8fr)_minmax(0,1.2fr)] gap-2 border-b border-border/70 py-2 last:border-0"><dt className="text-xs font-semibold text-secondary">{label}</dt><dd className="m-0 break-words text-sm text-primary">{value}</dd></div>;
}

function StatusBadge({ status }: { status: ClassStatus | null | undefined }) {
  const active = status === "active";
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}><span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{status || "unknown"}</span>;
}

function TagBadge({ children, tone }: { children: ReactNode; tone: "purple" | "emerald" | "blue" }) {
  const tones = {
    purple: "border-brand/20 bg-brand-soft text-brand-strong",
    emerald: "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
    blue: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  };
  return <span className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function IconAction({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`grid size-9 shrink-0 place-items-center rounded-lg border transition ${danger ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40" : "border-border text-secondary hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"}`}>{children}</button>;
}
