import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClass, updateClass } from "../../api/classApi";
import { getTeachers } from "../../api/teacherApi";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppButton from "../../components/common/AppButton";

export default function ClassEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, teacherRes] = await Promise.all([
        getClass(id),
        getTeachers(),
      ]);

      const data = classRes.data;
      const teachersData = teacherRes.data.data || [];

      setTeachers(
        teachersData.map((t) => ({
          label: `${t.first_name} ${t.last_name}`,
          value: t.id,
        }))
      );

      setForm({
        name: data.name || "",
        section: data.section || "",
        academic_year: data.academic_year || "",
        room: data.room || "",
        teacher_id: data.teacher_id || "",
        description: data.description || "",
        status: data.status || "active",
      });
    } catch (e) {
      alert("Failed to load class");
    } finally {
      setLoading(false);
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

    try {
      await updateClass(id, {
        ...form,
        teacher_id: form.teacher_id || null,
      });

      alert("Class updated");
      navigate("/classes");
    } catch (e) {
      alert("Update failed");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!form) return <p>No data</p>;

  return (
    <div>
      <h2>Edit Class</h2>

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

        <AppButton type="submit">Update Class</AppButton>
      </form>
    </div>
  );
}