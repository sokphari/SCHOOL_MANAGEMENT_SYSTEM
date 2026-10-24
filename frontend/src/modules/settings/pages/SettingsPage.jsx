import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/modules/settings/api/settingApi";

export default function SettingsPage() {
  const [form, setForm] = useState({
    school_name: "",
    school_phone: "",
    school_email: "",
    school_address: "",
    telegram_chat_id: "",
    logo_url: "",
    banner_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [successTimeout, setSuccessTimeout] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      setForm({
        school_name: res.data.school_name || "",
        school_phone: res.data.school_phone || "",
        school_email: res.data.school_email || "",
        school_address: res.data.school_address || "",
        telegram_chat_id: res.data.telegram_chat_id || "",
        logo_url: res.data.logo_url || "",
        banner_url: res.data.banner_url || "",
      });
    } catch (e) {
      console.error(e);
      alert("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErrors({});
      setSuccess("");

      await updateSettings(form);
      setSuccess("Settings updated successfully!");

      // Auto-hide success message after 3 seconds
      const timeout = setTimeout(() => {
        setSuccess("");
      }, 3000);
      setSuccessTimeout(timeout);
    } catch (e) {
      console.error(e);

      if (e?.response?.status === 422) {
        setErrors(e.response.data.errors || {});
      } else {
        alert(e?.response?.data?.message || "Failed to update settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputFields = [
    {
      name: "school_name",
      label: "School Name",
      type: "text",
      icon: "fas fa-school",
      placeholder: "Enter school name",
    },
    {
      name: "school_phone",
      label: "School Phone",
      type: "tel",
      icon: "fas fa-phone",
      placeholder: "Enter school phone number",
    },
    {
      name: "school_email",
      label: "School Email",
      type: "email",
      icon: "fas fa-envelope",
      placeholder: "Enter school email address",
    },
    {
      name: "school_address",
      label: "School Address",
      type: "text",
      icon: "fas fa-map-marker-alt",
      placeholder: "Enter school address",
    },
    {
      name: "telegram_chat_id",
      label: "Telegram Chat ID",
      type: "text",
      icon: "fas fa-comments",
      placeholder: "Enter Telegram chat ID",
    },
    {
      name: "logo_url",
      label: "Logo URL",
      type: "url",
      icon: "fas fa-image",
      placeholder: "Enter logo image URL",
    },
    {
      name: "banner_url",
      label: "Banner URL",
      type: "url",
      icon: "fas fa-images",
      placeholder: "Enter banner image URL",
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: "40px", color: "#0d5c42", marginBottom: "20px" }}
        />
        <p style={{ color: "#6b7280", fontSize: "16px" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: "1000px", margin: "0 auto" }}>
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
          <i className="fas fa-cog" style={{ color: "#0d5c42" }} />
          System Settings
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Manage school information and system configuration
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div
          style={{
            background: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "slideDown 0.3s ease",
          }}
        >
          <i
            className="fas fa-check-circle"
            style={{ color: "#15803d", fontSize: "20px" }}
          />
          <p style={{ margin: 0, color: "#15803d", fontSize: "14px", fontWeight: "600" }}>
            {success}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {/* School Information Section */}
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingBottom: "12px",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <i className="fas fa-building" style={{ color: "#0d5c42" }} />
              School Information
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {inputFields.slice(0, 4).map((field) => (
                <div key={field.name}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <i
                      className={field.icon}
                      style={{ marginRight: "8px", color: "#0d5c42" }}
                    />
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: errors[field.name]
                        ? "2px solid #dc2626"
                        : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0d5c42";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(13, 92, 66, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = errors[field.name]
                        ? "#dc2626"
                        : "#e5e7eb";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {errors[field.name] && (
                    <p
                      style={{
                        margin: "6px 0 0 0",
                        fontSize: "12px",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <i className="fas fa-exclamation-circle" />
                      {errors[field.name][0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Integration Section */}
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingBottom: "12px",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <i className="fas fa-plug" style={{ color: "#2563eb" }} />
              Integration
            </h2>

            <div style={{ maxWidth: "300px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                <i
                  className="fas fa-comments"
                  style={{ marginRight: "8px", color: "#0d5c42" }}
                />
                Telegram Chat ID
              </label>
              <input
                type="text"
                name="telegram_chat_id"
                value={form.telegram_chat_id}
                onChange={handleChange}
                placeholder="Enter Telegram chat ID"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: errors.telegram_chat_id
                    ? "2px solid #dc2626"
                    : "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0d5c42";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(13, 92, 66, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.telegram_chat_id
                    ? "#dc2626"
                    : "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {errors.telegram_chat_id && (
                <p
                  style={{
                    margin: "6px 0 0 0",
                    fontSize: "12px",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i className="fas fa-exclamation-circle" />
                  {errors.telegram_chat_id[0]}
                </p>
              )}
            </div>
          </div>

          {/* Media Section */}
          <div>
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingBottom: "12px",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <i className="fas fa-image" style={{ color: "#ec4899" }} />
              Media & Branding
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {inputFields.slice(5).map((field) => (
                <div key={field.name}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    <i
                      className={field.icon}
                      style={{ marginRight: "8px", color: "#0d5c42" }}
                    />
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: errors[field.name]
                        ? "2px solid #dc2626"
                        : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0d5c42";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(13, 92, 66, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = errors[field.name]
                        ? "#dc2626"
                        : "#e5e7eb";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {errors[field.name] && (
                    <p
                      style={{
                        margin: "6px 0 0 0",
                        fontSize: "12px",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <i className="fas fa-exclamation-circle" />
                      {errors[field.name][0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
          }}
        >
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 32px",
              background: "#25d366",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background = "#1da851";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(37, 211, 102, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.background = "#25d366";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            <i className={saving ? "fas fa-spinner fa-spin" : "fas fa-save"} />
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving || loading}
            style={{
              padding: "12px 32px",
              background: "#e5e7eb",
              color: "#1f2937",
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
      </form>

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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
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