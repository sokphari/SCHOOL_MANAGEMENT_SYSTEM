import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTeacher, updateTeacher } from "@/modules/teachers/api/teacherApi";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppButton from "@/shared/components/AppButton.tsx";

export default function TeacherEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTeacher = async () => {
    try {
      const res = await getTeacher(id);
      const data = res.data;

      setForm({
        user_id: data.user_id ?? "",
        teacher_code: data.teacher_code ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        gender: data.gender ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        address: data.address ?? "",
        hire_date: data.hire_date ?? "",
        status: data.status ?? "active",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load teacher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        user_id: form.user_id === "" ? null : Number(form.user_id),
      };

      await updateTeacher(id, payload);
      alert("Teacher updated successfully");
      navigate("/teachers");
    } catch (error) {
      console.error(error);
      alert("Failed to update teacher");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!form) return <p>No teacher data</p>;

  return (
    <div>
      <h2>Edit Teacher</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
        <AppInput
          label="User ID (optional)"
          name="user_id"
          type="number"
          value={form.user_id}
          onChange={handleChange}
          placeholder="Enter user id"
        />

        <AppInput
          label="Teacher Code"
          name="teacher_code"
          value={form.teacher_code}
          onChange={handleChange}
          placeholder="Enter teacher code"
        />

        <AppInput
          label="First Name"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="Enter first name"
        />

        <AppInput
          label="Last Name"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Enter last name"
        />

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

        <AppInput
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Enter phone"
        />

        <AppInput
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter email"
        />

        <AppInput
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Enter address"
        />

        <AppInput
          label="Hire Date"
          name="hire_date"
          type="date"
          value={form.hire_date}
          onChange={handleChange}
        />

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
          {saving ? "Updating..." : "Update Teacher"}
        </AppButton>
      </form>
    </div>
  );
}