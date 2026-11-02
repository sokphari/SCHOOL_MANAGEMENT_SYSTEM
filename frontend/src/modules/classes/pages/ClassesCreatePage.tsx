import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { createClass, getClassScheduleTemplates } from "@/modules/classes/api/classApi.ts";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { getTeachers } from "@/modules/teachers/api/teacherApi.ts";
import { getBuildings } from "@/modules/locations/api/locationApi.ts";
import { getCourses } from "@/modules/courses/api/courseApi.ts";
import AppSelect from "@/shared/components/AppSelect.tsx";
import ClassScheduleSelect from "@/modules/classes/components/ClassScheduleSelect";
import type { ClassForm, ClassPayload, ClassScheduleTemplate, ClassValidationErrors, TeacherOption } from "@/modules/classes/types/class";
import type { BuildingLocation } from "@/modules/locations/types/location";
import type { Course } from "@/modules/courses/types/course";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { translateUiText } from "@/shared/i18n/translateUiText";

const fieldClass = "mb-0";

const getCurrentAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

export default function ClassCreatePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingLocation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [scheduleTemplates, setScheduleTemplates] = useState<ClassScheduleTemplate[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsLoadErrors, setOptionsLoadErrors] = useState<string[]>([]);
  const [optionsReloadKey, setOptionsReloadKey] = useState(0);
  const [form, setForm] = useState<ClassForm>({
    name: "", course: "", lesson: "", course_id: "", lesson_id: "", delivery_mode: "physical", section: "", academic_year: "", building_id: "", floor_id: "", room_id: "", schedule_days: [], starts_at: "", ends_at: "", teacher_id: "", description: "", status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ClassValidationErrors>({});
  const activeCourses = courses.filter((course) => course.status === "active");
  const activeBuildings = buildings.filter((building) => building.status === "active");
  const activeFloors = buildings.find((building) => building.id === Number(form.building_id))?.floors?.filter((floor) => floor.status === "active") || [];
  const activeRooms = buildings.flatMap((building) => building.floors || []).find((floor) => floor.id === Number(form.floor_id))?.rooms?.filter((room) => room.status === "active") || [];
  const requiredOptionLoadFailed = optionsLoadErrors.some((error) => error !== "Teacher list");

  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsLoadErrors([]);
    Promise.allSettled([
      user?.role === "admin" ? getTeachers() : Promise.resolve(null),
      getBuildings(),
      getCourses(),
      getClassScheduleTemplates(),
    ])
      .then(([teacherResult, buildingResult, courseResult, scheduleResult]) => {
        if (!active) return;
        const failures: string[] = [];

        if (teacherResult.status === "fulfilled") {
          setTeachers((teacherResult.value?.data.data || []).map((teacher) => ({ label: `${teacher.first_name} ${teacher.last_name}`, value: String(teacher.id) })));
        } else {
          failures.push("Teacher list");
          console.error("Failed to load teachers", teacherResult.reason);
        }

        if (buildingResult.status === "fulfilled") setBuildings(Array.isArray(buildingResult.value.data) ? buildingResult.value.data : []);
        else {
          failures.push("Buildings");
          console.error("Failed to load buildings", buildingResult.reason);
        }

        if (courseResult.status === "fulfilled") setCourses(Array.isArray(courseResult.value.data) ? courseResult.value.data : []);
        else {
          failures.push("Courses and lessons");
          console.error("Failed to load courses", courseResult.reason);
        }

        if (scheduleResult.status === "fulfilled") setScheduleTemplates(Array.isArray(scheduleResult.value.data) ? scheduleResult.value.data : []);
        else {
          failures.push("Class schedules");
          console.error("Failed to load class schedules", scheduleResult.reason);
        }
        setOptionsLoadErrors(failures);
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => { active = false; };
  }, [user?.role, optionsReloadKey]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setForm((current) => {
      if (name === "course_id") {
        const course = courses.find((item) => String(item.id) === value);
        return { ...current, course_id: value, course: course?.name || "", name: course?.name || "", lesson_id: "", lesson: "" };
      }
      if (name === "lesson_id") {
        const lesson = courses.find((item) => String(item.id) === current.course_id)?.lessons?.find((item) => String(item.id) === value);
        return { ...current, lesson_id: value, lesson: lesson?.name || "", name: lesson?.name || current.course };
      }
      return { ...current, [name]: value, ...(name === "building_id" ? { floor_id: "", room_id: "" } : {}), ...(name === "floor_id" ? { room_id: "" } : {}) };
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleTermChange = (days: number[]) => {
    setForm((current) => ({ ...current, schedule_days: days }));
    setErrors((current) => ({ ...current, schedule_days: undefined }));
  };

  const handleTimeChange = (startsAt: string, endsAt: string) => {
    setForm((current) => ({ ...current, starts_at: startsAt, ends_at: endsAt }));
    setErrors((current) => ({ ...current, starts_at: undefined, ends_at: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const payload: ClassPayload = {
        ...form,
        name: form.lesson || form.course,
        section: "",
        academic_year: getCurrentAcademicYear(),
        course_id: Number(form.course_id),
        lesson_id: Number(form.lesson_id),
        building_id: Number(form.building_id),
        floor_id: Number(form.floor_id),
        room_id: Number(form.room_id),
        teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
      };
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
    <div className="mx-auto w-full max-w-[1800px] space-y-2">
      <button type="button" onClick={() => navigate("/admin/classes")} className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand/15"><FontAwesomeIcon icon={faArrowLeft} /> Back to classes</button>
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-transparent px-4 py-2.5 sm:px-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl text-white shadow-md shadow-brand/20"><FontAwesomeIcon icon={faBookOpen} /></div>
          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[1.3px] text-brand">{t("form.classDetails")}</p><h1 className="m-0 text-xl font-bold text-primary sm:text-2xl">{t("classes.createClass")}</h1><p className="mb-0 mt-1 text-sm text-secondary">{t(user?.role === "admin" ? "form.classCreateAdmin" : "form.classCreateTeacher")}</p></div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {optionsLoadErrors.length > 0 && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200"><span>Could not load {optionsLoadErrors.join(", ")}. Check your connection and try again.</span><button type="button" onClick={() => setOptionsReloadKey((key) => key + 1)} className="rounded-md border border-rose-500/40 px-3 py-1.5 font-semibold hover:bg-rose-500/10">Retry</button></div>}
          {optionsLoading && <p role="status" className="m-0 text-sm text-secondary">Loading courses, buildings, and class schedules…</p>}
          <section className="border-b border-border pb-5">
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-sm font-bold text-primary">{t("form.classDetails")}</h2><p className="mb-0 mt-1 text-xs text-secondary">{t("form.classDetailsDescription")}</p></div>
            <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0"><AppSelect containerClassName={fieldClass} label="Course" name="course_id" required disabled={optionsLoading || optionsLoadErrors.includes("Courses and lessons")} value={form.course_id} onChange={handleChange} placeholder={optionsLoading ? "Loading courses…" : "Select course"} options={activeCourses.map((course) => ({ label: `${course.name}${course.code ? ` · ${course.code}` : ""}`, value: String(course.id) }))} error={errors.course_id?.[0] || errors.course?.[0]} />{!optionsLoading && activeCourses.length === 0 && <p className="mt-1 text-[11px] text-muted">No active courses are available.{user?.role === "admin" && <> <Link to="/admin/courses/create" className="font-semibold text-brand-strong hover:underline">Create a course</Link></>}</p>}</div>
              <AppSelect containerClassName={fieldClass} label="Lesson" name="lesson_id" required disabled={!form.course_id} value={form.lesson_id} onChange={handleChange} placeholder="Select lesson" options={(courses.find((course) => String(course.id) === form.course_id)?.lessons || []).filter((lesson) => lesson.status === "active").map((lesson) => ({ label: lesson.lesson_number ? `${lesson.lesson_number}. ${lesson.name}` : lesson.name, value: String(lesson.id) }))} error={errors.lesson_id?.[0] || errors.lesson?.[0]} />
              <AppSelect containerClassName={fieldClass} label="Class type" name="delivery_mode" required value={form.delivery_mode} onChange={handleChange} placeholder="Select class type" options={[{ label: "Physical", value: "physical" }, { label: "Hybrid", value: "hybrid" }, { label: "Online", value: "online" }]} error={errors.delivery_mode?.[0]} />
            </div>
          </section>

          <section className="border-b border-border pb-5">
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-sm font-bold text-primary">{t("form.scheduleLocation")}</h2><p className="mb-0 mt-1 text-xs text-secondary">{t("form.scheduleDescription")}</p></div>
            <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0"><AppSelect containerClassName={fieldClass} label="Building" name="building_id" required disabled={optionsLoading || optionsLoadErrors.includes("Buildings")} value={form.building_id} onChange={handleChange} placeholder={optionsLoading ? "Loading buildings…" : "Select building"} options={buildings.filter((building) => building.status === "active").map((building) => ({ label: building.name, value: String(building.id) }))} error={errors.building_id?.[0]} />{!optionsLoading && buildings.filter((building) => building.status === "active").length === 0 && <p className="mt-1 text-[11px] text-muted">No active buildings are available.{user?.role === "admin" && <> <Link to="/admin/facilities/buildings/create" className="font-semibold text-brand-strong hover:underline">Create a building</Link></>}</p>}</div>
              <div className="min-w-0"><AppSelect containerClassName={fieldClass} label="Floor" name="floor_id" required value={form.floor_id} disabled={!form.building_id} onChange={handleChange} placeholder="Select floor" options={activeFloors.map((floor) => ({ label: floor.name, value: String(floor.id) }))} error={errors.floor_id?.[0]} />{form.building_id && activeFloors.length === 0 && <p className="mt-1 text-[11px] text-muted">No active floors in this building. Add a floor in Facilities.</p>}</div>
              <div className="min-w-0"><AppSelect containerClassName={fieldClass} label="Room" name="room_id" required value={form.room_id} disabled={!form.floor_id} onChange={handleChange} placeholder="Select room" options={activeRooms.map((room) => ({ label: room.name, value: String(room.id) }))} error={errors.room_id?.[0]} />{form.floor_id && activeRooms.length === 0 && <p className="mt-1 text-[11px] text-muted">No active rooms on this floor. Add a room in Facilities.</p>}</div>
              <div className="sm:col-span-2 xl:col-span-3"><ClassScheduleSelect templates={scheduleTemplates} days={form.schedule_days} startsAt={form.starts_at} endsAt={form.ends_at} onDaysChange={handleTermChange} onTimeChange={handleTimeChange} errors={errors} disabled={optionsLoading || optionsLoadErrors.includes("Class schedules")} />{!optionsLoading && scheduleTemplates.filter((template) => template.status === "active").length === 0 && <p className="mt-1 text-[11px] text-muted">No active class schedules are available.{user?.role === "admin" && <> <Link to="/admin/timetable/templates" className="font-semibold text-brand-strong hover:underline">Create a schedule</Link></>}</p>}</div>
            </div>
          </section>

          <section>
            <div className="mb-3 border-b border-border pb-2.5"><h2 className="m-0 text-sm font-bold text-primary">{t("form.teachingDetails")}</h2><p className="mb-0 mt-1 text-xs text-secondary">{t(user?.role === "admin" ? "form.teachingDescription" : "form.teacherAutoAssigned")}</p></div>
            <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {user?.role === "admin"
                ? <AppSelect containerClassName={fieldClass} label="Teacher (optional)" name="teacher_id" value={form.teacher_id} onChange={handleChange} placeholder="Unassigned" options={teachers} error={errors.teacher_id?.[0]} />
                : <div className="flex min-h-11 items-center rounded-lg border border-border bg-app-bg/50 px-3 text-sm text-secondary">Teacher will be assigned to your account automatically.</div>}
              <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                <label htmlFor="description" className="mb-1.5 block text-[13px] font-semibold text-secondary">{translateUiText("Description (optional)", t)}</label>
                <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange} placeholder={translateUiText("Add class details", t)} aria-invalid={Boolean(errors.description?.[0])} className={`w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${errors.description?.[0] ? "border-rose-500" : "border-border dark:border-[#4a4359]"}`} />
                {errors.description?.[0] && <p className="mt-1 text-xs text-rose-600">{errors.description[0]}</p>}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-app-bg/40 px-4 py-2.5 sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={() => navigate("/admin/classes")} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-brand-soft">{t("common.cancel")}</button>
          <button type="submit" disabled={loading || optionsLoading || requiredOptionLoadFailed || activeCourses.length === 0 || activeBuildings.length === 0 || scheduleTemplates.every((template) => template.status !== "active")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={faFloppyDisk} />{loading ? t("form.saving") : t("classes.createClass")}</button>
        </div>
      </form>
    </div>
  );
}
