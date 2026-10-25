import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPenToSquare, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import { getStudent } from "@/modules/students/api/studentApi.ts";
import { useAuth } from "@/modules/auth/context/AuthContext";
import type { Student } from "@/modules/students/types/student";

type DetailKey = "gender" | "date_of_birth" | "phone" | "email" | "guardian_name" | "guardian_phone" | "enrollment_date" | "address";

const detailFields: Array<[string, DetailKey]> = [
  ["Gender", "gender"],
  ["Date of birth", "date_of_birth"],
  ["Phone", "phone"],
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
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
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

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading student profile…</span></div>;
  if (error || !student) return <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"><p className="m-0 font-semibold text-primary">Student not found</p><p className="mb-4 mt-1 text-sm text-secondary">This student profile could not be loaded.</p><button onClick={() => navigate("/admin/students")} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Back to students</button></section>;

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
    </div>
  );
}
