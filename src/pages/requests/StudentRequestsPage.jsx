import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentRequests } from "../../api/studentRequestsApi";
import AppTable from "../../components/common/AppTable";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppPagination from "../../components/common/AppPagination";

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

  const columns = [
    { key: "id", title: "ID" },
    {
      key: "student",
      title: "Student",
      render: (row) =>
        row.student
          ? `${row.student.first_name} ${row.student.last_name}`
          : row.student_code_snapshot,
    },
    { key: "category", title: "Category" },
    { key: "subject", title: "Subject" },
    { key: "priority", title: "Priority" },
    { key: "status", title: "Status" },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <AppButton onClick={() => navigate(`/student-requests/${row.id}`)}>
          View
        </AppButton>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2>Student Requests</h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr auto auto",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "end",
        }}
      >
        <AppInput
          label="Search"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by code, subject, category, status"
        />

        <AppSelect
          label="Status"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          options={[
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
            { label: "Teacher Feedback", value: "teacher_feedback" },
            { label: "Room Issue", value: "room_issue" },
            { label: "Facility Issue", value: "facility_issue" },
            { label: "Class Request", value: "class_request" },
            { label: "General Request", value: "general_request" },
          ]}
        />

        <AppButton onClick={handleSearch}>Search</AppButton>
        <AppButton onClick={handleReset}>Reset</AppButton>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <AppTable columns={columns} data={requests} />

          <p style={{ marginTop: "12px", color: "#6b7280" }}>
            Total: {pagination.total}
          </p>

          <AppPagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
