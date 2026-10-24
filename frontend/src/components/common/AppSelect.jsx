export default function AppSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error = "",
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <label style={{ display: "block", marginBottom: "6px" }}>
          {label}
        </label>
      )}

      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "10px",
          border: error ? "1px solid red" : "1px solid #ccc",
          borderRadius: "6px",
        }}
      >
        <option value="">Select</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </p>
      )}
    </div>
  );
}