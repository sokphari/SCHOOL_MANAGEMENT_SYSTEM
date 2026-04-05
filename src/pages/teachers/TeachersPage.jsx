import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeachers, deleteTeacher } from "../../api/teacherApi";
import AppTable from "../../components/common/AppTable";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppPagination from "../../components/common/AppPagination";

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
    if (!confirm("Are you sure?")) return;

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
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    { key: "gender", title: "Gender" },
    { key: "phone", title: "Phone" },
    { key: "email", title: "Email" },
    { key: "status", title: "Status" },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <>
          <AppButton onClick={() => navigate(`/teachers/${row.id}/edit`)}>
            Edit
          </AppButton>
          <AppButton onClick={() => handleDelete(row.id)}>
            Delete
          </AppButton>
        </>
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
        <h2>Teachers</h2>

        <AppButton onClick={() => navigate("/teachers/create")}>
          Add Teacher
        </AppButton>
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
          <AppTable columns={columns} data={teachers} />

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