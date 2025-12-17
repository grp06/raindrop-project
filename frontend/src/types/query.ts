export type QueryRow = Record<string, unknown>

export type QueryResponse = {
  sql: string
  columns: string[]
  rows: QueryRow[]
  error?: string
}
