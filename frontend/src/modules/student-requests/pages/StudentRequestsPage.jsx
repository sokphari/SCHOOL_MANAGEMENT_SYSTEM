import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentRequests } from "@/modules/student-requests/api/studentRequestsApi";
import AppTable from "@/shared/components/AppTable";
import AppButton from "@/shared/components/AppButton";
import AppInput from "@/shared/components/AppInput";
import AppSelect from "@/shared/components/AppSelect";
import AppPagination from "@/shared/components/AppPagination";

export default function StudentRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    page: 1,
  });

  const navigate = useNavigate();

  const fetchRequests = async (customFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const res = await getStudentRequests(customFilters);

      setRequests(res.data.data || []);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (e) {
      console.error(e);

      if (e?.response?.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(e?.response?.data?.message || "Failed to submit request");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = () => {
    const updatedFilters = {
      ...filters,
      page: 1,
    };

    setFilters(updatedFilters);
    fetchRequests(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      status: "",
      category: "",
      page: 1,
    };

    setFilters(resetFilters);
    fetchRequests(resetFilters);
  };

  const handlePageChange = (page) => {
    const updatedFilters = {
      ...filters,
      page,
    };

    setFilters(updatedFilters);
    fetchRequests(updatedFilters);
  };

  // Status color map
  const statusColorMap = {
    pending: { bg: "#fef3c7", color: "#92400e", icon: "fas fa-clock" },
    in_progress: { bg: "#dbeafe", color: "#0369a1", icon: "fas fa-spinner" },
    resolved: { bg: "#dcfce7", color: "#15803d", icon: "fas fa-check-circle" },
    rejected: { bg: "#fee2e2", color: "#991b1b", icon: "fas fa-times-circle" },
  };

  // Priority color map
  const priorityColorMap = {
    low: { bg: "#e0e7ff", color: "#3730a3" },
    medium: { bg: "#fef3c7", color: "#92400e" },
    high: { bg: "#fca5a5", color: "#991b1b" },
  };

  // Category icon map
  const categoryIconMap = {
    teacher_feedback: "fas fa-chalkboard-user",
    room_issue: "fas fa-door-open",
    facility_issue: "fas fa-tools",
    class_request: "fas fa-book",
    general_request: "fas fa-clipboard",
  };

  const columns = [
    { key: "id", title: "ID" },
    {
      key: "student",
      title: "Student",
      render: (row) => (
        <span style={{ fontWeight: "600", color: "#1f2937" }}>
          <i className="fas fa-user" style={{ marginRight: "6px", color: "#0d5c42" }} />
          {row.student
            ? `${row.student.first_name} ${row.student.last_name}`
            : row.student_code_snapshot}
        </span>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <i
            className={categoryIconMap[row.category] || "fas fa-question"}
            style={{ color: "#2563eb" }}
          />
          <span style={{ textTransform: "capitalize" }}>
            {row.category.replace(/_/g, " ")}
          </span>
        </span>
      ),
    },
    {
      key: "subject",
      title: "Subject",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#1f2937" }}>
          {row.subject}
        </span>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (row) => {
        const priorityColor = priorityColorMap[row.priority] || {
          bg: "#f3f4f6",
          color: "#6b7280",
        };
        return (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              background: priorityColor.bg,
              color: priorityColor.color,
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const statusColor = statusColorMap[row.status] || {
          bg: "#f3f4f6",
          color: "#6b7280",
          icon: "fas fa-question",
        };
        return (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              background: statusColor.bg,
              color: statusColor.color,
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            <i className={statusColor.icon} style={{ marginRight: "6px" }} />
            {row.status.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <button
          onClick={() => navigate(`/student-requests/${row.id}`)}
          style={{
            padding: "6px 12px",
            background: "#0d5c42",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#054e36";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(13, 92, 66, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#0d5c42";
            e.currentTarget.style.boxShadow = "none";
          }}
          title="View Request Details"
        >
          <i className="fas fa-eye" />
          View
        </button>
      ),
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 600,
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <i className="fas fa-clipboard" style={{ color: "#0d5c42" }} />
          Student Requests
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          View and manage all student requests and inquiries
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <i
            className="fas fa-exclamation-circle"
            style={{ color: "#991b1b", fontSize: "20px" }}
          />
          <p style={{ margin: 0, color: "#991b1b", fontSize: "14px" }}>
            {error}
          </p>
        </div>
      )}

      {/* Filters Section */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          <i className="fas fa-filter" style={{ marginRight: "8px" }} />
          Filters
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <AppInput
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by code, subject, category..."
          />

          <AppSelect
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { label: "All Status", value: "" },
              { label: "Pending", value: "pending" },
              { label: "In Progress", value: "in_progress" },
              { label: "Resolved", value: "resolved" },
              { label: "Rejected", value: "rejected" },
            ]}
          />

          <AppSelect
            label="Category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            options={[
              { label: "All Categories", value: "" },
              { label: "Teacher Feedback", value: "teacher_feedback" },
              { label: "Room Issue", value: "room_issue" },
              { label: "Facility Issue", value: "facility_issue" },
              { label: "Class Request", value: "class_request" },
              { label: "General Request", value: "general_request" },
            ]}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSearch}
            style={{
              padding: "10px 20px",
              background: "#0d5c42",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#054e36";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0d5c42";
            }}
          >
            <i className="fas fa-search" />
            Search
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: "10px 20px",
              background: "#e5e7eb",
              color: "#1f2937",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#e5e7eb";
            }}
          >
            <i className="fas fa-redo" />
            Reset
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: "32px", color: "#0d5c42", marginBottom: "16px" }}
            />
            <p style={{ color: "#6b7280", marginTop: "16px" }}>Loading requests...</p>
          </div>
        ) : requests.length > 0 ? (
          <>
            <AppTable columns={columns} data={requests} />

            <div
              style={{
                marginTop: "20px",
                padding: "12px 0",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                <i className="fas fa-database" style={{ marginRight: "8px" }} />
                Total: <strong>{pagination.total}</strong> requests
              </p>

              <AppPagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <i
              className="fas fa-inbox"
              style={{ fontSize: "48px", color: "#d1d5db", marginBottom: "16px" }}
            />
            <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
              No requests found
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}