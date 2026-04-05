import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStudent } from "../../api/studentApi";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppButton from "../../components/common/AppButton";

export default function StudentCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    student_code: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    guardian_name: "",
    guardian_phone: "",
    enrollment_date: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await createStudent(form);
      alert("Student created successfully");
      navigate("/students");
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Student</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
        <AppInput
          label="Student Code"
          name="student_code"
          value={form.student_code}
          onChange={handleChange}
          error={errors.student_code?.[0]}
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
          label="Date of Birth"
          name="date_of_birth"
          type="date"
          value={form.date_of_birth}
          onChange={handleChange}
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
          value={form.email}
          onChange={handleChange}
          error={errors.email?.[0]}
        />

        <AppInput
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Enter address"
        />

        <AppInput
          label="Guardian Name"
          name="guardian_name"
          value={form.guardian_name}
          onChange={handleChange}
          placeholder="Enter guardian name"
        />

        <AppInput
          label="Guardian Phone"
          name="guardian_phone"
          value={form.guardian_phone}
          onChange={handleChange}
          placeholder="Enter guardian phone"
        />

        <AppInput
          label="Enrollment Date"
          name="enrollment_date"
          type="date"
          value={form.enrollment_date}
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
          {loading ? "Saving..." : "Create Student"}
        </AppButton>
      </form>
    </div>
  );
}
