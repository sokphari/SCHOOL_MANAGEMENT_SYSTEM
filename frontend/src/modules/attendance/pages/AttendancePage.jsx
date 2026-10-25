import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getClasses } from "@/modules/classes/api/classApi.ts";
import { getClass } from "@/modules/classes/api/classApi.ts";
import {
  getAttendanceByClassAndDate,
  bulkSaveAttendance,
} from "@/modules/attendance/api/attendanceApi";

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(() => searchParams.get("class_id") || "");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
    setAttendanceDate(new Date().toISOString().split("T")[0]);
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

    setSubmitting(true);

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
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const excusedCount = records.filter((r) => r.status === "excused").length;

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
          <i className="fas fa-check-circle" style={{ color: "#0d5c42" }} />
          Attendance Management
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Record and manage student attendance
        </p>
      </div>

      {/* Selection Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          <i className="fas fa-sliders-h" style={{ marginRight: "8px" }} />
          Select Class and Date
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Class Select */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              <i className="fas fa-book" style={{ marginRight: "6px" }} />
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.value} value={cls.value}>
                  {cls.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              <i className="fas fa-calendar" style={{ marginRight: "6px" }} />
              Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <button
          onClick={loadStudentsAndAttendance}
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: "#0d5c42",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#054e36";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(13, 92, 66, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#0d5c42";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        >
          <i className={loading ? "fas fa-spinner fa-spin" : "fas fa-upload"} />
          {loading ? "Loading..." : "Load Students"}
        </button>
      </div>

      {/* Attendance Summary */}
      {records.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #86efac",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <i
              className="fas fa-check-circle"
              style={{
                fontSize: "24px",
                color: "#15803d",
                marginBottom: "8px",
              }}
            />
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                color: "#15803d",
              }}
            >
              Present
            </p>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#15803d",
              }}
            >
              {presentCount}
            </p>
          </div>

          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <i
              className="fas fa-times-circle"
              style={{
                fontSize: "24px",
                color: "#991b1b",
                marginBottom: "8px",
              }}
            />
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                color: "#991b1b",
              }}
            >
              Absent
            </p>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#991b1b",
              }}
            >
              {absentCount}
            </p>
          </div>

          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <i
              className="fas fa-clock"
              style={{
                fontSize: "24px",
                color: "#92400e",
                marginBottom: "8px",
              }}
            />
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                color: "#92400e",
              }}
            >
              Late
            </p>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#92400e",
              }}
            >
              {lateCount}
            </p>
          </div>

          <div
            style={{
              background: "#e0e7ff",
              border: "1px solid #a5b4fc",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <i
              className="fas fa-check-double"
              style={{
                fontSize: "24px",
                color: "#3730a3",
                marginBottom: "8px",
              }}
            />
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                color: "#3730a3",
              }}
            >
              Permission
            </p>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#3730a3",
              }}
            >
              {excusedCount}
            </p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {loading ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: "32px", color: "#0d5c42", marginBottom: "16px" }}
          />
          <p style={{ color: "#6b7280", marginTop: "16px" }}>Loading attendance data...</p>
        </div>
      ) : records.length > 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <i className="fas fa-hashtag" style={{ marginRight: "8px" }} />
                    ID
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <i className="fas fa-user" style={{ marginRight: "8px" }} />
                    Student Name
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <i className="fas fa-check-circle" style={{ marginRight: "8px" }} />
                    Attendance
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <i className="fas fa-sticky-note" style={{ marginRight: "8px" }} />
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={record.student_id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      background: index % 2 === 0 ? "#fff" : "#f9fafb",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        index % 2 === 0 ? "#fff" : "#f9fafb";
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {record.student_id}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {record.student_name}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }} role="group" aria-label={`Attendance for ${record.student_name}`}>
                        {[
                          { value: "present", label: "Present", active: ["#dcfce7", "#166534", "#86efac"] },
                          { value: "absent", label: "Absent", active: ["#fee2e2", "#991b1b", "#fca5a5"] },
                          { value: "excused", label: "Permission", active: ["#e0e7ff", "#3730a3", "#a5b4fc"] },
                          { value: "late", label: "Late", active: ["#fef3c7", "#92400e", "#fcd34d"] },
                        ].map((option) => {
                          const selected = record.status === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => handleStatusChange(record.student_id, option.value)}
                              style={{
                                padding: "7px 10px",
                                border: `1px solid ${selected ? option.active[2] : "#d1d5db"}`,
                                borderRadius: "7px",
                                background: selected ? option.active[0] : "#fff",
                                color: selected ? option.active[1] : "#6b7280",
                                fontSize: "12px",
                                fontWeight: selected ? "700" : "500",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <input
                        type="text"
                        value={record.note}
                        onChange={(e) =>
                          handleNoteChange(record.student_id, e.target.value)
                        }
                        placeholder="Optional note..."
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontFamily: "inherit",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "12px 24px",
                background: "#25d366",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "#1da851";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(37, 211, 102, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "#25d366";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-save"} />
              {submitting ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <i
            className="fas fa-inbox"
            style={{ fontSize: "48px", color: "#d1d5db", marginBottom: "16px" }}
          />
          <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
            Select a class and date to load student attendance
          </p>
        </div>
      )}

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
