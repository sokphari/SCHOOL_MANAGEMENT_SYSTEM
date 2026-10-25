import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faChalkboardUser } from "@fortawesome/free-solid-svg-icons";
import { getTeacher, updateTeacher } from "@/modules/teachers/api/teacherApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { Teacher, TeacherForm, TeacherPayload, TeacherValidationErrors } from "@/modules/teachers/types/teacher";

const fieldClass = "mb-0";

export default function TeacherEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<TeacherForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<TeacherValidationErrors>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoadError(true);
      setLoading(false);
      return () => { active = false; };
    }
    getTeacher(id)
      .then(({ data }) => { if (active) setForm(toTeacherForm(data)); })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setLoadError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setForm((current) => current ? { ...current, [name]: value } as TeacherForm : current);
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !id) return;
    setSaving(true);
    setErrors({});
    const payload: TeacherPayload = {
      ...form,
      user_id: form.user_id === "" ? null : Number(form.user_id),
      gender: form.gender || null,
    };
    try {
      await updateTeacher(id, payload);
      alert("Teacher updated successfully");
      navigate("/admin/teachers");
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: TeacherValidationErrors }>(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Failed to update teacher");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading teacher…</span></div>;
  if (loadError || !form) return <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"><p className="m-0 font-semibold text-primary">Unable to load teacher</p><button onClick={() => navigate("/admin/teachers")} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Back to teachers</button></section>;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-2">
      <button type="button" onClick={() => navigate("/admin/teachers")} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to teachers</button>
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-2.5 sm:px-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faChalkboardUser} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Teacher record</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">Edit teacher</h1><p className="mb-0 mt-1 text-sm text-secondary">Update the teacher's personal and employment information.</p></div>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <FormSection title="Personal information" description="Basic identity and contact details.">
            <AppInput containerClassName={fieldClass} label="User ID (optional)" name="user_id" type="number" value={form.user_id} onChange={handleChange} error={errors.user_id?.[0]} />
            <AppInput containerClassName={fieldClass} label="Teacher code" name="teacher_code" value={form.teacher_code} onChange={handleChange} error={errors.teacher_code?.[0]} />
            <AppInput containerClassName={fieldClass} label="First name" name="first_name" value={form.first_name} onChange={handleChange} error={errors.first_name?.[0]} />
            <AppInput containerClassName={fieldClass} label="Last name" name="last_name" value={form.last_name} onChange={handleChange} error={errors.last_name?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Gender" name="gender" value={form.gender} onChange={handleChange} placeholder="Select gender" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} error={errors.gender?.[0]} />
            <AppInput containerClassName={fieldClass} label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone?.[0]} />
            <AppInput containerClassName={fieldClass} label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email?.[0]} />
            <AppInput containerClassName={`${fieldClass} sm:col-span-2 xl:col-span-4`} label="Address" name="address" value={form.address} onChange={handleChange} error={errors.address?.[0]} />
          </FormSection>
          <FormSection title="Employment" description="Hire date and current teacher status.">
            <AppInput containerClassName={fieldClass} label="Hire date" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} error={errors.hire_date?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Status" name="status" value={form.status} onChange={handleChange} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status?.[0]} />
          </FormSection>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate("/admin/teachers")} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function toTeacherForm(teacher: Teacher): TeacherForm {
  return {
    user_id: teacher.user_id === null ? "" : String(teacher.user_id),
    teacher_code: teacher.teacher_code,
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    gender: teacher.gender || "",
    phone: teacher.phone || "",
    email: teacher.email || "",
    address: teacher.address || "",
    hire_date: teacher.hire_date || "",
    status: teacher.status,
  };
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section><div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-base font-semibold text-primary">{title}</h2><p className="mb-0 mt-1 text-xs text-secondary">{description}</p></div><div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">{children}</div></section>;
}
