import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { createStudent } from "@/modules/students/api/studentApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { StudentForm, StudentValidationErrors } from "@/modules/students/types/student";

const fieldClass = "mb-0";

export default function StudentCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentForm>({
    student_code: "", first_name: "", last_name: "", gender: "", date_of_birth: "",
    phone: "", email: "", address: "", guardian_name: "", guardian_phone: "",
    enrollment_date: "", status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<StudentValidationErrors>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await createStudent({ ...form, gender: form.gender || null });
      alert("Student created successfully");
      navigate("/admin/students");
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: StudentValidationErrors }>(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-2 lg:-mt-3 lg:-mb-6">
      <button type="button" onClick={() => navigate("/admin/students")} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to students</button>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-2.5 sm:px-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faUserPlus} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Student record</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">Create student</h1><p className="mb-0 mt-1 text-sm text-secondary">Enter the student's personal and enrollment information.</p></div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <FormSection title="Personal information" description="Basic identity and contact details.">
            <AppInput containerClassName={fieldClass} label="Student code" name="student_code" value={form.student_code} onChange={handleChange} placeholder="e.g. S001" error={errors.student_code?.[0]} />
            <AppInput containerClassName={fieldClass} label="First name" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Enter first name" error={errors.first_name?.[0]} />
            <AppInput containerClassName={fieldClass} label="Last name" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Enter last name" error={errors.last_name?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Gender" name="gender" value={form.gender} onChange={handleChange} placeholder="Select gender" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} error={errors.gender?.[0]} />
            <AppInput containerClassName={fieldClass} label="Date of birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} error={errors.date_of_birth?.[0]} />
            <AppInput containerClassName={fieldClass} label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" error={errors.phone?.[0]} />
            <AppInput containerClassName={fieldClass} label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter email address" error={errors.email?.[0]} />
            <AppInput containerClassName={`${fieldClass} sm:col-span-2 xl:col-span-4`} label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Enter home address" error={errors.address?.[0]} />
          </FormSection>

          <FormSection title="Guardian information" description="Contact information for the student's guardian.">
            <AppInput containerClassName={fieldClass} label="Guardian name" name="guardian_name" value={form.guardian_name} onChange={handleChange} placeholder="Enter guardian name" error={errors.guardian_name?.[0]} />
            <AppInput containerClassName={fieldClass} label="Guardian phone" name="guardian_phone" value={form.guardian_phone} onChange={handleChange} placeholder="Enter guardian phone" error={errors.guardian_phone?.[0]} />
          </FormSection>

          <FormSection title="Enrollment" description="Set the enrollment date and current student status.">
            <AppInput containerClassName={fieldClass} label="Enrollment date" name="enrollment_date" type="date" value={form.enrollment_date} onChange={handleChange} error={errors.enrollment_date?.[0]} />
            <AppSelect containerClassName={fieldClass} label="Status" name="status" value={form.status} onChange={handleChange} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status?.[0]} />
          </FormSection>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate("/admin/students")} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{loading ? "Saving…" : "Create student"}</button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-base font-semibold text-primary">{title}</h2><p className="mb-0 mt-1 text-xs text-secondary">{description}</p></div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}
