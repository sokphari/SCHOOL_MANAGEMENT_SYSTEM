import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardUser, faEnvelope, faPenToSquare, faPhone, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { deleteTeacher, getTeachers } from "@/modules/teachers/api/teacherApi.ts";
import AppTable from "@/shared/components/AppTable.tsx";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";
import type { Teacher, TeacherFilters } from "@/modules/teachers/types/teacher";

const PAGE_SIZE = 10;

interface PaginationState {
  current_page: number;
  last_page: number;
  total: number;
}

interface TeacherColumn {
  key: string;
  title: string;
  render?: (row: Teacher, index: number) => ReactNode;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState<TeacherFilters>({ search: "", status: "", gender: "", page: 1 });
  const navigate = useNavigate();

  const fetchTeachers = useCallback(async (currentFilters: TeacherFilters) => {
    try {
      setLoading(true);
      const response = await getTeachers({ ...currentFilters, per_page: PAGE_SIZE });
      setTeachers(response.data.data || []);
      setPagination({
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
        total: response.data.total || 0,
      });
    } catch (error: unknown) {
      console.error(error);
      alert("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchTeachers(filters), filters.search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [filters, fetchTeachers]);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setFilters((current) => ({ ...current, [name]: value, page: 1 } as TeacherFilters));
  };

  const handlePageChange = (page: number) => setFilters((current) => ({ ...current, page }));

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await deleteTeacher(id);
      fetchTeachers(filters);
    } catch (error: unknown) {
      console.error(error);
      alert("Delete failed");
    }
  };

  const columns: TeacherColumn[] = [
    { key: "row_number", title: "No.", render: (_row, index) => (pagination.current_page - 1) * PAGE_SIZE + index + 1 },
    { key: "teacher_code", title: "Teacher code", render: (row) => <span className="font-semibold text-primary">{row.teacher_code || "—"}</span> },
    { key: "name", title: "Teacher", render: (row) => <span className="font-medium text-primary">{row.first_name} {row.last_name}</span> },
    {
      key: "gender", title: "Gender", render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${row.gender === "male" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300"}`}>
          {row.gender || "—"}
        </span>
      ),
    },
    { key: "phone", title: "Phone", render: (row) => <span className="inline-flex items-center gap-2 text-secondary"><FontAwesomeIcon icon={faPhone} className="text-[11px] text-brand" />{row.phone || "—"}</span> },
    { key: "email", title: "Email", render: (row) => <span className="inline-flex items-center gap-2 text-secondary"><FontAwesomeIcon icon={faEnvelope} className="text-[11px] text-brand" />{row.email || "—"}</span> },
    {
      key: "status", title: "Status", render: (row) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${row.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
          <span className={`size-1.5 rounded-full ${row.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />{row.status || "—"}
        </span>
      ),
    },
    {
      key: "actions", title: "Actions", render: (row) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate(`/admin/teachers/${row.id}/edit`)} className="grid size-8 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong" title="Edit teacher" aria-label={`Edit ${row.first_name} ${row.last_name}`}><FontAwesomeIcon icon={faPenToSquare} /></button>
          <button onClick={() => handleDelete(row.id)} className="grid size-8 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40" title="Delete teacher" aria-label={`Delete ${row.first_name} ${row.last_name}`}><FontAwesomeIcon icon={faTrash} /></button>
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
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Staff directory</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Teachers</h1>
          <p className="mb-0 mt-1 text-sm text-secondary">View and manage teacher records.</p>
        </div>
        <button onClick={() => navigate("/admin/teachers/create")} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/40"><FontAwesomeIcon icon={faPlus} /> Add teacher</button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid grid-cols-1 gap-x-3 gap-y-0 border-b border-border px-4 py-3 sm:grid-cols-2 sm:px-5 xl:grid-cols-[minmax(240px,2fr)_1fr_1fr]">
          <AppInput containerClassName="mb-0" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search by name, code, phone, or email" />
          <AppSelect containerClassName="mb-0" name="status" value={filters.status} onChange={handleFilterChange} placeholder="All statuses" options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
          <AppSelect containerClassName="mb-0" name="gender" value={filters.gender} onChange={handleFilterChange} placeholder="All genders" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} />
        </div>
        {loading ? <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading teachers…</span></div>
          : teachers.length > 0 ? <>
            <AppTable columns={columns} data={teachers} />
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{firstItem}–{lastItem}</span> of <span className="font-semibold text-primary">{pagination.total}</span> teachers <span className="text-muted">· 10 per page</span></p>
              <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} showSinglePage />
            </div>
          </> : <div className="grid min-h-56 place-items-center px-4 text-center"><div><span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-brand-soft text-xl text-brand"><FontAwesomeIcon icon={faChalkboardUser} /></span><p className="m-0 font-semibold text-primary">No teachers found</p><p className="mb-0 mt-1 text-sm text-muted">Try changing your filters or search terms.</p></div></div>}
      </section>
    </div>
  );
}
