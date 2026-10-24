export default function AppInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = "",
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <label style={{ display: "block", marginBottom: "6px" }}>
          {label}
        </label>
      )}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px",
          border: error ? "1px solid red" : "1px solid #ccc",
          borderRadius: "6px",
        }}
      />

      {error && (
        <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </p>
      )}
    </div>
  );
}