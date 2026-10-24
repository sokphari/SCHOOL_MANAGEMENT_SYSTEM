import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getStudentRequest,
  updateStudentRequestStatus,
} from "../../api/studentRequestsApi";
import AppButton from "../../components/common/AppButton";
import AppSelect from "../../components/common/AppSelect";

export default function StudentRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requestData, setRequestData] = useState(null);
  const [status, setStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getStudentRequest(id);
      const data = res.data;

      setRequestData(data);
      setStatus(data.status || "pending");
      setAdminNote(data.admin_note || "");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await updateStudentRequestStatus(id, {
        status,
        admin_note: adminNote,
      });

      alert("Request updated successfully");
      fetchRequest();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!requestData) return <p>No request found</p>;

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <AppButton onClick={() => navigate("/student-requests")}>
          Back
        </AppButton>
      </div>

      <h2>Request Detail</h2>

      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <p>
          <strong>Student:</strong>{" "}
          {requestData.student
            ? `${requestData.student.first_name} ${requestData.student.last_name}`
            : requestData.student_code_snapshot}
        </p>
        <p>
          <strong>Student Code:</strong> {requestData.student_code_snapshot}
        </p>
        <p>
          <strong>Category:</strong> {requestData.category}
        </p>
        <p>
          <strong>Priority:</strong> {requestData.priority}
        </p>
        <p>
          <strong>Subject:</strong> {requestData.subject}
        </p>
        <p>
          <strong>Description:</strong> {requestData.description}
        </p>
        <p>
          <strong>Status:</strong> {requestData.status}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          maxWidth: "600px",
        }}
      >
        <AppSelect
          label="Update Status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in_progress" },
            { label: "Resolved", value: "resolved" },
            { label: "Rejected", value: "rejected" },
          ]}
        />

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px" }}>
            Admin Note
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows="5"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />
        </div>

        <AppButton type="submit">
          {saving ? "Updating..." : "Update Request"}
        </AppButton>
      </form>
    </div>
  );
}