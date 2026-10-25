import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { createClass } from "@/modules/classes/api/classApi.ts";
import { getTeachers } from "@/modules/teachers/api/teacherApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { ClassForm, ClassPayload, ClassValidationErrors, TeacherOption } from "@/modules/classes/types/class";

const fieldClass = "mb-0";

export default function ClassCreatePage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [form, setForm] = useState<ClassForm>({
    name: "", section: "", academic_year: "", room: "", teacher_id: "", description: "", status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ClassValidationErrors>({});

  useEffect(() => {
    let active = true;
    getTeachers()
      .then((response) => {
        if (active) setTeachers((response.data.data || []).map((teacher) => ({ label: `${teacher.first_name} ${teacher.last_name}`, value: String(teacher.id) })));
      })
      .catch((error) => console.error("Failed to load teachers", error));
    return () => { active = false; };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const payload: ClassPayload = { ...form, teacher_id: form.teacher_id ? Number(form.teacher_id) : null };
      await createClass(payload);
      alert("Class created successfully");
      navigate("/admin/classes");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) setErrors(error.response.data.errors || {});
      else alert("Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-2 lg:-mt-3 lg:-mb-6">
      <button type="button" onClick={() => navigate("/admin/classes")} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to classes</button>
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-2.5 sm:px-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faBookOpen} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Class record</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">Create class</h1><p className="mb-0 mt-1 text-sm text-secondary">Add a class and assign a teacher.</p></div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <section>
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-base font-semibold text-primary">Class information</h2><p className="mb-0 mt-1 text-xs text-secondary">Set the class name, section, year, and room.</p></div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
              <AppInput containerClassName={fieldClass} label="Class name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. PHP + Laravel" error={errors.name?.[0]} />
              <AppInput containerClassName={fieldClass} label="Section" name="section" value={form.section} onChange={handleChange} placeholder="e.g. A" error={errors.section?.[0]} />
              <AppInput containerClassName={fieldClass} label="Academic year" name="academic_year" value={form.academic_year} onChange={handleChange} placeholder="e.g. 2026–2027" error={errors.academic_year?.[0]} />
              <AppInput containerClassName={fieldClass} label="Room" name="room" value={form.room} onChange={handleChange} placeholder="e.g. Room 101" error={errors.room?.[0]} />
            </div>
          </section>

          <section>
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-base font-semibold text-primary">Teaching details</h2><p className="mb-0 mt-1 text-xs text-secondary">Optionally assign a teacher and add a description.</p></div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
              <AppSelect containerClassName={fieldClass} label="Teacher (optional)" name="teacher_id" value={form.teacher_id} onChange={handleChange} placeholder="Unassigned" options={teachers} error={errors.teacher_id?.[0]} />
              <AppSelect containerClassName={fieldClass} label="Status" name="status" value={form.status} onChange={handleChange} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status?.[0]} />
              <div className="min-w-0 sm:col-span-2 xl:col-span-4">
                <label htmlFor="description" className="mb-1.5 block text-[13px] font-semibold text-secondary">Description (optional)</label>
                <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange} placeholder="Add class details" aria-invalid={Boolean(errors.description?.[0])} className={`w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${errors.description?.[0] ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`} />
                {errors.description?.[0] && <p className="mt-1 text-xs text-rose-600">{errors.description[0]}</p>}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate("/admin/classes")} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{loading ? "Saving…" : "Create class"}</button>
        </div>
      </form>
    </div>
  );
}
