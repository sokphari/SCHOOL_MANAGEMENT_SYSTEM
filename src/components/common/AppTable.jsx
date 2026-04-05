export default function AppTable({ columns, data }) {
  return (
    <table border="1" cellPadding="10" cellSpacing="0" width="100%">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.title}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.length > 0 ? (
          data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center" }}>
              No data found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}