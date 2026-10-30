import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBookOpen, faCalendarCheck, faCalendarDays, faCheck, faChevronDown, faCircleCheck, faCircleXmark, faClock, faMagnifyingGlass, faUsers } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { getClasses, getClass } from "@/modules/classes/api/classApi.ts";
import { bulkSaveAttendance, getAttendanceByClassAndDate, getTeacherPermissionAvailability, grantPermissionRange } from "@/modules/attendance/api/attendanceApi.ts";
import type { AttendanceDraft, ClassAttendanceRecord } from "@/modules/attendance/types/attendance";
import type { AttendanceStatus } from "@/modules/students/types/student";
import type { SchoolClass } from "@/modules/classes/types/class";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import type { SelectOption } from "@/shared/components/AppSelect.tsx";

const attendanceOptions: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: "present", label: "Present", activeClass: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200" },
  { value: "absent", label: "Absent", activeClass: "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200" },
  { value: "excused", label: "Permission", activeClass: "border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200" },
  { value: "late", label: "Late", activeClass: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200" },
];

function getLocalDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDaysToDate(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) return error.response?.data?.message || fallback;
  return fallback;
}

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const canRecordAttendance = user?.role === "admin" || Boolean(user?.feature_permissions?.includes("attendance.record"));
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState(() => searchParams.get("class_id") || "");
  const [attendanceDate] = useState(getLocalDateString);
  const [records, setRecords] = useState<AttendanceDraft[]>([]);
  const [permissionAvailability, setPermissionAvailability] = useState<Record<string, boolean>>({});
  const [permissionStudentId, setPermissionStudentId] = useState("");
  const [permissionStartDate, setPermissionStartDate] = useState(getLocalDateString);
  const [permissionEndDate, setPermissionEndDate] = useState(() => addDaysToDate(getLocalDateString(), 6));
  const [permissionReason, setPermissionReason] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grantingPermission, setGrantingPermission] = useState(false);
  const [teacherLocked, setTeacherLocked] = useState(false);
  const [classAttendanceClosed, setClassAttendanceClosed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const loadRequestRef = useRef(0);

  const classOptions = useMemo(() => classes.map((schoolClass) => ({
    label: `${schoolClass.name}${schoolClass.section ? ` · Section ${schoolClass.section}` : ""}`,
    value: String(schoolClass.id),
  })), [classes]);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const response = await getClasses({ per_page: 100 });
      setClasses(response.data.data || []);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: getErrorMessage(error, "Could not load classes.") });
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => { void fetchClasses(); }, [fetchClasses]);

  const loadStudentsAndAttendance = useCallback(async () => {
    if (!selectedClass || !attendanceDate) {
      setMessage({ type: "error", text: "Select a class and date first." });
      return;
    }

    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setMessage(null);
    setDirty(false);
    try {
      const [classResponse, attendanceResponse] = await Promise.all([
        getClass(selectedClass),
        getAttendanceByClassAndDate(selectedClass, attendanceDate),
      ]);
      if (requestId !== loadRequestRef.current) return;
      const schoolClass = classResponse.data;
      setClassAttendanceClosed(schoolClass.status !== "active" || Boolean(schoolClass.pre_end_at) || Boolean(schoolClass.end_date && attendanceDate > schoolClass.end_date));
      const classStudents = classResponse.data.students || [];
      const attendanceRecords = attendanceResponse.data || [];
      setTeacherLocked(user?.role === "teacher" && attendanceRecords.length > 0);
      setPermissionStudentId((current) => classStudents.some((student) => String(student.id) === current) ? current : "");

      const recordByStudent = new Map<number, ClassAttendanceRecord>(attendanceRecords.map((record) => [record.student_id, record]));
      setRecords(classStudents.map((student) => {
        const existing = recordByStudent.get(student.id);
        return {
          student_id: student.id,
          student_code: student.student_code,
          student_name: `${student.first_name} ${student.last_name}`,
          status: existing?.status || "present",
          note: existing?.note || "",
        };
      }));

      if (user?.role === "teacher") {
        try {
          const availability = await getTeacherPermissionAvailability(selectedClass, attendanceDate);
          if (requestId !== loadRequestRef.current) return;
          setPermissionAvailability(availability.data.availability || {});
        } catch (availabilityError) {
          console.error("Could not load weekly permission limits", availabilityError);
          setPermissionAvailability({});
        }
      } else {
        setPermissionAvailability({});
      }
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error(error);
      setRecords([]);
      setMessage({ type: "error", text: getErrorMessage(error, "Could not load attendance for this class and date.") });
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [attendanceDate, selectedClass, user?.role]);

  useEffect(() => {
    if (!selectedClass || !attendanceDate) return;
    const timer = window.setTimeout(() => void loadStudentsAndAttendance(), 120);
    return () => window.clearTimeout(timer);
  }, [attendanceDate, loadStudentsAndAttendance, selectedClass]);

  const handleClassChange = (classId: string) => {
    loadRequestRef.current += 1;
    setLoading(false);
    setSelectedClass(classId);
    setRecords([]);
    setTeacherLocked(false);
    setClassAttendanceClosed(false);
    setDirty(false);
    setPermissionStudentId("");
    setMessage(null);
  };

  const persistAttendance = async (nextRecords: AttendanceDraft[]) => {
    if (!canRecordAttendance || !selectedClass || !attendanceDate || nextRecords.length === 0 || teacherLocked || classAttendanceClosed || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await bulkSaveAttendance(selectedClass, {
        attendance_date: attendanceDate,
        records: nextRecords.map((record) => ({
          student_id: record.student_id,
          status: record.status,
          note: record.note || null,
        })),
      });
      setDirty(false);
      if (user?.role === "teacher") setTeacherLocked(true);
      setMessage({ type: "success", text: "Attendance saved successfully." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save attendance. Please try again.") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    if (!canRecordAttendance || teacherLocked || classAttendanceClosed || submitting) return;
    const nextRecords = records.map((record) => record.student_id === studentId ? { ...record, status } : record);
    setRecords(nextRecords);
    setDirty(true);
    setMessage(null);
    void persistAttendance(nextRecords);
  };

  const handleNoteChange = (studentId: number, note: string) => {
    if (!canRecordAttendance || teacherLocked || classAttendanceClosed || submitting) return;
    setRecords((current) => current.map((record) => record.student_id === studentId ? { ...record, note } : record));
    setDirty(true);
    setMessage(null);
  };

  const handleGrantPermissionRange = async () => {
    if (user?.role !== "admin" || !selectedClass || classAttendanceClosed || !permissionStudentId || !permissionStartDate || !permissionEndDate || !permissionReason.trim() || grantingPermission) return;
    if (permissionEndDate < permissionStartDate) {
      setMessage({ type: "error", text: "The end date must be on or after the start date." });
      return;
    }

    setGrantingPermission(true);
    setMessage(null);
    try {
      const response = await grantPermissionRange(selectedClass, {
        student_id: Number(permissionStudentId),
        start_date: permissionStartDate,
        end_date: permissionEndDate,
        note: permissionReason.trim(),
      });
      if (attendanceDate >= permissionStartDate && attendanceDate <= permissionEndDate) {
        setRecords((current) => current.map((record) => record.student_id === Number(permissionStudentId)
          ? { ...record, status: "excused", note: permissionReason.trim() }
          : record));
      }
      setPermissionReason("");
      const dayCount = response.data.data.length;
      setMessage({ type: "success", text: `Permission recorded for ${dayCount} ${dayCount === 1 ? "day" : "days"}.` });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: getErrorMessage(error, "Could not record the permission range.") });
    } finally {
      setGrantingPermission(false);
    }
  };

  const counts = {
    present: records.filter((record) => record.status === "present").length,
    absent: records.filter((record) => record.status === "absent").length,
    late: records.filter((record) => record.status === "late").length,
    excused: records.filter((record) => record.status === "excused").length,
  };

  const columns: AppTableColumn<AttendanceDraft>[] = [
    { key: "number", title: "No.", render: (_record, index) => <span className="font-medium text-muted">{index + 1}</span> },
    { key: "student_code", title: "Student code", render: (record) => <span className="inline-flex rounded-md border border-brand/20 bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-strong">{record.student_code}</span> },
    { key: "student_name", title: "Student", render: (record) => <span className="font-semibold text-primary">{record.student_name}</span> },
    {
      key: "status",
      title: "Attendance",
      render: (record) => (
        <div className="grid min-w-[360px] grid-cols-4 gap-2" role="group" aria-label={`Attendance for ${record.student_name}`}>
          {attendanceOptions.map((option) => {
            const selected = record.status === option.value;
            const permissionUnavailable = option.value === "excused" && user?.role === "teacher" && permissionAvailability[String(record.student_id)] !== true;
            const disabled = !canRecordAttendance || teacherLocked || classAttendanceClosed || submitting || permissionUnavailable;
            const title = permissionUnavailable ? "This student has already received permission this week" : option.value === "excused" ? "For in-person student requests; one permission per student per week" : option.label;
            return <button key={option.value} type="button" aria-pressed={selected} title={title} disabled={disabled} onClick={() => handleStatusChange(record.student_id, option.value)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selected ? option.activeClass : "border-border bg-surface text-secondary hover:border-brand/30 hover:bg-brand-soft"}`}>{option.label}</button>;
          })}
        </div>
      ),
    },
    {
      key: "note",
      title: "Note",
      render: (record) => <input aria-label={`Note for ${record.student_name}`} value={record.note} onChange={(event) => handleNoteChange(record.student_id, event.currentTarget.value)} onBlur={() => { if (dirty && !submitting) void persistAttendance(records); }} disabled={!canRecordAttendance || teacherLocked || classAttendanceClosed || submitting} placeholder="Optional note" className="min-w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60" />,
    },
  ];

  const selectedClassName = classes.find((schoolClass) => String(schoolClass.id) === selectedClass)?.name;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Daily records</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-primary sm:text-[28px]">Attendance</h1>
          <p className="mb-0 mt-1 text-sm text-secondary">Record and review attendance by class and date.</p>
        </div>
        {selectedClassName && <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong"><FontAwesomeIcon icon={faBookOpen} />{selectedClassName}</span>}
      </header>

      <section aria-label="Attendance summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Present" value={counts.present} icon={faCircleCheck} tone="emerald" />
        <SummaryCard label="Absent" value={counts.absent} icon={faCircleXmark} tone="rose" />
        <SummaryCard label="Permission" value={counts.excused} icon={faCheck} tone="indigo" />
        <SummaryCard label="Late" value={counts.late} icon={faClock} tone="amber" />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faCalendarCheck} /></span>
          <div><h2 className="m-0 text-sm font-semibold text-primary">Choose class</h2><p className="mb-0 mt-0.5 text-xs text-muted">Today’s student attendance loads automatically after you select a class.</p></div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <SearchableSelect id="attendance-class" label="Class" searchPlaceholder="Search classes…" options={classOptions} value={selectedClass} onChange={handleClassChange} disabled={loadingClasses} />
        </div>
        <p aria-live="polite" className="mb-0 mt-3 min-h-4 text-xs text-muted">{loading ? "Loading attendance records…" : records.length ? `${records.length} students loaded` : selectedClass ? "No students found for this class and date." : "Select a class to load its students."}</p>
      </section>

      {message && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}>{message.text}</div>}

      {classAttendanceClosed && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Attendance tracking is unavailable because this class is pre-ended, inactive, or past its scheduled end date.</div>}

      {user?.role === "admin" && records.length > 0 && <section className="rounded-2xl border border-brand/20 bg-surface p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"><FontAwesomeIcon icon={faCalendarDays} /></span>
          <div><h2 className="m-0 text-sm font-semibold text-primary">Record an in-person permission request</h2><p className="mb-0 mt-0.5 text-xs text-secondary">Find the student, choose the requested dates, add a reason, then grant permission.</p></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] xl:items-end">
          <SearchableSelect id="permission-student" label="1. Find student" searchPlaceholder="Search by student name or code…" options={records.map((record) => ({ label: `${record.student_code} · ${record.student_name}`, value: String(record.student_id) }))} value={permissionStudentId} onChange={setPermissionStudentId} disabled={loading} />
          <div><label htmlFor="permission-start-date" className="mb-1.5 block text-[13px] font-semibold text-secondary">2. From</label><input id="permission-start-date" type="date" value={permissionStartDate} onChange={(event) => setPermissionStartDate(event.currentTarget.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
          <div><label htmlFor="permission-end-date" className="mb-1.5 block text-[13px] font-semibold text-secondary">Through</label><input id="permission-end-date" type="date" min={permissionStartDate} value={permissionEndDate} onChange={(event) => setPermissionEndDate(event.currentTarget.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
          <div><label htmlFor="permission-reason" className="mb-1.5 block text-[13px] font-semibold text-secondary">3. Reason <span className="text-rose-500">*</span></label><input id="permission-reason" required value={permissionReason} onChange={(event) => setPermissionReason(event.currentTarget.value)} placeholder="e.g. Family trip to hometown" className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
          <button type="button" onClick={() => void handleGrantPermissionRange()} disabled={!permissionStudentId || !permissionReason.trim() || grantingPermission || loading || classAttendanceClosed} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faCalendarCheck} />{grantingPermission ? "Granting…" : "4. Grant permission"}</button>
        </div>
        <p className="mb-0 mt-2 text-xs text-muted">Attendance status changes save automatically. Grant permission saves the selected date range.</p>
      </section>}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faUsers} /></span>
            <div><h2 className="m-0 text-sm font-semibold text-primary">Student attendance</h2><p className="mb-0 mt-0.5 text-xs text-muted">{records.length ? `${records.length} students · ${attendanceDate}` : "Choose a class and load its students"}</p></div>
          </div>
          {teacherLocked && <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">Submitted · read only</span>}
        </div>
        {loading ? <div className="grid min-h-52 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading attendance…</span></div>
          : records.length > 0 ? <>
            <AppTable columns={columns} data={records} />
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{records.length}</span> students</p>
            </div>
          </>
            : <div className="grid min-h-52 place-items-center px-4 text-center"><div><span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faCalendarCheck} /></span><p className="m-0 text-sm font-semibold text-primary">No attendance loaded</p><p className="mb-0 mt-1 max-w-sm text-xs text-muted">Select a class and date above, then load students to start taking attendance.</p></div></div>}
      </section>
    </div>
  );
}

function SearchableSelect({ id, label, searchPlaceholder, options, value, onChange, disabled = false }: { id: string; label: string; searchPlaceholder: string; options: SelectOption[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    } else if (event.key === "Enter") {
      event.preventDefault();
      const firstOption = filteredOptions[0];
      if (firstOption) {
        onChange(firstOption.value);
        setOpen(false);
        setQuery("");
      }
    }
  };

  const openDropdown = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <label htmlFor={`${id}-select`} className="mb-1.5 block text-[13px] font-semibold text-secondary">{label}</label>
      <button id={`${id}-select`} type="button" role="combobox" aria-expanded={open} aria-controls={`${id}-options`} aria-haspopup="listbox" onClick={open ? () => setOpen(false) : openDropdown} disabled={disabled} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm text-primary outline-none transition hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60">
        <span className={selectedOption ? "truncate" : "truncate text-muted"}>{selectedOption?.label || (disabled ? "Loading options…" : "Select an option")}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`shrink-0 text-xs text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
        <div className="border-b border-border p-2">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
            <input ref={searchRef} id={`${id}-search`} type="search" role="searchbox" aria-label={searchPlaceholder} aria-controls={`${id}-options`} autoComplete="off" value={query} onChange={(event) => setQuery(event.currentTarget.value)} onKeyDown={handleKeyDown} placeholder={searchPlaceholder} className="w-full rounded-lg border border-border bg-app-bg py-2 pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </div>
        </div>
        <div id={`${id}-options`} role="listbox" className="max-h-56 overflow-y-auto p-1.5">
          <button type="button" role="option" aria-selected={!value} onClick={() => { onChange(""); setOpen(false); setQuery(""); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-secondary transition hover:bg-brand-soft hover:text-brand-strong">Select an option</button>
          {filteredOptions.length > 0 ? filteredOptions.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); setQuery(""); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-brand-soft hover:text-brand-strong ${option.value === value ? "bg-brand-soft font-semibold text-brand-strong" : "text-primary"}`}>{option.label}</button>) : <p className="m-0 px-3 py-3 text-sm text-muted">No results match “{query}”.</p>}
        </div>
      </div>}
    </div>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: IconProp; tone: "emerald" | "rose" | "amber" | "indigo" }) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300",
  };
  return <article className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"><span className={`grid size-10 shrink-0 place-items-center rounded-xl border ${styles[tone]}`}><FontAwesomeIcon icon={icon} /></span><div><p className="m-0 text-xs font-medium text-secondary">{label}</p><p className="mb-0 mt-1 text-xl font-bold text-primary">{value}</p></div></article>;
}
