import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTeacher } from "@/modules/teachers/api/teacherApi";
import AppInput from "@/shared/components/AppInput";
import AppSelect from "@/shared/components/AppSelect";
import AppButton from "@/shared/components/AppButton";

export default function TeacherCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    user_id: "",
    teacher_code: "",
    first_name: "",
    last_name: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    hire_date: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);

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
      const payload = {
        ...form,
        user_id: form.user_id === "" ? null : Number(form.user_id),
      };

      await createTeacher(payload);
      alert("Teacher created successfully");
      navigate("/teachers");
    } catch (error) {
      console.error(error);
      alert("Failed to create teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Teacher</h2>

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
          {loading ? "Saving..." : "Create Teacher"}
        </AppButton>
      </form>
    </div>
  );
}