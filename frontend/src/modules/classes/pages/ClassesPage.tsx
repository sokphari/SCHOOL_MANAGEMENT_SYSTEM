import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCalendarDays,
  faChalkboardUser,
  faDoorOpen,
  faEllipsisVertical,
  faEye,
  faGrip,
  faPenToSquare,
  faPlus,
  faTableList,
  faClock,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { assignStudentToClass, getAvailableClassStudents, getClasses, preEndClass, resumeClass, scheduleClassEnd, switchClassTeacher } from "@/modules/classes/api/classApi.ts";
import type { AvailableClassStudent } from "@/modules/classes/api/classApi.ts";
import AppTable from "@/shared/components/AppTable.tsx";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import type { ClassFilters, SchoolClass } from "@/modules/classes/types/class";

const PAGE_SIZE = 8;

interface ClassActionPermissions {
  addStudents: boolean;
  switchTeacher: boolean;
  edit: boolean;
  scheduleEnd: boolean;
  preEnd: boolean;
  resume: boolean;
}

function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState<ClassFilters>({ search: "", status: "", page: 1 });
  const [addingToClass, setAddingToClass] = useState<SchoolClass | null>(null);
  const [availableStudents, setAvailableStudents] = useState<AvailableClassStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentGenderFilter, setStudentGenderFilter] = useState("");
  const [studentPhoneSearch, setStudentPhoneSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [endingClass, setEndingClass] = useState<SchoolClass | null>(null);
  const [endDate, setEndDate] = useState("");
  const [lifecycleError, setLifecycleError] = useState("");
  const [savingLifecycle, setSavingLifecycle] = useState(false);
  const [busyClassId, setBusyClassId] = useState<number | null>(null);
  const [switchingTeacherFor, setSwitchingTeacherFor] = useState<SchoolClass | null>(null);
  const [teacherIdInput, setTeacherIdInput] = useState("");
  const [switchTeacherError, setSwitchTeacherError] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherSwitchSuccess, setTeacherSwitchSuccess] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUseClassFeature = (feature: string) => user?.role === "admin" || Boolean(user?.feature_permissions?.includes(`classes.${feature}`));
  const classActionPermissions: ClassActionPermissions = {
    addStudents: canUseClassFeature("add_students"),
    switchTeacher: canUseClassFeature("switch_teacher"),
    edit: canUseClassFeature("edit"),
    scheduleEnd: canUseClassFeature("schedule_end"),
    preEnd: canUseClassFeature("pre_end"),
    resume: canUseClassFeature("resume"),
  };

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

  const handleOpenEndClass = (classItem: SchoolClass) => {
    setEndingClass(classItem);
    setEndDate(classItem.end_date || "");
    setLifecycleError("");
  };

  const handleScheduleEnd = async () => {
    if (!endingClass || !endDate || savingLifecycle) return;
    setSavingLifecycle(true);
    setLifecycleError("");
    try {
      await scheduleClassEnd(endingClass.id, { end_date: endDate });
      setEndingClass(null);
      await fetchClasses(filters);
    } catch (error) {
      console.error(error);
      setLifecycleError("Could not schedule the class end date. Please check the date and try again.");
    } finally {
      setSavingLifecycle(false);
    }
  };

  const handlePreEnd = async (classItem: SchoolClass) => {
    if (!window.confirm(`Pre-End ${classItem.name}? Attendance tracking will stop immediately.`)) return;
    setBusyClassId(classItem.id);
    try {
      await preEndClass(classItem.id);
      await fetchClasses(filters);
    } catch (error) {
      console.error(error);
      alert("Could not pre-end this class.");
    } finally {
      setBusyClassId(null);
    }
  };

  const handleResumeClass = async (classItem: SchoolClass) => {
    if (!window.confirm(`Resume ${classItem.name} and clear its scheduled end date?`)) return;
    setBusyClassId(classItem.id);
    try {
      await resumeClass(classItem.id);
      await fetchClasses(filters);
    } catch (error) {
      console.error(error);
      alert("Could not resume this class.");
    } finally {
      setBusyClassId(null);
    }
  };

  const handleOpenAddStudent = async (classItem: SchoolClass) => {
    setAddingToClass(classItem);
    setAvailableStudents([]);
    setStudentSearch("");
    setStudentGenderFilter("");
    setStudentPhoneSearch("");
    setAssignmentError("");
    setLoadingStudents(true);
    try {
      const studentsResponse = await getAvailableClassStudents(classItem.id);
      setAvailableStudents(studentsResponse.data || []);
    } catch (error) {
      console.error(error);
      setAssignmentError("Could not load students for this class. Please try again.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAssignStudent = async () => {
    setAssignmentError("");
    if (!addingToClass || assigningStudent) return;
    if (!studentSearch.trim() || !studentGenderFilter.trim() || !studentPhoneSearch.trim()) {
      setAssignmentError("Enter the student's name, gender, and telephone number.");
      return;
    }
    const normalizePhone = (value: string) => value.replace(/\D/g, "");
    const matches = availableStudents.filter((student) =>
      `${student.first_name} ${student.last_name}`.trim().toLowerCase() === studentSearch.trim().toLowerCase()
      && (student.gender || "").toLowerCase() === studentGenderFilter.trim().toLowerCase()
      && normalizePhone(student.phone || "") === normalizePhone(studentPhoneSearch),
    );
    if (matches.length !== 1) {
      setAssignmentError(matches.length === 0
        ? "No active student matches all three details. Check the name, gender, and telephone number."
        : "More than one active student matches these details. Please contact an administrator to avoid assigning the wrong student.");
      return;
    }
    setAssigningStudent(true);
    try {
      await assignStudentToClass(addingToClass.id, matches[0].id);
      setAddingToClass(null);
      await fetchClasses(filters);
    } catch (error) {
      console.error(error);
      setAssignmentError("Could not add this student to the class.");
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleSwitchTeacher = async () => {
    const teacherId = Number(teacherIdInput);
    if (!switchingTeacherFor || !Number.isInteger(teacherId) || teacherId < 1 || savingTeacher) return;
    setSavingTeacher(true);
    setSwitchTeacherError("");
    try {
      await switchClassTeacher(switchingTeacherFor.id, teacherId);
      setTeacherSwitchSuccess(`Teacher assigned to ${switchingTeacherFor.name} successfully.`);
      setSwitchingTeacherFor(null);
      setTeacherIdInput("");
      await fetchClasses(filters);
    } catch (requestError) {
      console.error(requestError);
      setSwitchTeacherError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || "Could not assign this teacher to the class."
        : "Could not assign this teacher to the class.");
    } finally {
      setSavingTeacher(false);
    }
  };

  const columns: AppTableColumn<SchoolClass>[] = [
    { key: "id", title: "ID" },
    { key: "name", title: "Class", render: (row) => <TagBadge tone="purple">{row.name}</TagBadge> },
    { key: "section", title: "Section", render: (row) => row.section ? <TagBadge tone="emerald">{row.section}</TagBadge> : "—" },
    { key: "academic_year", title: "Academic year" },
    { key: "room", title: "Room", render: (row) => row.room || "—" },
    { key: "teacher", title: "Teacher", render: (row) => row.teacher ? <TagBadge tone="blue">{row.teacher.first_name} {row.teacher.last_name}</TagBadge> : <span className="italic text-muted">Unassigned</span> },
    { key: "status", title: "Status", render: (row) => <StatusBadge classItem={row} /> },
    {
      key: "actions", title: "Actions", render: (row) => (
        <div className="flex items-center gap-1.5">
          <IconAction label="View class" onClick={() => navigate(`/admin/classes/${row.id}`)}><FontAwesomeIcon icon={faEye} /></IconAction>
          {classActionPermissions.addStudents && <IconAction label="Add student" onClick={() => void handleOpenAddStudent(row)}><FontAwesomeIcon icon={faUserPlus} /></IconAction>}
          {classActionPermissions.switchTeacher && <IconAction label="Switch teacher" onClick={() => { setSwitchingTeacherFor(row); setTeacherIdInput(""); setSwitchTeacherError(""); }}><FontAwesomeIcon icon={faChalkboardUser} /></IconAction>}
          {classActionPermissions.edit && <IconAction label="Edit class" onClick={() => navigate(`/admin/classes/${row.id}/edit`)}><FontAwesomeIcon icon={faPenToSquare} /></IconAction>}
          {classActionPermissions.scheduleEnd && !isClassEnded(row) && !row.pre_end_at && <IconAction label="Schedule class end" onClick={() => handleOpenEndClass(row)}><FontAwesomeIcon icon={faCalendarDays} /></IconAction>}
          {classActionPermissions.resume && (isClassEnded(row) || row.pre_end_at)
            ? <IconAction label="Resume class" onClick={() => void handleResumeClass(row)}><FontAwesomeIcon icon={faBookOpen} /></IconAction>
            : classActionPermissions.preEnd && <IconAction label="Pre-End attendance" onClick={() => void handlePreEnd(row)}><FontAwesomeIcon icon={faClock} /></IconAction>}
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
        {(user?.role === "admin" || user?.feature_permissions?.includes("classes.create")) && <button onClick={() => navigate("/admin/classes/create")} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPlus} /> Add class</button>}
      </section>

      {teacherSwitchSuccess && <p role="status" aria-live="polite" className="mb-2.5 mt-0 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{teacherSwitchSuccess}</p>}

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
              {classes.map((classItem) => <ClassCard key={classItem.id} classItem={classItem} permissions={classActionPermissions} busy={busyClassId === classItem.id} onView={() => navigate(`/admin/classes/${classItem.id}`)} onAddStudent={() => void handleOpenAddStudent(classItem)} onEdit={() => navigate(`/admin/classes/${classItem.id}/edit`)} onSwitchTeacher={() => { setSwitchingTeacherFor(classItem); setTeacherIdInput(""); setSwitchTeacherError(""); }} onEnd={() => handleOpenEndClass(classItem)} onPreEnd={() => void handlePreEnd(classItem)} onResume={() => void handleResumeClass(classItem)} />)}
            </div>
          )}

        {!loading && classes.length > 0 && <div className="flex flex-col gap-3 border-t border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{firstItem}–{lastItem}</span> of <span className="font-semibold text-primary">{pagination.total}</span> classes <span className="text-muted">· {PAGE_SIZE} per page</span></p>
          <AppPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} showSinglePage />
        </div>}
      </section>

      {addingToClass && <AddStudentDialog
        className={addingToClass.name}
        search={studentSearch}
        gender={studentGenderFilter}
        phone={studentPhoneSearch}
        loading={loadingStudents}
        assigning={assigningStudent}
        error={assignmentError}
        onSearchChange={setStudentSearch}
        onGenderChange={setStudentGenderFilter}
        onPhoneChange={setStudentPhoneSearch}
        onClose={() => setAddingToClass(null)}
        onAssign={() => void handleAssignStudent()}
      />}
      {endingClass && <EndClassDialog className={endingClass.name} endDate={endDate} error={lifecycleError} saving={savingLifecycle} onDateChange={setEndDate} onClose={() => setEndingClass(null)} onSubmit={() => void handleScheduleEnd()} />}
      {switchingTeacherFor && <SwitchTeacherDialog classItem={switchingTeacherFor} teacherId={teacherIdInput} error={switchTeacherError} saving={savingTeacher} onTeacherIdChange={setTeacherIdInput} onClose={() => { if (!savingTeacher) setSwitchingTeacherFor(null); }} onSubmit={() => void handleSwitchTeacher()} />}
    </div>
  );
}

interface ClassCardProps { classItem: SchoolClass; permissions: ClassActionPermissions; busy: boolean; onView: () => void; onAddStudent: () => void; onEdit: () => void; onSwitchTeacher: () => void; onEnd: () => void; onPreEnd: () => void; onResume: () => void }
function ClassCard({ classItem, permissions, busy, onView, onAddStudent, onEdit, onSwitchTeacher, onEnd, onPreEnd, onResume }: ClassCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const ended = isClassEnded(classItem) || Boolean(classItem.pre_end_at);
  const courseName = classItem.course_record?.name || classItem.course || classItem.name;
  const teacherName = classItem.teacher
    ? `${classItem.teacher.first_name} ${classItem.teacher.last_name}`.trim() || `Teacher ${classItem.teacher.id}`
    : "Unassigned";
  const hasAvailableActions = permissions.addStudents || permissions.switchTeacher || permissions.edit
    || permissions.scheduleEnd || permissions.preEnd || permissions.resume;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface-raised p-4 transition hover:border-brand/30 hover:shadow-card">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faBookOpen} /></span>
        <div className="min-w-0 flex-1"><h2 className="m-0 truncate text-base font-semibold text-primary" title={courseName}><TagBadge tone="purple">{courseName}</TagBadge></h2><p className="mb-0 mt-1 truncate text-xs text-secondary"> ID: <span className="font-semibold text-brand">{classItem.id}</span></p></div>
        <div className="relative flex shrink-0 items-center gap-1.5" ref={menuRef}>
          <StatusBadge classItem={classItem} />
          {hasAvailableActions && <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} aria-label={`More actions for ${classItem.name}`} title="More actions" onClick={() => setMenuOpen((open) => !open)} className="grid size-8 place-items-center rounded-lg border border-transparent text-muted transition hover:border-border hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faEllipsisVertical} /></button>}
          {hasAvailableActions && menuOpen && <div role="menu" className="absolute right-0 top-10 z-30 min-w-48 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-xl">
            {permissions.addStudents && <MenuAction icon={<FontAwesomeIcon icon={faUserPlus} />} onClick={() => { setMenuOpen(false); onAddStudent(); }}>Add student</MenuAction>}
            {permissions.switchTeacher && <MenuAction icon={<FontAwesomeIcon icon={faChalkboardUser} />} onClick={() => { setMenuOpen(false); onSwitchTeacher(); }}>Switch teacher</MenuAction>}
            {permissions.edit && <MenuAction icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => { setMenuOpen(false); onEdit(); }}>Edit class</MenuAction>}
            {permissions.scheduleEnd && !ended && <MenuAction icon={<FontAwesomeIcon icon={faCalendarDays} />} onClick={() => { setMenuOpen(false); onEnd(); }}>{classItem.end_date ? "Change end date" : "End class"}</MenuAction>}
            {!ended && permissions.preEnd && <MenuAction icon={<FontAwesomeIcon icon={faClock} />} onClick={() => { setMenuOpen(false); onPreEnd(); }} disabled={busy}>Pre-End class</MenuAction>}
            {ended && permissions.resume && <MenuAction icon={<FontAwesomeIcon icon={faBookOpen} />} onClick={() => { setMenuOpen(false); onResume(); }} disabled={busy}>Resume class</MenuAction>}
          </div>}
        </div>
      </div>
      <dl className="mb-4 grid grid-cols-1 gap-0.5 text-sm">
        <InfoRow label="Lesson" value={classItem.lesson_record?.name || classItem.lesson || "General studies"} />
        <InfoRow label="Class type" value={<TagBadge tone={classItem.delivery_mode === "online" ? "blue" : classItem.delivery_mode === "hybrid" ? "purple" : "emerald"}>{classItem.delivery_mode || "Physical"}</TagBadge>} />
        <InfoRow label="Academic year" value={classItem.academic_year || "—"} />
        <InfoRow label="Students" value={<span className="inline-flex items-center gap-1.5"><span className="font-semibold text-brand">{classItem.students_count ?? 0}</span><span className="text-xs text-muted">enrolled</span></span>} />
        <InfoRow label="Room" value={<span className="inline-flex items-center gap-1.5"><FontAwesomeIcon icon={faDoorOpen} className="text-xs text-brand" />{classItem.roomLocation?.name || classItem.room || "Not assigned"}</span>} />
        <InfoRow label="Building" value={classItem.buildingLocation?.name || classItem.building || "—"} />
        <InfoRow label="Floor" value={classItem.floorLocation?.name || classItem.floor || "—"} />
        <InfoRow label="Term" value={classItem.term || "Term 1"} />
        <InfoRow label="Time" value={classItem.time || "08:00 AM – 09:00 AM"} />
        <InfoRow label="Teacher" value={classItem.teacher ? <TagBadge tone="blue"><FontAwesomeIcon icon={faChalkboardUser} />{teacherName}</TagBadge> : "Unassigned"} />
        {classItem.end_date && <InfoRow label="End date" value={formatClassDate(classItem.end_date)} />}
      </dl>
      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <button type="button" onClick={onView} className="flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-brand-strong transition hover:border-brand/30 hover:bg-brand-soft"><FontAwesomeIcon icon={faEye} /> View class</button>
      </div>
    </article>
  );
}

