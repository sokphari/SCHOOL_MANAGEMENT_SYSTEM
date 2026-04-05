import { useEffect, useState } from "react";
import { getClasses } from "../../api/classApi";
import { getClass } from "../../api/classApi";
import {
  getAttendanceByClassAndDate,
  bulkSaveAttendance,
} from "../../api/attendanceApi";
import AppButton from "../../components/common/AppButton";
import AppSelect from "../../components/common/AppSelect";

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await getClasses();
      const data = res.data.data || [];

      setClasses(
        data.map((item) => ({
          label: `${item.name}${item.section ? ` (${item.section})` : ""}`,
          value: item.id,
        })),
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load classes");
    }
  };

  const loadStudentsAndAttendance = async () => {
    if (!selectedClass || !attendanceDate) {
      alert("Please select class and date");
      return;
    }

    setLoading(true);

    try {
      const [classRes, attendanceRes] = await Promise.all([
        getClass(selectedClass),
        getAttendanceByClassAndDate(selectedClass, attendanceDate),
      ]);

      const classStudents = classRes.data.students || [];
      const attendanceList = attendanceRes.data || [];

      const mapped = classStudents.map((student) => {
        const found = attendanceList.find(
          (item) => item.student_id === student.id,
        );

        return {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          status: found?.status || "present",
          note: found?.note || "",
        };
      });

      setStudents(classStudents);
      setRecords(mapped);
    } catch (error) {
      console.error(error);
      alert("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, value) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId ? { ...record, status: value } : record,
      ),
    );
  };

  const handleNoteChange = (studentId, value) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.student_id === studentId ? { ...record, note: value } : record,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!selectedClass || !attendanceDate) {
      alert("Please select class and date");
      return;
    }

    try {
      await bulkSaveAttendance(selectedClass, {
        attendance_date: attendanceDate,
        records: records.map((record) => ({
          student_id: record.student_id,
          status: record.status,
          note: record.note,
        })),
      });

      alert("Attendance saved successfully");
      loadStudentsAndAttendance();
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        JSON.stringify(error?.response?.data?.errors) ||
        "Failed to save attendance";

      alert(message);
    }
  };

  return (
    <div>
      <h2>Attendance</h2>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div style={{ minWidth: "250px" }}>
          <AppSelect
            label="Class"
            name="selectedClass"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classes}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px" }}>Date</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />
        </div>

        <div style={{ alignSelf: "end" }}>
          <AppButton onClick={loadStudentsAndAttendance}>
            Load Students
          </AppButton>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && records.length > 0 && (
        <div>
          <table border="1" cellPadding="10" cellSpacing="0" width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.student_id}>
                  <td>{record.student_id}</td>
                  <td>{record.student_name}</td>
                  <td>
                    <select
                      value={record.status}
                      onChange={(e) =>
                        handleStatusChange(record.student_id, e.target.value)
                      }
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={record.note}
                      onChange={(e) =>
                        handleNoteChange(record.student_id, e.target.value)
                      }
                      placeholder="Optional note"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "16px" }}>
            <AppButton onClick={handleSubmit}>Save Attendance</AppButton>
          </div>
        </div>
      )}
    </div>
  );
}
