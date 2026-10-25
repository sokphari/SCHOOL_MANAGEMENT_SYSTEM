import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import { getStudent, updateStudent } from "@/modules/students/api/studentApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { Student, StudentForm, StudentValidationErrors } from "@/modules/students/types/student";

const fieldClass = "mb-0";

export default function StudentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<StudentValidationErrors>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoadError(true);
      setLoading(false);
      return () => { active = false; };
    }
    getStudent(id)
      .then((response) => { if (active) setForm(toStudentForm(response.data)); })
      .catch((error) => {
        console.error(error);
        if (active) setLoadError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => current ? { ...current, [name]: value } as StudentForm : current);
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !id) return;
    setSaving(true);
    setErrors({});
    try {
      await updateStudent(id, { ...form, gender: form.gender || null });
      alert("Student updated successfully");
      navigate(`/admin/students/${id}`);
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: StudentValidationErrors }>(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Failed to update student");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading student…</span></div>;
  if (loadError || !form) return <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"><p className="m-0 font-semibold text-primary">Unable to load student</p><button onClick={() => navigate("/admin/students")} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Back to students</button></section>;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(`/admin/students/${id}`)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary transition hover:bg-brand-soft hover:text-brand-strong"><FontAwesomeIcon icon={faArrowLeft} /> Back to profile</button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-3 sm:px-6">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-base text-white"><FontAwesomeIcon icon={faUserGraduate} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Student record</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">Edit student</h1><p className="mb-0 mt-1 text-sm text-secondary">Update the student's personal and enrollment information.</p></div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <FormSection title="Personal information" description="Basic identity and contact details.">
            <AppInput containerClassName={fieldClass} label="Student code" name="student_code" value={form.student_code || ""} onChange={handleChange} error={errors.student_code?.[0]} />
            <AppInput containerClassName={fieldClass} label="First name" name="first_name" value={form.first_name || ""} onChange={handleChange} error={errors.first_name?.[0]} />
            <AppInput containerClassName={fieldClass} label="Last name" name="last_name" value={form.last_name || ""} onChange={handleChange} error={errors.last_name?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Gender" name="gender" value={form.gender || ""} onChange={handleChange} placeholder="Select gender" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} error={errors.gender?.[0]} />
            <AppInput containerClassName={fieldClass} label="Date of birth" name="date_of_birth" type="date" value={form.date_of_birth || ""} onChange={handleChange} error={errors.date_of_birth?.[0]} />
            <AppInput containerClassName={fieldClass} label="Phone" name="phone" value={form.phone || ""} onChange={handleChange} error={errors.phone?.[0]} />
            <AppInput containerClassName={fieldClass} label="Email" name="email" type="email" value={form.email || ""} onChange={handleChange} error={errors.email?.[0]} />
            <AppInput containerClassName={`${fieldClass} sm:col-span-2 xl:col-span-4`} label="Address" name="address" value={form.address || ""} onChange={handleChange} error={errors.address?.[0]} />
          </FormSection>

          <FormSection title="Guardian information" description="Contact information for the student's guardian.">
            <AppInput containerClassName={fieldClass} label="Guardian name" name="guardian_name" value={form.guardian_name || ""} onChange={handleChange} error={errors.guardian_name?.[0]} />
            <AppInput containerClassName={fieldClass} label="Guardian phone" name="guardian_phone" value={form.guardian_phone || ""} onChange={handleChange} error={errors.guardian_phone?.[0]} />
          </FormSection>

          <FormSection title="Enrollment" description="Enrollment date and current student status.">
            <AppInput containerClassName={fieldClass} label="Enrollment date" name="enrollment_date" type="date" value={form.enrollment_date || ""} onChange={handleChange} error={errors.enrollment_date?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Status" name="status" value={form.status || "active"} onChange={handleChange} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status?.[0]} />
          </FormSection>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate(`/admin/students/${id}`)} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function toStudentForm(student: Student): StudentForm {
  return {
    student_code: student.student_code,
    first_name: student.first_name,
    last_name: student.last_name,
    gender: student.gender || "",
    date_of_birth: student.date_of_birth || "",
    phone: student.phone || "",
    email: student.email || "",
    address: student.address || "",
    guardian_name: student.guardian_name || "",
    guardian_phone: student.guardian_phone || "",
    enrollment_date: student.enrollment_date || "",
    status: student.status,
  };
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 border-b border-border pb-2"><h2 className="m-0 text-sm font-semibold text-primary">{title}</h2><p className="mb-0 mt-0.5 text-[11px] text-secondary">{description}</p></div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}