function MenuAction({ icon, onClick, children, disabled = false }: { icon: ReactNode; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} disabled={disabled} className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-secondary transition hover:bg-brand-soft hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-50">{icon}{children}</button>;
}

function EndClassDialog({ className, endDate, error, saving, onDateChange, onClose, onSubmit }: { className: string; endDate: string; error: string; saving: boolean; onDateChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="end-class-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
      <div className="mb-5"><span className="mb-3 grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faCalendarDays} /></span><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">{className}</p><h2 id="end-class-title" className="m-0 text-xl font-bold text-primary">Schedule class end</h2><p className="mb-0 mt-1 text-sm text-secondary">Choose the final attendance date. Tracking will stop after this date.</p></div>
      <label htmlFor="class-end-date" className="mb-1.5 block text-[13px] font-semibold text-secondary">End date</label>
      <input id="class-end-date" type="date" min={getTodayString()} value={endDate} onChange={(event) => onDateChange(event.currentTarget.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
      {error && <p role="alert" className="mb-0 mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button><button type="button" onClick={onSubmit} disabled={!endDate || saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={saving ? faClock : faCalendarDays} />{saving ? "Scheduling…" : "Set end date"}</button></div>
    </section>
  </div>;
}

function SwitchTeacherDialog({ classItem, teacherId, error, saving, onTeacherIdChange, onClose, onSubmit }: { classItem: SchoolClass; teacherId: string; error: string; saving: boolean; onTeacherIdChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="switch-teacher-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
      <div className="mb-5"><span className="mb-3 grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faChalkboardUser} /></span><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">{classItem.name}{classItem.section ? ` · Section ${classItem.section}` : ""} · Class ID {classItem.id}</p><h2 id="switch-teacher-title" className="m-0 text-xl font-bold text-primary">Switch teacher</h2><p className="mb-0 mt-1 text-sm text-secondary">Enter the ID of the teacher to assign to this class.</p></div>
      <label htmlFor="switch-teacher-id" className="mb-1.5 block text-[13px] font-semibold text-secondary">Teacher ID</label>
      <input id="switch-teacher-id" type="number" min="1" step="1" inputMode="numeric" value={teacherId} onChange={(event) => onTeacherIdChange(event.currentTarget.value)} placeholder="Enter teacher ID" className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
      {classItem.teacher && <p className="mb-0 mt-2 text-xs text-muted">Current teacher: {classItem.teacher.first_name} {classItem.teacher.last_name} (ID: {classItem.teacher.id})</p>}
      {error && <p role="alert" className="mb-0 mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button><button type="button" onClick={onSubmit} disabled={!Number.isInteger(Number(teacherId)) || Number(teacherId) < 1 || saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faChalkboardUser} />{saving ? "Switching…" : "Switch teacher"}</button></div>
    </section>
  </div>;
}

function AddStudentDialog({ className, search, gender, phone, loading, assigning, error, onSearchChange, onGenderChange, onPhoneChange, onClose, onAssign }: {
  className: string;
  search: string;
  gender: string;
  phone: string;
  loading: boolean;
  assigning: boolean;
  error: string;
  onSearchChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onAssign: () => void;
}) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !assigning) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="add-student-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">{className}</p><h2 id="add-student-title" className="m-0 text-xl font-bold text-primary">Add student to class</h2><p className="mb-0 mt-1 text-sm text-secondary">Enter the details of an existing active student to enroll them.</p></div><button type="button" onClick={onClose} disabled={assigning} aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-secondary transition hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faXmark} /></button></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      {loading ? <div className="grid min-h-36 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading students…</span></div> : <>
        <div className="mb-4 space-y-3">
          <div><label htmlFor="class-student-search" className="mb-1.5 block text-[13px] font-semibold text-secondary">Name</label><input id="class-student-search" type="search" value={search} onChange={(event) => onSearchChange(event.currentTarget.value)} placeholder="Search name" className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
          <div><label htmlFor="class-student-gender" className="mb-1.5 block text-[13px] font-semibold text-secondary">Gender</label><input id="class-student-gender" type="text" value={gender} onChange={(event) => onGenderChange(event.currentTarget.value)} placeholder="Search gender (male or female)" className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
          <div><label htmlFor="class-student-phone" className="mb-1.5 block text-[13px] font-semibold text-secondary">Tel</label><input id="class-student-phone" type="tel" value={phone} onChange={(event) => onPhoneChange(event.currentTarget.value)} placeholder="Search phone" className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
        </div>
      </>}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={assigning} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button><button type="button" onClick={onAssign} disabled={loading || assigning} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faUserPlus} />{assigning ? "Adding…" : "Add student"}</button></div>
    </section>
  </div>;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="grid grid-cols-[minmax(105px,0.8fr)_minmax(0,1.2fr)] gap-2 border-b border-border/70 py-2 last:border-0"><dt className="text-xs font-semibold text-secondary">{label}</dt><dd className="m-0 break-words text-sm text-primary">{value}</dd></div>;
}

function StatusBadge({ classItem }: { classItem: SchoolClass }) {
  const ended = isClassEnded(classItem);
  const preEnded = Boolean(classItem.pre_end_at);
  const label = preEnded ? "Pre-End" : ended ? "Ended" : classItem.status === "inactive" ? "Inactive" : classItem.end_date ? `Ends ${formatClassDate(classItem.end_date)}` : "Active";
  const style = preEnded ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" : ended || classItem.status === "inactive" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : classItem.end_date ? "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  const dot = preEnded ? "bg-amber-500" : ended || classItem.status === "inactive" ? "bg-slate-400" : classItem.end_date ? "bg-sky-500" : "bg-emerald-500";
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}><span className={`size-1.5 rounded-full ${dot}`} />{label}</span>;
}

function isClassEnded(classItem: SchoolClass) {
  return Boolean(classItem.end_date && classItem.end_date < getTodayString());
}

function formatClassDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
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
