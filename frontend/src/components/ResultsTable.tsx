import type { QueryRow } from "@/types/query"

type ResultsTableProps = {
  columns: string[]
  rows: QueryRow[]
}

function ResultsTable({ columns, rows }: ResultsTableProps) {
  if (rows.length === 0 || columns.length === 0) {
    return null
  }

  return (
    <table className="w-full text-base">
      <thead className="sticky -top-4 bg-muted">
        <tr className="text-left text-muted-foreground">
          {columns.map((column) => (
            <th key={column} className="border-b py-3 pr-6 font-medium">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b last:border-0">
            {columns.map((column) => (
              <td key={column} className="py-3 pr-6">
                {String(row[column] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ResultsTable
