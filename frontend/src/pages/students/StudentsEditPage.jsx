import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudent, updateStudent } from "../../api/studentApi";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppButton from "../../components/common/AppButton";

export default function StudentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = async () => {
    try {
      const res = await getStudent(id);
      setForm(res.data);
    } catch (e) {
      alert("Failed to load student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateStudent(id, form);
      alert("Student updated");
      navigate("/admin/students");
    } catch (e) {
      alert("Update failed");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!form) return <p>No data</p>;

  return (
    <div>
      <h2>Edit Student</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <AppInput label="Student Code" name="student_code" value={form.student_code} onChange={handleChange} />
        <AppInput label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
        <AppInput label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />

        <AppSelect
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
        />

        <AppInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />

        <AppButton type="submit">Update Student</AppButton>
      </form>
    </div>
  );
}