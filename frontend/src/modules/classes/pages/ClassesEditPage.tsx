import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { getClass, updateClass } from "@/modules/classes/api/classApi.ts";
import { getTeachers } from "@/modules/teachers/api/teacherApi.ts";
import { getBuildings } from "@/modules/locations/api/locationApi.ts";
import { getCourses } from "@/modules/courses/api/courseApi.ts";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import type { ClassForm, ClassPayload, ClassValidationErrors, TeacherOption } from "@/modules/classes/types/class";
import type { BuildingLocation } from "@/modules/locations/types/location";
import type { Course } from "@/modules/courses/types/course";

const fieldClass = "mb-0";

export default function ClassEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<ClassForm | null>(null);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingLocation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ClassValidationErrors>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        if (!id) throw new Error("Missing class id");
        const [classResponse, teacherResponse, buildingResponse, courseResponse] = await Promise.all([getClass(id), getTeachers(), getBuildings(), getCourses()]);
        if (!active) return;
        const data = classResponse.data;
        setTeachers((teacherResponse.data.data || []).map((teacher) => ({ label: `${teacher.first_name} ${teacher.last_name}`, value: String(teacher.id) })));
        setBuildings(buildingResponse.data || []);
        const courseList = courseResponse.data || [];
        setCourses(courseList);
        const selectedCourse = courseList.find((course) => course.id === data.course_id) || courseList.find((course) => course.name === data.course);
        const selectedLesson = selectedCourse?.lessons?.find((lesson) => lesson.id === data.lesson_id) || selectedCourse?.lessons?.find((lesson) => lesson.name === data.lesson);
        setForm({
          name: data.name || "",
          course: selectedCourse?.name || data.course || data.name || "",
          lesson: selectedLesson?.name || data.lesson || "General studies",
          course_id: selectedCourse ? String(selectedCourse.id) : "",
          lesson_id: selectedLesson ? String(selectedLesson.id) : "",
          delivery_mode: data.delivery_mode || "physical",
          section: data.section || "",
          academic_year: data.academic_year || "",
          building_id: data.building_id ? String(data.building_id) : "",
          floor_id: data.floor_id ? String(data.floor_id) : "",
          room_id: data.room_id ? String(data.room_id) : "",
          term: data.term || "Term 1",
          time: data.time || "08:00",
          teacher_id: data.teacher_id ? String(data.teacher_id) : "",
          description: data.description || "",
          status: data.status || "active",
        });
      } catch (error) {
        console.error(error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setForm((current) => {
      if (!current) return current;
      if (name === "course_id") {
        const course = courses.find((item) => String(item.id) === value);
        return { ...current, course_id: value, course: course?.name || "", lesson_id: "", lesson: "" };
      }
      if (name === "lesson_id") {
        const lesson = courses.find((item) => String(item.id) === current.course_id)?.lessons?.find((item) => String(item.id) === value);
        return { ...current, lesson_id: value, lesson: lesson?.name || "" };
      }
      return { ...current, [name]: value, ...(name === "building_id" ? { floor_id: "", room_id: "" } : {}), ...(name === "floor_id" ? { room_id: "" } : {}) };
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !form) return;
    setSaving(true);
    setErrors({});
    try {
      const payload: ClassPayload = { ...form, course_id: Number(form.course_id), lesson_id: Number(form.lesson_id), building_id: Number(form.building_id), floor_id: Number(form.floor_id), room_id: Number(form.room_id), teacher_id: form.teacher_id ? Number(form.teacher_id) : null };
      await updateClass(id, payload);
      alert("Class updated successfully");
      navigate(`/admin/classes/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) setErrors(error.response.data.errors || {});
      else alert("Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-56 place-items-center text-sm text-secondary"><span className="flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />Loading class…</span></div>;
  if (loadError || !form) return <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"><p className="m-0 font-semibold text-primary">Unable to load class</p><button onClick={() => navigate("/admin/classes")} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Back to classes</button></section>;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-2 lg:-mt-3 lg:-mb-6">
      <button type="button" onClick={() => navigate(`/admin/classes/${id}`)} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to class</button>
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-2.5 sm:px-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faBookOpen} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">Class record</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">Edit class</h1><p className="mb-0 mt-1 text-sm text-secondary">Update class details and teacher assignment.</p></div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <section>
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-base font-semibold text-primary">Class information</h2><p className="mb-0 mt-1 text-xs text-secondary">Update the course, lesson, class type, schedule, and location.</p></div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
              <AppInput containerClassName={fieldClass} label="Class name" name="name" value={form.name} onChange={handleChange} error={errors.name?.[0]} />
              <div><AppSelect containerClassName={fieldClass} label="Course" name="course_id" required value={form.course_id} onChange={handleChange} placeholder="Select course" options={courses.filter((course) => course.status === "active" || String(course.id) === form.course_id).map((course) => ({ label: `${course.name}${course.code ? ` · ${course.code}` : ""}`, value: String(course.id) }))} error={errors.course_id?.[0] || errors.course?.[0]} />{courses.length === 0 && <p className="mt-1 text-[11px] text-muted">No courses available. <Link to="/admin/courses/create" className="font-semibold text-brand-strong hover:underline">Create a course</Link></p>}</div>
              <AppSelect containerClassName={fieldClass} label="Lesson" name="lesson_id" required disabled={!form.course_id} value={form.lesson_id} onChange={handleChange} placeholder="Select lesson" options={(courses.find((course) => String(course.id) === form.course_id)?.lessons || []).filter((lesson) => lesson.status === "active" || String(lesson.id) === form.lesson_id).map((lesson) => ({ label: lesson.lesson_number ? `${lesson.lesson_number}. ${lesson.name}` : lesson.name, value: String(lesson.id) }))} error={errors.lesson_id?.[0] || errors.lesson?.[0]} />
              <AppSelect containerClassName={fieldClass} label="Class type" name="delivery_mode" value={form.delivery_mode} onChange={handleChange} options={[{ label: "Physical", value: "physical" }, { label: "Hybrid", value: "hybrid" }, { label: "Online", value: "online" }]} error={errors.delivery_mode?.[0]} />
              <AppInput containerClassName={fieldClass} label="Section" name="section" value={form.section} onChange={handleChange} error={errors.section?.[0]} />
              <AppInput containerClassName={fieldClass} label="Academic year" name="academic_year" value={form.academic_year} onChange={handleChange} error={errors.academic_year?.[0]} />
              <AppSelect containerClassName={fieldClass} label="Building" name="building_id" value={form.building_id} onChange={handleChange} placeholder="Select building" options={buildings.filter((building) => building.status === "active").map((building) => ({ label: building.name, value: String(building.id) }))} error={errors.building_id?.[0]} />
              <AppSelect containerClassName={fieldClass} label="Floor" name="floor_id" value={form.floor_id} onChange={handleChange} placeholder="Select floor" options={(buildings.find((building) => building.id === Number(form.building_id))?.floors || []).filter((floor) => floor.status === "active").map((floor) => ({ label: floor.name, value: String(floor.id) }))} error={errors.floor_id?.[0]} />
              <AppSelect containerClassName={fieldClass} label="Room" name="room_id" value={form.room_id} onChange={handleChange} placeholder="Select room" options={(buildings.flatMap((building) => building.floors || []).find((floor) => floor.id === Number(form.floor_id))?.rooms || []).filter((room) => room.status === "active").map((room) => ({ label: room.name, value: String(room.id) }))} error={errors.room_id?.[0]} />
              <AppInput containerClassName={fieldClass} label="Term" name="term" value={form.term} onChange={handleChange} error={errors.term?.[0]} />
              <AppInput containerClassName={fieldClass} label="Time" name="time" value={form.time} onChange={handleChange} placeholder="e.g. 09:00 AM – 10:30 AM" error={errors.time?.[0]} />
            </div>
          </section>

          <section>
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-base font-semibold text-primary">Teaching details</h2><p className="mb-0 mt-1 text-xs text-secondary">Assign a teacher, update status, and edit the description.</p></div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
              <AppSelect containerClassName={fieldClass} label="Teacher (optional)" name="teacher_id" value={form.teacher_id} onChange={handleChange} placeholder="Unassigned" options={teachers} error={errors.teacher_id?.[0]} />
              <div className="min-w-0 sm:col-span-2 xl:col-span-4">
                <label htmlFor="description" className="mb-1.5 block text-[13px] font-semibold text-secondary">Description (optional)</label>
                <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange} placeholder="Add class details" aria-invalid={Boolean(errors.description?.[0])} className={`w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${errors.description?.[0] ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`} />
                {errors.description?.[0] && <p className="mt-1 text-xs text-rose-600">{errors.description[0]}</p>}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate(`/admin/classes/${id}`)} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}
