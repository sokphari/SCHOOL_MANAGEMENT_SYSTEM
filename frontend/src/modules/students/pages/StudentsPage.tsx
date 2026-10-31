import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, deleteStudent } from "@/modules/students/api/studentApi.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPenToSquare, faQrcode, faTrash } from "@fortawesome/free-solid-svg-icons";
import AppTable from "@/shared/components/AppTable.tsx";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import type { Student, StudentFilters } from "@/modules/students/types/student";

interface PaginationState {
  current_page: number;
  last_page: number;
  total: number;
}

interface StudentColumn {
  key: string;
  title: string;
  render?: (row: Student, index: number) => ReactNode;
}

const PAGE_SIZE = 15;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState<StudentFilters>({ search: "", status: "", gender: "", page: 1 });
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchStudents = useCallback(async (customFilters: StudentFilters) => {
    try {
      setLoading(true);
      const res = await getStudents({ ...customFilters, per_page: PAGE_SIZE });
      setStudents(res.data.data || []);
      setPagination({
        current_page: res.data.current_page || 1,
        last_page: res.data.last_page || 1,
        total: res.data.total || 0,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteStudent(id);
      fetchStudents(filters);
    } catch {
      alert("Delete failed");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => fetchStudents(filters), filters.search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [filters, fetchStudents]);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    } as StudentFilters));
  };

  const handlePageChange = (page: number) => {
    setFilters((current) => ({ ...current, page }));
  };

  const columns: StudentColumn[] = [
    { key: "row_number", title: "No.", render: (_row, index) => (pagination.current_page - 1) * PAGE_SIZE + index + 1 },
    { key: "student_code", title: "Student code", render: (row) => <span className="font-semibold text-primary">{row.student_code || "—"}</span> },
    { key: "name", title: "Student", render: (row) => <div className="font-medium text-primary">{row.first_name} {row.last_name}</div> },
    {
      key: "gender", title: "Gender", render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${row.gender === "male" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300"}`}>
          {row.gender || "—"}
        </span>
      ),
    },
    { key: "phone", title: "Phone", render: (row) => <span className="text-secondary">{row.phone || "—"}</span> },
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
          <button onClick={() => navigate(`/admin/students/${row.id}`)} className="grid size-8 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong" title="View student" aria-label={`View ${row.first_name} ${row.last_name}`}><FontAwesomeIcon icon={faEye} /></button>
          {user?.role === "admin" && <>
            <button onClick={() => navigate(`/admin/students/${row.id}/edit`)} className="grid size-8 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong" title="Edit student" aria-label={`Edit ${row.first_name} ${row.last_name}`}><FontAwesomeIcon icon={faPenToSquare} /></button>
            <button onClick={() => handleDelete(row.id)} className="grid size-8 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40" title="Delete student" aria-label={`Delete ${row.first_name} ${row.last_name}`}><FontAwesomeIcon icon={faTrash} /></button>
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
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Student directory</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Students</h1>
          <p className="mb-0 mt-1 text-sm text-secondary">View and manage student records.</p>
        </div>
        {user?.role === "admin" && <div className="flex flex-wrap gap-2"><button onClick={() => navigate("/admin/students/registrations")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:border-brand/40 hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/40">
          <FontAwesomeIcon icon={faQrcode} /> Registration QR
        </button><button onClick={() => navigate("/admin/students/create")} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/40">
          <span aria-hidden="true">+</span> Add student
        </button></div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid grid-cols-1 gap-x-3 gap-y-0 border-b border-border px-4 py-3 sm:grid-cols-2 sm:px-5 xl:grid-cols-[minmax(240px,2fr)_1fr_1fr]">
          <AppInput containerClassName="mb-0" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search by name, code, phone, or email" />
          <AppSelect containerClassName="mb-0" name="status" value={filters.status} onChange={handleFilterChange} placeholder="All statuses" options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
          <AppSelect containerClassName="mb-0" name="gender" value={filters.gender} onChange={handleFilterChange} placeholder="All genders" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} />
        </div>
        {loading ? <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading students…</span></div>
          : students.length > 0 ? <>
            <AppTable columns={columns} data={students} />
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{firstItem}–{lastItem}</span> of <span className="font-semibold text-primary">{pagination.total}</span> students <span className="text-muted">· 15 per page</span></p>
              <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} showSinglePage />
            </div>
          </> : <div className="grid min-h-56 place-items-center px-4 text-center"><div><span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-brand-soft text-xl text-brand">⌕</span><p className="m-0 font-semibold text-primary">No students found</p><p className="mb-0 mt-1 text-sm text-muted">Try changing your filters or search terms.</p></div></div>}
      </section>
    </div>
  );
}
