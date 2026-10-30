import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faChalkboardUser } from "@fortawesome/free-solid-svg-icons";
import { createTeacher } from "@/modules/teachers/api/teacherApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { TeacherForm, TeacherPayload, TeacherValidationErrors } from "@/modules/teachers/types/teacher";

const fieldClass = "mb-0";
const initialForm: TeacherForm = {
  user_id: "", teacher_code: "", first_name: "", last_name: "", gender: "", phone: "", email: "", address: "", hire_date: "", status: "active",
};

export default function TeacherCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<TeacherForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<TeacherValidationErrors>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value } as TeacherForm));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    const payload: TeacherPayload = {
      ...form,
      user_id: form.user_id === "" ? null : Number(form.user_id),
      gender: form.gender || null,
    };
    try {
      await createTeacher(payload);
      alert("Teacher created successfully");
      navigate("/admin/teachers");
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: TeacherValidationErrors }>(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Failed to create teacher");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-2 lg:-mt-3 lg:-mb-6">
      <button type="button" onClick={() => navigate("/admin/teachers")} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to teachers</button>
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-2.5 sm:px-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faChalkboardUser} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Teacher record</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">Create teacher</h1><p className="mb-0 mt-1 text-sm text-secondary">Add a teacher's personal and employment information.</p></div>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <FormSection title="Personal information" description="Basic identity and contact details.">
            <div className="min-w-0"><AppInput containerClassName={fieldClass} label="Linked teacher account ID (optional)" name="user_id" type="number" value={form.user_id} onChange={handleChange} placeholder="Existing teacher account ID" error={errors.user_id?.[0]} /><p className="mb-0 mt-1 text-[11px] text-muted">Only fill this in if the teacher login account already exists.</p></div>
            <AppInput containerClassName={fieldClass} label="Teacher code" name="teacher_code" value={form.teacher_code} onChange={handleChange} placeholder="e.g. T001" error={errors.teacher_code?.[0]} required />
            <AppInput containerClassName={fieldClass} label="First name" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Enter first name" error={errors.first_name?.[0]} required />
            <AppInput containerClassName={fieldClass} label="Last name" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Enter last name" error={errors.last_name?.[0]} required />
            <AppSelect containerClassName={fieldClass} label="Gender" name="gender" value={form.gender} onChange={handleChange} placeholder="Select gender" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} error={errors.gender?.[0]} />
            <AppInput containerClassName={fieldClass} label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone?.[0]} />
            <AppInput containerClassName={fieldClass} label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email?.[0]} />
            <AppInput containerClassName={`${fieldClass} sm:col-span-2 xl:col-span-3`} label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Enter home address" error={errors.address?.[0]} />
          </FormSection>
          <FormSection title="Employment" description="Set the hire date and current teacher status.">
            <AppInput containerClassName={fieldClass} label="Hire date" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} error={errors.hire_date?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Status" name="status" value={form.status} onChange={handleChange} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status?.[0]} />
          </FormSection>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate("/admin/teachers")} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : "Create teacher"}</button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-xl border border-border bg-app-bg/25 p-4 sm:p-5"><div className="mb-4 border-b border-border pb-3"><h2 className="m-0 text-sm font-bold text-primary">{title}</h2><p className="mb-0 mt-1 text-xs text-secondary">{description}</p></div><div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div></section>;
}
