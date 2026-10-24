import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  findStudentByCode,
  submitStudentRequest,
} from "@/modules/public/api/publicRequestApi";
import AppInput from "@/shared/components/AppInput";
import AppSelect from "@/shared/components/AppSelect";
import AppButton from "@/shared/components/AppButton";

export default function StudentRequestScanPage() {
  const [searchParams] = useSearchParams();

  const [student, setStudent] = useState(null);
  const [studentCode, setStudentCode] = useState("");
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "medium",
  });

  const loadStudent = async (code) => {
    try {
      setLoadingStudent(true);
      setError("");
      setSuccess("");

      const cleanCode = code.trim();
      setStudentCode(cleanCode);

      const res = await findStudentByCode(cleanCode);
      setStudent(res.data);
    } catch (e) {
      console.error(e);
      setStudent(null);
      setError(e?.response?.data?.message || "Student not found");
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");

    if (codeFromUrl) {
      loadStudent(codeFromUrl);
    }
  }, []);

  const handleScan = async (detectedCodes) => {
    const firstCode = detectedCodes?.[0]?.rawValue;
    if (!firstCode) return;

    if (firstCode === studentCode) return;

    await loadStudent(firstCode);
  };

  const handleManualLookup = async () => {
    if (!studentCode) {
      setError("Please enter student code");
      return;
    }

    await loadStudent(studentCode);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setStudent(null);
    setStudentCode("");
    setForm({
      category: "",
      subject: "",
      description: "",
      priority: "medium",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentCode) {
      setError("Please scan QR or enter student code");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await submitStudentRequest({
        student_code: studentCode,
        category: form.category,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
      });

      setSuccess("Request submitted successfully");
      resetForm();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h2>Student Request / Complaint</h2>
      <p style={{ color: "#6b7280" }}>
        Scan student QR or enter student code manually.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginTop: "24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <h3>Scan QR</h3>

          <div style={{ maxWidth: "420px" }}>
            <Scanner
              onScan={handleScan}
              onError={(err) => console.error(err)}
            />
          </div>

          <div style={{ marginTop: "16px" }}>
            <AppInput
              label="Student Code"
              name="student_code"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="Enter student code manually"
            />

            <AppButton onClick={handleManualLookup}>Find Student</AppButton>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <h3>Student Info</h3>

          {loadingStudent && <p>Loading student...</p>}

          {!loadingStudent && student && (
            <div>
              <p>
                <strong>Name:</strong> {student.name}
              </p>
              <p>
                <strong>Code:</strong> {student.student_code}
              </p>
              <p>
                <strong>Classes:</strong>{" "}
                {student.class_names?.join(", ") || "-"}
              </p>
            </div>
          )}

          {!loadingStudent && !student && (
            <p style={{ color: "#6b7280" }}>
              No student selected yet.
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginTop: "24px",
        }}
      >
        <h3>Submit Request</h3>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ maxWidth: "700px" }}>
          <AppSelect
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            options={[
              { label: "Teacher Feedback", value: "teacher_feedback" },
              { label: "Room Issue", value: "room_issue" },
              { label: "Facility Issue", value: "facility_issue" },
              { label: "Class Request", value: "class_request" },
              { label: "General Request", value: "general_request" },
            ]}
          />

          <AppInput
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Enter subject"
          />

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="5"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />
          </div>

          <AppSelect
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
          />

          <AppButton type="submit">
            {saving ? "Submitting..." : "Submit Request"}
          </AppButton>
        </form>
      </div>
    </div>
  );
}