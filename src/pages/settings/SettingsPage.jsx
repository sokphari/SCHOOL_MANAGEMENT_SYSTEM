import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../../api/settingApi";
import AppInput from "../../components/common/AppInput";
import AppButton from "../../components/common/AppButton";

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
      setSuccess("Settings updated successfully");
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

  if (loading) return <p>Loading settings...</p>;

  return (
    <div>
      <h2>Settings</h2>

      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth: "700px" }}>
        <AppInput
          label="School Name"
          name="school_name"
          value={form.school_name}
          onChange={handleChange}
          error={errors.school_name?.[0]}
        />

        <AppInput
          label="School Phone"
          name="school_phone"
          value={form.school_phone}
          onChange={handleChange}
          error={errors.school_phone?.[0]}
        />

        <AppInput
          label="School Email"
          name="school_email"
          type="email"
          value={form.school_email}
          onChange={handleChange}
          error={errors.school_email?.[0]}
        />

        <AppInput
          label="School Address"
          name="school_address"
          value={form.school_address}
          onChange={handleChange}
          error={errors.school_address?.[0]}
        />

        <AppInput
          label="Telegram Chat ID"
          name="telegram_chat_id"
          value={form.telegram_chat_id}
          onChange={handleChange}
          error={errors.telegram_chat_id?.[0]}
        />

        <AppInput
          label="Logo URL"
          name="logo_url"
          value={form.logo_url}
          onChange={handleChange}
          error={errors.logo_url?.[0]}
        />

        <AppInput
          label="Banner URL"
          name="banner_url"
          value={form.banner_url}
          onChange={handleChange}
          error={errors.banner_url?.[0]}
        />

        <AppButton type="submit">
          {saving ? "Saving..." : "Save Settings"}
        </AppButton>
      </form>
    </div>
  );
}
