import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeachers, deleteTeacher } from "@/modules/teachers/api/teacherApi";
import AppTable from "@/shared/components/AppTable.tsx";
import AppButton from "@/shared/components/AppButton.tsx";
import AppInput from "@/shared/components/AppInput.tsx";
import AppSelect from "@/shared/components/AppSelect.tsx";
import AppPagination from "@/shared/components/AppPagination.tsx";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    gender: "",
    page: 1,
  });

  const navigate = useNavigate();

  const fetchTeachers = async (customFilters = filters) => {
    try {
      setLoading(true);

      const res = await getTeachers(customFilters);

      setTeachers(res.data.data || []);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;

    try {
      await deleteTeacher(id);
      fetchTeachers(filters);
    } catch (e) {
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchTeachers();
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
    fetchTeachers(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      status: "",
      gender: "",
      page: 1,
    };

    setFilters(resetFilters);
    fetchTeachers(resetFilters);
  };

  const handlePageChange = (page) => {
    const updatedFilters = {
      ...filters,
      page,
    };

    setFilters(updatedFilters);
    fetchTeachers(updatedFilters);
  };

  const columns = [
    { key: "id", title: "ID" },
    { key: "teacher_code", title: "Code" },
    {
      key: "name",
      title: "Name",
      render: (row) => (
        <span style={{ fontWeight: "600", color: "#1f2937" }}>
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: "gender",
      title: "Gender",
      render: (row) => (
        <span
          style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background: row.gender === "male" ? "#dbeafe" : "#fce7f3",
            color: row.gender === "male" ? "#0369a1" : "#be185d",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          <i
            className={row.gender === "male" ? "fas fa-person" : "fas fa-person-dress"}
            style={{ marginRight: "6px" }}
          />
          {row.gender}
        </span>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <i className="fas fa-phone" style={{ color: "#0d5c42" }} />
          {row.phone}
        </span>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (row) => (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
          }}
        >
          <i className="fas fa-envelope" style={{ color: "#2563eb" }} />
          {row.email}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span
          style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background: row.status === "active" ? "#dcfce7" : "#fee2e2",
            color: row.status === "active" ? "#15803d" : "#991b1b",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          <i
            className={row.status === "active" ? "fas fa-check-circle" : "fas fa-times-circle"}
            style={{ marginRight: "6px" }}
          />
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate(`/teachers/${row.id}/edit`)}
            style={{
              padding: "6px 12px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1d4ed8";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 99, 235, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563eb";
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Edit Teacher"
          >
            <i className="fas fa-edit" style={{ marginRight: "4px" }} />
            Edit
          </button>

          <button
            onClick={() => handleDelete(row.id)}
            style={{
              padding: "6px 12px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#b91c1c";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(220, 38, 38, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#dc2626";
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Delete Teacher"
          >
            <i className="fas fa-trash" style={{ marginRight: "4px" }} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
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
            <i className="fas fa-chalkboard-user" style={{ color: "#0d5c42" }} />
            Teachers Management
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Manage all teachers and their information
          </p>
        </div>

        <button
          onClick={() => navigate("/teachers/create")}
          style={{
            padding: "12px 20px",
            background: "#25d366",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1da851";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 211, 102, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#25d366";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <i className="fas fa-plus" />
          Add Teacher
        </button>
      </div>

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
            placeholder="Search by code, name, phone, email..."
          />

          <AppSelect
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { label: "All Status", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />

          <AppSelect
            label="Gender"
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
            options={[
              { label: "All Gender", value: "" },
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
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
            <p style={{ color: "#6b7280", marginTop: "16px" }}>Loading teachers...</p>
          </div>
        ) : teachers.length > 0 ? (
          <>
            <AppTable columns={columns} data={teachers} />

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
                Total: <strong>{pagination.total}</strong> teachers
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
              No teachers found
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