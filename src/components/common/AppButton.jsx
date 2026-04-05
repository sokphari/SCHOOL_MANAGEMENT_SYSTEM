export default function AppButton({ children, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} style={{ padding: "8px 14px", marginRight: "8px" }}>
      {children}
    </button>
  );
}