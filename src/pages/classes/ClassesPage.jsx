import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClasses, deleteClass } from "../../api/classApi";
import AppTable from "../../components/common/AppTable";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppPagination from "../../components/common/AppPagination";
import { useAuth } from "../../context/AuthContext";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchClasses = async (customFilters = filters) => {
    try {
      setLoading(true);

      const res = await getClasses(customFilters);

      setClasses(res.data.data || []);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (e) {
      console.error(e);
      alert("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;

    try {
      await deleteClass(id);
      fetchClasses(filters);
    } catch (e) {
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchClasses();
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
    fetchClasses(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      status: "",
      page: 1,
    };

    setFilters(resetFilters);
    fetchClasses(resetFilters);
  };

  const handlePageChange = (page) => {
    const updatedFilters = {
      ...filters,
      page,
    };

    setFilters(updatedFilters);
    fetchClasses(updatedFilters);
  };

  const columns = [
    { key: "id", title: "ID" },
    { key: "name", title: "Class Name" },
    { key: "section", title: "Section" },
    { key: "academic_year", title: "Year" },
    { key: "room", title: "Room" },
    {
      key: "teacher",
      title: "Teacher",
      render: (row) =>
        row.teacher
          ? `${row.teacher.first_name} ${row.teacher.last_name}`
          : "-",
    },
    { key: "status", title: "Status" },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <>
          <AppButton onClick={() => navigate(`/classes/${row.id}`)}>
            View
          </AppButton>

          {user?.role === "admin" && (
            <>
              <AppButton onClick={() => navigate(`/classes/${row.id}/edit`)}>
                Edit
              </AppButton>

              <AppButton onClick={() => handleDelete(row.id)}>
                Delete
              </AppButton>
            </>
          )}
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
        <h2>Classes</h2>

        {user?.role === "admin" && (
          <AppButton onClick={() => navigate("/classes/create")}>
            Add Class
          </AppButton>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr auto auto",
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
          placeholder="Search by class name, section, year, room"
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

        <AppButton onClick={handleSearch}>Search</AppButton>
        <AppButton onClick={handleReset}>Reset</AppButton>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <AppTable columns={columns} data={classes} />

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