import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faCalendarCheck, faClock, faGraduationCap, faPenToSquare, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import { getStudent, getStudentAttendance } from "@/modules/students/api/studentApi.ts";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import AppTable from "@/shared/components/AppTable.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";
import type { Student, StudentAttendanceRecord } from "@/modules/students/types/student";

type DetailKey = "gender" | "date_of_birth" | "phone" | "email" | "guardian_name" | "guardian_phone" | "enrollment_date" | "address";

const detailFields: Array<[string, DetailKey]> = [
  ["Gender", "gender"],
  ["Date of birth", "date_of_birth"],
  ["Telephone", "phone"],
  ["Email", "email"],
  ["Guardian name", "guardian_name"],
  ["Guardian phone", "guardian_phone"],
  ["Enrollment date", "enrollment_date"],
  ["Address", "address"],
];

export default function StudentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canViewAttendanceHistory = user?.role === "admin" || Boolean(user?.feature_permissions?.includes("students.view_attendance"));
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePagination, setAttendancePagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!canViewAttendanceHistory) {
      setAttendanceRecords([]);
      setAttendancePagination({ current_page: 1, last_page: 1, total: 0 });
      setAttendanceLoading(false);
      setAttendanceError(false);
      return () => { active = false; };
    }
    if (!id) {
      setError(true);
      setLoading(false);
      return () => { active = false; };
    }
    getStudent(id)
      .then((response) => { if (active) setStudent(response.data); })
      .catch((requestError: unknown) => {
        console.error(requestError);
        if (active) setError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!id) {
      setAttendanceError(true);
      setAttendanceLoading(false);
      return () => { active = false; };
    }
    setAttendanceLoading(true);
    setAttendanceError(false);
    getStudentAttendance(id, attendancePage)
      .then(({ data }) => {
        if (!active) return;
        setAttendanceRecords(data.data || []);
        setAttendancePagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
      })
      .catch((requestError: unknown) => {
        console.error(requestError);
        if (active) setAttendanceError(true);
      })
      .finally(() => { if (active) setAttendanceLoading(false); });
    return () => { active = false; };
  }, [canViewAttendanceHistory, id, attendancePage]);

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading student profile…</span></div>;
  if (error || !student) return <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"><p className="m-0 font-semibold text-primary">Student not found</p><p className="mb-4 mt-1 text-sm text-secondary">This student profile could not be loaded.</p><button onClick={() => navigate("/admin/students")} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Back to students</button></section>;

  const attendanceColumns = [
    { key: "row_number", title: "No.", render: (_record: StudentAttendanceRecord, index: number) => (attendancePagination.current_page - 1) * 10 + index + 1 },
    { key: "attendance_date", title: "Date", render: (record: StudentAttendanceRecord) => <span className="font-medium text-primary">{record.attendance_date}</span> },
    { key: "class", title: "Class", render: (record: StudentAttendanceRecord) => <span className="text-secondary">{record.school_class?.name || "—"}{record.school_class?.section ? ` · ${record.school_class.section}` : ""}</span> },
    { key: "status", title: "Status", render: (record: StudentAttendanceRecord) => <AttendanceBadge status={record.status} /> },
    { key: "note", title: "Note", render: (record: StudentAttendanceRecord) => <span className="text-secondary">{record.note || "—"}</span> },
  ];
  const attendanceFirst = attendancePagination.total === 0 ? 0 : (attendancePagination.current_page - 1) * 10 + 1;
  const attendanceLast = Math.min(attendancePagination.current_page * 10, attendancePagination.total);

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate("/admin/students")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary transition hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faArrowLeft} /> Back to students</button>
        {user?.role === "admin" && <button onClick={() => navigate(`/admin/students/${student.id}/edit`)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /> Edit student</button>}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-4 border-b border-border bg-brand-soft/30 px-5 py-5 sm:px-7">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-xl text-brand"><FontAwesomeIcon icon={faUserGraduate} /></div>
          <div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">Student profile</p><h1 className="m-0 truncate text-2xl font-bold tracking-tight text-primary">{student.first_name} {student.last_name}</h1><p className="mb-0 mt-1 text-sm text-secondary">{student.student_code}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${student.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{student.status || "Unknown"}</span>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-5 border-b border-border pb-4">
            <h2 className="m-0 text-lg font-semibold text-primary">Personal information</h2>
            <p className="mb-0 mt-1 text-sm text-secondary">Contact and enrollment details for this student.</p>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {detailFields.map(([label, key]) => <div key={key} className={`min-h-[82px] rounded-xl border border-border bg-app-bg/60 p-4 ${key === "address" ? "sm:col-span-2 lg:col-span-4" : ""}`}><dt className="text-xs font-medium text-muted">{label}</dt><dd className="mb-0 mt-2 break-words text-sm font-semibold capitalize text-primary">{student[key] || "—"}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
        <div className="mb-5 border-b border-border pb-4"><h2 className="m-0 text-lg font-semibold text-primary">Academic overview</h2><p className="mb-0 mt-1 text-sm text-secondary">Scores, attendance, and class schedule summary.</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AcademicInfo icon={faGraduationCap} label="Score" value="Not available yet" description="Score tracking is not configured in this project yet." />
          <AcademicInfo
            icon={faCalendarCheck}
            label="Attendance"
            value={student.attendances_count ? `${student.attendance_rate ?? 0}% present` : "No records yet"}
            description={student.attendances_count
              ? `${student.attendance_present_count ?? 0} present · ${student.attendance_absent_count ?? 0} absent · ${student.attendance_late_count ?? 0} late · ${student.attendance_excused_count ?? 0} excused`
              : "Attendance records will appear here when they are recorded."}
          />
          <AcademicInfo icon={faClock} label="Class schedule" value="Not configured yet" description="Class time is not available in the current class records." />
        </div>
      </section>

      {canViewAttendanceHistory && <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5 sm:px-5">
          <div><h2 className="m-0 text-base font-semibold text-primary">Attendance records</h2><p className="mb-0 mt-0.5 text-xs text-secondary">Attendance history for this student.</p></div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">{attendancePagination.total} records</span>
        </div>
        {attendanceLoading ? <div className="grid min-h-36 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading attendance…</span></div>
          : attendanceError ? <div className="px-4 py-8 text-center text-sm text-rose-600">Unable to load attendance records.</div>
          : attendanceRecords.length > 0 ? <>
            <AppTable columns={attendanceColumns} data={attendanceRecords} />
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="m-0 text-xs text-secondary">Showing <span className="font-semibold text-primary">{attendanceFirst}–{attendanceLast}</span> of {attendancePagination.total} records</p>
              <AppPagination currentPage={attendancePagination.current_page} lastPage={attendancePagination.last_page} onPageChange={setAttendancePage} showSinglePage />
            </div>
          </> : <div className="grid min-h-36 place-items-center px-4 text-center"><div><p className="m-0 text-sm font-semibold text-primary">No attendance records yet</p><p className="mb-0 mt-1 text-xs text-muted">Records will appear here after attendance is marked.</p></div></div>}
      </section>}

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4"><div><h2 className="m-0 text-lg font-semibold text-primary">Courses and classes</h2><p className="mb-0 mt-1 text-sm text-secondary">Classes currently assigned to this student.</p></div><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">{student.classes?.length || 0} total</span></div>
        {student.classes?.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {student.classes.map((classItem) => <article key={classItem.id} className="rounded-xl border border-border bg-app-bg/50 p-4">
            <div className="mb-3 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><FontAwesomeIcon icon={faBookOpen} /></span><div className="min-w-0"><h3 className="m-0 truncate text-sm font-semibold text-primary">{classItem.name}</h3><p className="mb-0 mt-0.5 text-xs text-secondary">{classItem.section ? `Section ${classItem.section}` : "Class"}</p></div></div>
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3"><div><dt className="text-[11px] text-muted">Academic year</dt><dd className="mb-0 mt-1 text-xs font-medium text-primary">{classItem.academic_year || "—"}</dd></div><div><dt className="text-[11px] text-muted">Room</dt><dd className="mb-0 mt-1 text-xs font-medium text-primary">{classItem.room || "—"}</dd></div><div><dt className="text-[11px] text-muted">Joined</dt><dd className="mb-0 mt-1 text-xs font-medium text-primary">{classItem.pivot?.joined_at || "—"}</dd></div><div><dt className="text-[11px] text-muted">Status</dt><dd className="mb-0 mt-1 text-xs font-medium capitalize text-primary">{classItem.pivot?.status || classItem.status || "—"}</dd></div></dl>
          </article>)}
        </div> : <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center"><FontAwesomeIcon icon={faBookOpen} className="mb-2 text-brand" /><p className="m-0 text-sm font-medium text-primary">No classes assigned</p></div>}
      </section>
    </div>
  );
}

function AcademicInfo({ icon, label, value, description }: { icon: typeof faGraduationCap; label: string; value: string; description: string }) {
  return <article className="min-h-[118px] rounded-xl border border-border bg-app-bg/50 p-4"><div className="mb-3 flex items-center gap-2"><FontAwesomeIcon icon={icon} className="text-brand" /><h3 className="m-0 text-sm font-semibold text-secondary">{label}</h3></div><p className="m-0 text-base font-semibold text-primary">{value}</p><p className="mb-0 mt-1.5 text-xs leading-relaxed text-muted">{description}</p></article>;
}

function AttendanceBadge({ status }: { status: StudentAttendanceRecord["status"] }) {
  const styles = {
    present: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    absent: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    late: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    excused: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>;
}
