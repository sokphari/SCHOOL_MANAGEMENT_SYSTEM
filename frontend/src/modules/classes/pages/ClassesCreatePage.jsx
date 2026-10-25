import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClass } from "@/modules/classes/api/classApi";
import { getTeachers } from "@/modules/teachers/api/teacherApi";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppButton from "@/shared/components/AppButton.tsx";

export default function ClassCreatePage() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    section: "",
    academic_year: "",
    room: "",
    teacher_id: "",
    description: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await getTeachers();
      const data = res.data.data || [];

      setTeachers(
        data.map((t) => ({
          label: `${t.first_name} ${t.last_name}`,
          value: t.id,
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createClass({
        ...form,
        teacher_id: form.teacher_id || null,
      });

      alert("Class created successfully");
      navigate("/admin/classes");
    } catch (e) {
      alert("Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Class</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <AppInput label="Class Name" name="name" value={form.name} onChange={handleChange} />
        <AppInput label="Section" name="section" value={form.section} onChange={handleChange} />
        <AppInput label="Academic Year" name="academic_year" value={form.academic_year} onChange={handleChange} />
        <AppInput label="Room" name="room" value={form.room} onChange={handleChange} />

        <AppSelect
          label="Teacher"
          name="teacher_id"
          value={form.teacher_id}
          onChange={handleChange}
          options={teachers}
        />

        <AppInput label="Description" name="description" value={form.description} onChange={handleChange} />

        <AppSelect
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />

        <AppButton type="submit">
          {loading ? "Saving..." : "Create Class"}
        </AppButton>
      </form>
    </div>
  );
}