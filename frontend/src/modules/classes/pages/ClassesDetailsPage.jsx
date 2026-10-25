import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClass, assignStudentToClass, removeStudentFromClass } from "@/modules/classes/api/classApi";
import { getStudents } from "@/modules/students/api/studentApi.ts";
import AppButton from "@/shared/components/AppButton.tsx";
import AppTable from "@/shared/components/AppTable.tsx";

export default function ClassDetailPage() {
  const { id } = useParams();

  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    fetchData();
    fetchStudents();
  }, []);

  const fetchData = async () => {
    const res = await getClass(id);
    setClassData(res.data);
  };

  const fetchStudents = async () => {
    const res = await getStudents();
    setStudents(res.data.data || []);
  };

  const handleAssign = async () => {
    if (!selectedStudent) return;

    await assignStudentToClass(id, selectedStudent);
    setSelectedStudent("");
    fetchData();
  };

  const handleRemove = async (studentId) => {
    if (!confirm("Remove student?")) return;

    await removeStudentFromClass(id, studentId);
    fetchData();
  };

  if (!classData) return <p>Loading...</p>;

  const columns = [
    { key: "id", title: "ID" },
    {
      key: "name",
      title: "Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <AppButton onClick={() => handleRemove(row.id)}>
          Remove
        </AppButton>
      ),
    },
  ];

  return (
    <div>
      <h2>
        Class: {classData.name} ({classData.section})
      </h2>

      <p>Year: {classData.academic_year}</p>

      <hr />

      {/* Assign student */}
      <h3>Assign Student</h3>

      <select
        value={selectedStudent}
        onChange={(e) => setSelectedStudent(e.target.value)}
      >
        <option value="">Select student</option>

        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.first_name} {s.last_name}
          </option>
        ))}
      </select>

      <AppButton onClick={handleAssign}>Add</AppButton>

      <hr />

      {/* Students in class */}
      <h3>Students in Class</h3>

      <AppTable
        columns={columns}
        data={classData.students || []}
      />
    </div>
  );
}