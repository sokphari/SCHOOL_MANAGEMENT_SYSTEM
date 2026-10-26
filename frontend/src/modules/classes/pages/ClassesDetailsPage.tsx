import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { faArrowLeft, faBookOpen, faCalendarDays, faCalendarCheck, faChalkboardUser, faDoorOpen, faEye, faPenToSquare, faRightLeft, faTrash, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";
import { getClass, getClasses, removeStudentFromClass, transferStudentToClass } from "@/modules/classes/api/classApi.ts";
import { bulkSaveAttendance, getAttendanceByClassAndDate, getTeacherPermissionAvailability } from "@/modules/attendance/api/attendanceApi.ts";
import { useAuth } from "@/modules/auth/context/AuthContext";
import AppTable from "@/shared/components/AppTable.tsx";
import type { AppTableColumn } from "@/shared/components/AppTable.tsx";
import type { ClassDetails } from "@/modules/classes/api/classApi.ts";
import type { ClassStudent } from "@/modules/classes/types/class";
import type { SchoolClass } from "@/modules/classes/types/class";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

type ClassAttendanceStatus = "present" | "absent" | "late" | "excused";
function isClassAttendanceClosed(schoolClass: ClassDetails | null) {
  return !schoolClass || schoolClass.status !== "active" || Boolean(schoolClass.pre_end_at) || Boolean(schoolClass.end_date && schoolClass.end_date < getLocalDateString());
}
const attendanceOptions: { value: ClassAttendanceStatus; label: string; activeClass: string }[] = [
  { value: "present", label: "Present", activeClass: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200" },
  { value: "absent", label: "Absent", activeClass: "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200" },
  { value: "excused", label: "Permission", activeClass: "border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200" },
  { value: "late", label: "Late", activeClass: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200" },
];

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [attendanceByStudent, setAttendanceByStudent] = useState<Record<number, ClassAttendanceStatus>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<number, string | null>>({});
  const [permissionAvailability, setPermissionAvailability] = useState<Record<number, boolean>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [trackingAttendance, setTrackingAttendance] = useState(false);
  const [hasSavedAttendance, setHasSavedAttendance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState<ClassStudent | null>(null);
  const [transferTargets, setTransferTargets] = useState<SchoolClass[]>([]);
  const [targetClassId, setTargetClassId] = useState("");
  const [transferError, setTransferError] = useState("");
  const [loadingTransferTargets, setLoadingTransferTargets] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState("");

  const fetchClass = useCallback(async () => {
    if (!id) return;
    const response = await getClass(id);
    setClassData(response.data);
    setStudents(response.data.students || []);
    try {
      const attendanceResponse = await getAttendanceByClassAndDate(id, getLocalDateString());
      const statuses: Record<number, ClassAttendanceStatus> = {};
      const notes: Record<number, string | null> = {};
      attendanceResponse.data.forEach((record: { student_id: number; status: ClassAttendanceStatus; note?: string | null }) => {
        statuses[record.student_id] = record.status;
        notes[record.student_id] = record.note ?? null;
      });
      setAttendanceByStudent(statuses);
      setAttendanceNotes(notes);
      setHasSavedAttendance(Object.keys(statuses).length > 0);
    } catch (attendanceError) {
      console.error("Failed to load today's class attendance", attendanceError);
    }
    try {
      const permissionResponse = await getTeacherPermissionAvailability(id, getLocalDateString());
      setPermissionAvailability(permissionResponse.data.availability || {});
    } catch (permissionError) {
      console.error("Failed to load weekly permission availability", permissionError);
      setPermissionAvailability({});
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    const loadPage = async () => {
      try {
        if (!id) throw new Error("Missing class id");
        await fetchClass();
        if (!active) return;
      } catch (requestError) {
        console.error(requestError);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPage();
    return () => { active = false; };
  }, [id, fetchClass]);

  const handleRemove = async (studentId: number) => {
    if (!id || !window.confirm("Remove this student from the class?")) return;
    try {
      await removeStudentFromClass(id, studentId);
      await fetchClass();
    } catch (requestError) {
      console.error(requestError);
      alert("Failed to remove student from class");
    }
  };

  const handleOpenTransfer = async (student: ClassStudent) => {
    if (!id) return;
    setTransferSuccess("");
    setTransferringStudent(student);
    setTargetClassId("");
    setTransferError("");
    setLoadingTransferTargets(true);
    try {
      const response = await getClasses({ status: "active", page: 1, per_page: 100 });
      const today = getLocalDateString();
      setTransferTargets((response.data.data || []).filter((item) =>
        item.id !== Number(id) && !item.pre_end_at && (!item.end_date || item.end_date >= today),
      ));
    } catch (requestError) {
      console.error(requestError);
      setTransferError("Could not load eligible destination classes.");
    } finally {
      setLoadingTransferTargets(false);
    }
  };

  const handleTransfer = async () => {
    if (!id || !transferringStudent || !targetClassId || savingTransfer) return;
    setSavingTransfer(true);
    setTransferError("");
    try {
      await transferStudentToClass(Number(id), transferringStudent.id, Number(targetClassId));
      setTransferSuccess(`${transferringStudent.first_name} ${transferringStudent.last_name} was transferred successfully.`);
      setTransferringStudent(null);
      await fetchClass();
    } catch (requestError) {
      console.error(requestError);
      setTransferError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || "Could not transfer this student."
        : "Could not transfer this student.");
    } finally {
      setSavingTransfer(false);
    }
  };

  const handleAttendanceChange = (studentId: number, status: ClassAttendanceStatus) => {
    if (!trackingAttendance || savingAttendance || isClassAttendanceClosed(classData)) return;
    setAttendanceByStudent((current) => ({ ...current, [studentId]: status }));
    setAttendanceDirty(true);
  };

  const handleStartAttendanceTracking = () => {
    if (trackingAttendance || students.length === 0 || isClassAttendanceClosed(classData)) return;
    const hasUnmarkedStudents = students.some((student) => !attendanceByStudent[student.id]);
    setAttendanceByStudent((current) => Object.fromEntries(
      students.map((student) => [student.id, current[student.id] ?? "present"]),
    ) as Record<number, ClassAttendanceStatus>);
    setTrackingAttendance(true);
    setAttendanceDirty(!hasSavedAttendance || hasUnmarkedStudents);
  };

  const handleSaveAttendance = async () => {
    if (!id || !trackingAttendance || savingAttendance || !attendanceDirty || students.length === 0 || isClassAttendanceClosed(classData)) return;
    setSavingAttendance(true);
    try {
      await bulkSaveAttendance(id, {
        attendance_date: getLocalDateString(),
        records: students.map((student) => ({
          student_id: student.id,
          status: attendanceByStudent[student.id] ?? "present",
          note: attendanceNotes[student.id] ?? null,
        })),
      });
      setAttendanceDirty(false);
      setHasSavedAttendance(true);
      setTrackingAttendance(false);
      alert("Attendance saved successfully");
    } catch (attendanceError) {
      console.error(attendanceError);
      const message = axios.isAxiosError(attendanceError) ? attendanceError.response?.data?.message : undefined;
      alert(message || "Failed to save attendance. Please try again.");
    } finally {
      setSavingAttendance(false);
    }
  };

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading class details…</span></div>;
  if (error || !classData) return <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"><p className="m-0 font-semibold text-primary">Unable to load class</p><button onClick={() => navigate("/admin/classes")} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Back to classes</button></section>;

  const attendanceClosed = isClassAttendanceClosed(classData);
  const attendanceClosedMessage = classData.pre_end_at
    ? "Attendance tracking is stopped because this class is in Pre-End."
    : classData.end_date && classData.end_date < getLocalDateString()
      ? `Attendance tracking ended on ${classData.end_date}.`
      : "Attendance tracking is unavailable because this class is inactive.";

  const studentColumns: AppTableColumn<ClassStudent>[] = [
    { key: "row_number", title: "No.", render: (_student, index) => index + 1 },
    { key: "student_code", title: "Student code", render: (student) => <span className="inline-flex rounded-md border border-brand/15 bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-strong">{student.student_code || "—"}</span> },
    { key: "name", title: "Student", render: (student) => <span className="font-medium text-primary">{student.first_name} {student.last_name}</span> },
    { key: "gender", title: "Gender", render: (student) => <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${student.gender === "male" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : student.gender === "female" ? "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{student.gender || "—"}</span> },
    { key: "phone", title: "Phone", render: (student) => student.phone || "—" },
    { key: "pivot", title: "Joined", render: (student) => student.pivot?.joined_at || "—" },
    {
      key: "attendance",
      title: "Attendance",
      render: (student) => (
        <div className="grid min-w-[360px] grid-cols-4 gap-2" role="group" aria-label={`Today's attendance for ${student.first_name} ${student.last_name}`}>
          {attendanceOptions.map((option) => {
            const selected = (attendanceByStudent[student.id] ?? "present") === option.value;
            const permissionUnavailable = option.value === "excused" && user?.role === "teacher" && permissionAvailability[student.id] !== true;
            const permissionHint = permissionUnavailable ? "This student has already received permission this week" : "For an in-person request to Admin; one permission per student per week";
            return <button key={option.value} type="button" aria-pressed={selected} title={option.value === "excused" ? permissionHint : option.label} disabled={!trackingAttendance || savingAttendance || permissionUnavailable || attendanceClosed} onClick={() => handleAttendanceChange(student.id, option.value)} className={`min-h-10 min-w-[78px] flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${selected ? option.activeClass : "border-border bg-surface text-secondary hover:border-brand/30 hover:bg-brand-soft"}`}>{option.label}</button>;
          })}
        </div>
      ),
    },
    {
      key: "actions", title: "Actions", render: (student) => (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => navigate(`/admin/students/${student.id}`)} title="View student details" aria-label={`View ${student.first_name} ${student.last_name}`} className="grid size-8 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faEye} /></button>
          {user?.role === "admin" && <button type="button" onClick={() => navigate(`/admin/students/${student.id}/edit`)} title="Edit student" aria-label={`Edit ${student.first_name} ${student.last_name}`} className="grid size-8 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /></button>}
          {user?.role === "admin" && <button type="button" onClick={() => void handleOpenTransfer(student)} title="Transfer student to another class" aria-label={`Transfer ${student.first_name} ${student.last_name} to another class`} className="grid size-8 place-items-center rounded-lg border border-border text-secondary transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faRightLeft} /></button>}
          <button type="button" onClick={() => handleRemove(student.id)} title="Remove from class" aria-label={`Remove ${student.first_name} from class`} className="grid size-8 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"><FontAwesomeIcon icon={faTrash} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate("/admin/classes")} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to classes</button>
        {user?.role === "admin" && <button onClick={() => navigate(`/admin/classes/${classData.id}/edit`)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"><FontAwesomeIcon icon={faPenToSquare} /> Edit class</button>}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-4 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-5 py-5 sm:px-7">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faBookOpen} /></div>
          <div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Class details</p><h1 className="m-0 break-words text-2xl font-bold tracking-tight text-primary sm:text-3xl">{classData.name}</h1><p className="mb-0 mt-1 text-sm text-secondary">Class ID: {classData.id}{classData.section ? ` · Section ${classData.section}` : ""}</p></div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${classData.pre_end_at ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" : classData.end_date && classData.end_date < getLocalDateString() ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : classData.end_date ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200" : classData.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{classData.pre_end_at ? "Pre-End" : classData.end_date && classData.end_date < getLocalDateString() ? "Ended" : classData.end_date ? `Ends ${classData.end_date}` : classData.status || "Unknown"}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <SummaryItem icon={faBookOpen} label="Course" value={classData.course || classData.name} />
          <SummaryItem icon={faBookOpen} label="Lesson" value={classData.lesson || "General studies"} />
          <SummaryItem icon={faBookOpen} label="Class type" value={classData.delivery_mode || "Physical"} />
          <SummaryItem icon={faCalendarDays} label="Academic year" value={classData.academic_year || "—"} />
          <SummaryItem icon={faDoorOpen} label="Building" value={classData.buildingLocation?.name || classData.building || "—"} />
          <SummaryItem icon={faDoorOpen} label="Floor" value={classData.floorLocation?.name || classData.floor || "—"} />
          <SummaryItem icon={faDoorOpen} label="Room" value={classData.roomLocation?.name || classData.room || "Not assigned"} />
          <SummaryItem icon={faCalendarDays} label="Term" value={classData.term || "Term 1"} />
          <SummaryItem icon={faCalendarCheck} label="Time" value={classData.time || "08:00 AM – 09:00 AM"} />
          <SummaryItem icon={faChalkboardUser} label="Teacher" value={classData.teacher ? `${classData.teacher.first_name} ${classData.teacher.last_name}` : "Unassigned"} />
          <SummaryItem icon={faUsers} label="Students" value={students.length} />
          {classData.end_date && <SummaryItem icon={faCalendarDays} label="End date" value={classData.end_date} />}
        </div>
        {classData.description && <div className="border-t border-border px-5 py-4 sm:px-7"><p className="mb-1 text-xs font-semibold text-muted">Description</p><p className="m-0 whitespace-pre-wrap text-sm text-primary">{classData.description}</p></div>}
      </section>
      {transferringStudent && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingTransfer) setTransferringStudent(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="transfer-student-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-brand">{classData.name}{classData.section ? ` · Section ${classData.section}` : ""} · Class ID {classData.id}</p><h2 id="transfer-student-title" className="m-0 text-xl font-bold text-primary">Transfer student</h2><p className="mb-0 mt-1 text-sm text-secondary">Move {transferringStudent.first_name} {transferringStudent.last_name} ({transferringStudent.student_code || "No code"}) to another class.</p></div><button type="button" onClick={() => setTransferringStudent(null)} disabled={savingTransfer} aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-secondary transition hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faXmark} /></button></div>
          <div className="mb-4 rounded-xl border border-border bg-app-bg/50 p-3 text-sm"><p className="m-0 text-xs font-medium text-muted">Source class</p><p className="mb-0 mt-1 font-semibold text-primary">{classData.name}{classData.section ? ` · Section ${classData.section}` : ""} <span className="font-normal text-secondary">(ID: {classData.id})</span></p></div>
          <label htmlFor="transfer-target-class" className="mb-1.5 block text-[13px] font-semibold text-secondary">Destination class ID</label>
          <input id="transfer-target-class" type="number" min="1" step="1" inputMode="numeric" value={targetClassId} onChange={(event) => setTargetClassId(event.currentTarget.value)} placeholder="Enter class ID" disabled={loadingTransferTargets} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60" />
          {loadingTransferTargets ? <p className="mb-0 mt-2 text-xs text-muted">Checking available classes…</p> : targetClassId && transferTargets.some((target) => target.id === Number(targetClassId)) ? <p className="mb-0 mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">Destination: {transferTargets.find((target) => target.id === Number(targetClassId))?.name}{transferTargets.find((target) => target.id === Number(targetClassId))?.section ? ` · Section ${transferTargets.find((target) => target.id === Number(targetClassId))?.section}` : ""} (ID: {targetClassId})</p> : targetClassId && !loadingTransferTargets ? <p className="mb-0 mt-2 text-xs text-rose-600 dark:text-rose-300">That ID is not an eligible destination class.</p> : <p className="mb-0 mt-2 text-xs text-muted">Enter the ID of another active class.</p>}
          {transferError && <p role="alert" className="mb-0 mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{transferError}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setTransferringStudent(null)} disabled={savingTransfer} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button><button type="button" onClick={() => void handleTransfer()} disabled={loadingTransferTargets || !transferTargets.some((target) => target.id === Number(targetClassId)) || savingTransfer} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faRightLeft} />{savingTransfer ? "Transferring…" : "Transfer student"}</button></div>
        </section>
      </div>}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {transferSuccess && <p role="status" aria-live="polite" className="m-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{transferSuccess}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><FontAwesomeIcon icon={faUsers} /></span><div><h2 className="m-0 text-sm font-semibold text-primary">Students in this class</h2><p className="mb-0 mt-0.5 text-xs text-muted">{students.length} assigned {students.length === 1 ? "student" : "students"}</p></div></div>
          <div className="flex items-center gap-2">
            {attendanceClosed && <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><FontAwesomeIcon icon={faCalendarCheck} />Attendance closed</span>}
            {!attendanceClosed && trackingAttendance && <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300"><FontAwesomeIcon icon={faCalendarCheck} />Tracking active</span>}
            {!attendanceClosed && !trackingAttendance && <button type="button" onClick={handleStartAttendanceTracking} disabled={students.length === 0 || (user?.role === "teacher" && hasSavedAttendance)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faCalendarCheck} />{hasSavedAttendance ? user?.role === "teacher" ? "Tracked already" : "Edit attendance" : "Track attendance"}</button>}
            {!attendanceClosed && trackingAttendance && <button type="button" onClick={handleSaveAttendance} disabled={!attendanceDirty || savingAttendance} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faCalendarCheck} />{savingAttendance ? "Saving…" : "Save attendance"}</button>}
          </div>
        </div>
        {attendanceClosed && <p className="m-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 sm:px-5">{attendanceClosedMessage}</p>}
        {students.length > 0 ? <AppTable columns={studentColumns} data={students} /> : <div className="grid min-h-44 place-items-center px-4 text-center"><div><span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-brand-soft text-brand"><FontAwesomeIcon icon={faUsers} /></span><p className="m-0 text-sm font-semibold text-primary">No students assigned yet</p></div></div>}
      </section>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: IconProp; label: string; value: ReactNode }) {
  return <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-border bg-app-bg/50 p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><FontAwesomeIcon icon={icon} /></span><div className="min-w-0"><p className="mb-1 text-xs text-muted">{label}</p><p className="m-0 truncate text-sm font-semibold text-primary">{value}</p></div></div>;
}
