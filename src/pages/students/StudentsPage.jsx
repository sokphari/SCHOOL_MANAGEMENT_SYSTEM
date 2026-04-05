import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, deleteStudent } from "../../api/studentApi";
import AppTable from "../../components/common/AppTable";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppPagination from "../../components/common/AppPagination";
import { useAuth } from "../../context/AuthContext";
import StudentQrCard from "../../components/common/StudentQrCard";
import AppModal from "../../components/common/AppModal";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);

  const handleShowQr = (student) => {
    setSelectedStudent(student);
    setQrOpen(true);
  };

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
  const { user } = useAuth();

  const fetchStudents = async (customFilters = filters) => {
    try {
      setLoading(true);

      const res = await getStudents(customFilters);

      setStudents(res.data.data || []);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;

    try {
      await deleteStudent(id);
      fetchStudents(filters);
    } catch (e) {
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchStudents();
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
    fetchStudents(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      status: "",
      gender: "",
      page: 1,
    };

    setFilters(resetFilters);
    fetchStudents(resetFilters);
  };

  const handlePageChange = (page) => {
    const updatedFilters = {
      ...filters,
      page,
    };

    setFilters(updatedFilters);
    fetchStudents(updatedFilters);
  };

  const columns = [
    {
      key: "id",
      title: "ID",
    },
    {
      key: "student_code",
      title: "Code",
    },
    {
      key: "name",
      title: "Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: "gender",
      title: "Gender",
    },
    {
      key: "phone",
      title: "Phone",
    },
    {
      key: "status",
      title: "Status",
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <>
          <AppButton onClick={() => handleShowQr(row)}>QR</AppButton>

          {user?.role === "admin" && (
            <>
              <AppButton onClick={() => navigate(`/students/${row.id}/edit`)}>
                Edit
              </AppButton>

              <AppButton onClick={() => handleDelete(row.id)}>Delete</AppButton>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <AppModal open={qrOpen} onClose={() => setQrOpen(false)}>
        {selectedStudent && (
          <StudentQrCard
            student={selectedStudent}
            onClose={() => setQrOpen(false)}
          />
        )}
      </AppModal>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2>Students</h2>

        {user?.role === "admin" && (
          <AppButton onClick={() => navigate("/students/create")}>
            Add Student
          </AppButton>
        )}
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
          placeholder="Search by code, name, phone, email"
        />

        <AppSelect
          label="Status"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          options={[
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
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
        />

        <AppButton onClick={handleSearch}>Search</AppButton>
        <AppButton onClick={handleReset}>Reset</AppButton>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <AppTable columns={columns} data={students} />

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
