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
    <table className="w-full text-sm">
      <thead className="sticky -top-2 -mx-3 px-3 bg-muted">
        <tr className="text-left text-muted-foreground">
          {columns.map((column) => (
            <th key={column} className="border-b py-2 pr-4 font-medium">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b last:border-0">
            {columns.map((column) => (
              <td key={column} className="py-2 pr-4">
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
