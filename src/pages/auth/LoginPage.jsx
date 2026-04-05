import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(form);
      navigate("/admin/dashboard");
    } catch (e) {
      if (e?.response?.status === 429) {
        alert("Too many login attempts. Please try again later.");
      } else {
        alert(e?.response?.data?.message || "Login failed");
      }
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <br />
        <br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
